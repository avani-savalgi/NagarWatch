const express = require('express');
const fetch = require('node-fetch');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { applyUnitScope, requireTier } = require('../middleware/rbac');
const { auditAction } = require('../middleware/auditLog');

const router = express.Router();
router.use(requireAuth, applyUnitScope);

// Only IO/SHO and above get the AI assistant.
router.use(requireTier('IO_SHO'));

// Updated to exact lowercase column names matching PostgreSQL
const SCHEMA_SUMMARY = `
Tables available for SELECT-only querying:
- fir(firid, firnumber, unitid, datefiled, dateofoccurrence, locationtext, casestatusid, isheinous)
- casestatusref(casestatusid, statuslabel)
- unit(unitid, unitname, districtname)
- legalsection(legalsectionid, actname, sectionnumber, offencecategory, isheinous)
- firlegalsection(firid, legalsectionid)
- accused(accusedid, firid, accusedname, isarrested, isrepeatoffender)
Note: Victim/Complainant PII tables (names, religion, caste, phone, address) are
NOT exposed to this assistant under any circumstance.
`.trim();

const SYSTEM_PROMPT = `You are the NagarWatch case-intelligence assistant for Karnataka Police officers.
You translate a plain-language question into a single read-only PostgreSQL SELECT query
against the schema below, then explain the result in plain language.

${SCHEMA_SUMMARY}

Rules (must never be broken):
1. Only ever produce SELECT statements. Never INSERT, UPDATE, DELETE, DROP, ALTER, or GRANT.
2. Never reference Victim, Complainant, ReligionRef, or CasteRef tables/columns.
3. Never write a query whose purpose is to rank, score, or flag people by religion,
   caste, gender, or any protected characteristic.
4. If the question cannot be answered with a safe, read-only query against the
   schema above, say so instead of guessing.
Respond ONLY as JSON: {"sql": "...", "explanation": "..."} with no markdown fences.`;

const FORBIDDEN_SQL = /\b(insert|update|delete|drop|alter|grant|truncate|create|--|;.*\S)/i;

async function callOpenRouter(model, prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://nagarwatch.local',
      'X-Title': 'NagarWatch'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`❌ OpenRouter Error (${model}): Status ${response.status} -> ${text}`);
    throw new Error(`OpenRouter ${response.status}: ${text.slice(0, 300)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

router.post('/query', auditAction('AI_QUERY', (req) => ({ prompt: req.body?.prompt })), async (req, res) => {
  // Safe default model fallbacks if .env variables are missing
  const primaryModel = process.env.OPENROUTER_MODEL_PRIMARY || 'openrouter/free';
  const fallbackModel = process.env.OPENROUTER_MODEL_FALLBACK || 'google/gemma-2-9b-it:free';

  //uncomment below 2 lines to test which model is being used.
  // console.log('🤖 OpenRouter Key Status:', process.env.OPENROUTER_API_KEY ? 'EXISTS' : 'MISSING');
  // console.log('🤖 Primary Model:', primaryModel);

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A natural-language "prompt" string is required.' });
  }

  let modelUsed = primaryModel;
  let raw;
  try {
    raw = await callOpenRouter(modelUsed, prompt);
  } catch (primaryErr) {
    console.warn('[ai/query] primary model failed, trying fallback:', primaryErr.message);
    modelUsed = fallbackModel;
    try {
      raw = await callOpenRouter(modelUsed, prompt);
    } catch (fallbackErr) {
      console.error('[ai/query] fallback model also failed:', fallbackErr.message);
      return res.status(502).json({ error: 'The AI assistant is temporarily unavailable. Please try again shortly.' });
    }
  }

  let parsed;
  try {
    // Robust Regex JSON Extraction: Extracts { ... } even if wrapped in markdown code fences or conversational prose
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in model output');
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseErr) {
    console.error('[ai/query] JSON parsing failed. Raw response was:', raw);
    return res.status(502).json({ 
      error: 'The AI assistant returned an unreadable response.', 
      detail: parseErr.message, 
      raw 
    });
  }

  const sql = (parsed.sql || '').trim();
  const isSelectOnly = /^select\b/i.test(sql);
  const isSafe = isSelectOnly && !FORBIDDEN_SQL.test(sql);

  // Log AI query attempt to PostgreSQL audit table
  await pool.query(
    `INSERT INTO AIQueryLog (EmployeeID, PromptText, GeneratedSQL, ModelUsed, Success)
     VALUES ($1, $2, $3, $4, $5)`,
    [req.user?.employeeId || null, prompt, sql, modelUsed, isSafe]
  ).catch(e => console.error('[ai/query] failed to write AIQueryLog:', e.message));

  if (!isSafe) {
    return res.status(400).json({
      error: 'The generated query did not pass safety checks and was not executed.',
      explanation: parsed.explanation || null
    });
  }

  try {
    // Execute inside a read-only transaction for maximum database safety
    const client = await pool.connect();
    let rows;
    try {
      await client.query('BEGIN TRANSACTION READ ONLY');
      const result = await client.query(sql);
      rows = result.rows;
      await client.query('COMMIT');
    } finally {
      client.release();
    }
    res.json({ sql, explanation: parsed.explanation, modelUsed, rows });
  } catch (err) {
    console.error('[ai/query] execution error:', err.message);
    res.status(400).json({ error: 'The generated query failed to execute.', detail: err.message, sql });
  }
});

module.exports = router;