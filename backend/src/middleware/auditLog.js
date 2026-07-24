const { pool } = require('../config/db');

/**
 * Writes one row per significant action to AuditLog. Table-level
 * REVOKE UPDATE, DELETE (see db/schema.sql comment) makes this an
 * append-only / WORM trail once applied at the database role level.
 */
async function recordAudit({ employeeId, kgid, actionType, actionDetail, ip }) {
  try {
    await pool.query(
      `INSERT INTO AuditLog (EmployeeID, KGID, ActionType, ActionDetail, IPAddress)
       VALUES ($1, $2, $3, $4, $5)`,
      [employeeId || null, kgid || null, actionType, actionDetail ? JSON.stringify(actionDetail) : null, ip]
    );
  } catch (err) {
    // Audit logging must never crash the request, but must be visible in server logs.
    console.error('[auditLog] failed to write audit row:', err.message);
  }
}

/** Express middleware factory: logs every request to a route as `actionType`. */
function auditAction(actionType, detailFn = () => undefined) {
  return async (req, res, next) => {
    const user = req.user || {};
    await recordAudit({
      employeeId: user.employeeId,
      kgid: user.kgid,
      actionType,
      actionDetail: detailFn(req),
      ip: req.ip
    });
    next();
  };
}

module.exports = { recordAudit, auditAction };
