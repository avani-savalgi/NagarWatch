const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { applyUnitScope, requireTier } = require('../middleware/rbac');
const { auditAction } = require('../middleware/auditLog');

const router = express.Router();

router.use(requireAuth, applyUnitScope);

// GET /api/fir?query=&status=&from=&to=
router.get('/', auditAction('SEARCH', (req) => ({ query: req.query })), async (req, res) => {
  const { query, status, from, to } = req.query;
  const params = [];
  const clauses = [];

  if (req.scopeUnitId) {
    params.push(req.scopeUnitId);
    clauses.push(`f.unitid = $${params.length}`);
  }

  if (query && query.trim()) {
    params.push(`%${query.trim()}%`);
    const pIdx = params.length;

    // Check user tier/role (e.g. IO_SHO or ADMIN)
    const isElevatedTier = ['IO_SHO', 'ADMIN'].includes(req.user?.tier || req.user?.role);

    // Standard fields searchable by all users (including Beat Constables)
    const searchConditions = [
      `f2.firnumber ILIKE $${pIdx}`,
      `f2.locationtext ILIKE $${pIdx}`,
      `f2.narrative ILIKE $${pIdx}`,
      `u2.unitname ILIKE $${pIdx}`,
      `a.accusedname ILIKE $${pIdx}`,
      `v.registrationnumber ILIKE $${pIdx}`
    ];

    // Build subquery JOINs dynamically based on user privilege tier
    let subqueryJoins = `
      JOIN unit u2 ON u2.unitid = f2.unitid
      LEFT JOIN accused a ON a.firid = f2.firid
      LEFT JOIN vehicle v ON v.firid = f2.firid
    `;

    // 🔒 RESTRICT SENSITIVE PII SEARCHES (Complainants & Victims) TO ELEVATED TIERS ONLY
    if (isElevatedTier) {
      subqueryJoins += `
        LEFT JOIN complainant c ON c.firid = f2.firid
        LEFT JOIN victim vic ON vic.firid = f2.firid
      `;
      searchConditions.push(`c.complainantname ILIKE $${pIdx}`);
      searchConditions.push(`vic.victimname ILIKE $${pIdx}`);
    }

    clauses.push(`f.firid IN (
      SELECT f2.firid FROM fir f2
      ${subqueryJoins}
      WHERE ${searchConditions.join(' OR ')}
    )`);
  }

  if (status) {
    params.push(status);
    clauses.push(`cs.statuslabel = $${params.length}`);
  }
  if (from) {
    params.push(from);
    clauses.push(`f.dateofoccurrence >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    clauses.push(`f.dateofoccurrence <= $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  try {
    const { rows } = await pool.query(
      `SELECT 
         f.firid AS "FIRID", 
         f.firnumber AS "FIRNumber", 
         f.datefiled AS "DateFiled", 
         f.dateofoccurrence AS "DateOfOccurrence", 
         f.locationtext AS "LocationText",
         f.isheinous AS "IsHeinous", 
         cs.statuslabel AS "StatusLabel", 
         u.unitname AS "UnitName",
         ST_X(f.location) AS lng, 
         ST_Y(f.location) AS lat
       FROM fir f
       JOIN casestatusref cs ON cs.casestatusid = f.casestatusid
       JOIN unit u ON u.unitid = f.unitid
       ${where}
       ORDER BY f.dateofoccurrence DESC
       LIMIT 200`,
      params
    );
    res.json({ results: rows });
  } catch (err) {
    console.error('[fir/search] error:', err.message);
    res.status(500).json({ error: 'FIR search failed.' });
  }
});

// GET /api/fir/:id — full case detail. IO/SHO and above only.
router.get('/:id', requireTier('IO_SHO'), auditAction('VIEW_FIR', (req) => ({ firId: req.params.id })), async (req, res) => {
  try {
    const firResult = await pool.query(
      `SELECT f.*, cs.statuslabel AS "StatusLabel", u.unitname AS "UnitName"
       FROM fir f
       JOIN casestatusref cs ON cs.casestatusid = f.casestatusid
       JOIN unit u ON u.unitid = f.unitid
       WHERE f.firid = $1`,
      [req.params.id]
    );
    if (!firResult.rows.length) return res.status(404).json({ error: 'FIR not found.' });

    const [victims, accused, vehicles, complainants] = await Promise.all([
      pool.query(`SELECT * FROM victim WHERE firid = $1`, [req.params.id]),
      pool.query(`SELECT * FROM accused WHERE firid = $1`, [req.params.id]),
      pool.query(`SELECT * FROM vehicle WHERE firid = $1`, [req.params.id]),
      pool.query(`SELECT * FROM complainant WHERE firid = $1`, [req.params.id])
    ]);

    res.json({
      fir: firResult.rows[0],
      victims: victims.rows,
      accused: accused.rows,
      vehicles: vehicles.rows,
      complainants: complainants.rows
    });
  } catch (err) {
    console.error('[fir/detail] error:', err.message);
    res.status(500).json({ error: 'Could not load case detail.' });
  }
});

module.exports = router;