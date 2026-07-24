// Automatic PII redaction .
//
// Only IO_SHO and SP_SCRB_ADMIN tiers ever see complainant/victim names,
// contact details, religion, or caste category fields. BEAT_CONSTABLE
// always receives these fields masked. This is applied as a response
// transform rather than left to individual routes, so a route can never
// accidentally leak a field by omission.
//
// IMPORTANT: Religion/caste fields are collected only because they are a
// mandatory field on the statutory Indian FIR form. They are NEVER read by
// any ranking, scoring, hotspot, or "repeat offender" logic in this codebase
// (see routes/dashboard.js and routes/map.js, which query FIRHotspotView —
// a view that does not expose these columns at all). Do not wire them into
// any predictive/analytical feature; keep them display-only and gated to
// the tiers below.

const RESTRICTED_FIELDS = [
  'ComplainantName', 'PhoneNumber', 'Address',
  'VictimName', 'ReligionID', 'ReligionLabel', 'CasteID', 'CasteCategoryLabel',
  'AgeYear'
];

function maskValue() {
  return '••• (restricted — requires IO/SHO access)';
}

/**
 * Recursively redacts restricted fields from a JSON payload for
 * BEAT_CONSTABLE tier users. IO_SHO and SP_SCRB_ADMIN pass through untouched.
 */
function redactForResponse(data, accessTier) {
  if (accessTier !== 'BEAT_CONSTABLE') return data;

  const redactRecursive = (node) => {
    if (Array.isArray(node)) return node.map(redactRecursive);
    if (node && typeof node === 'object') {
      const out = {};
      for (const [key, value] of Object.entries(node)) {
        if (RESTRICTED_FIELDS.includes(key)) {
          out[key] = maskValue();
        } else {
          out[key] = redactRecursive(value);
        }
      }
      return out;
    }
    return node;
  };

  return redactRecursive(data);
}

/** Express middleware: wraps res.json so every route gets redaction for free. */
function piiRedactionMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (body) => originalJson(redactForResponse(body, req.user && req.user.accessTier));
  next();
}

module.exports = { piiRedactionMiddleware, redactForResponse };
