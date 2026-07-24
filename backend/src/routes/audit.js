const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { requireTier } = require('../middleware/rbac');

const router = express.Router();
router.use(requireAuth, requireTier('SP_SCRB_ADMIN'));

// GET /api/audit?limit=100
router.get('/', async (req, res, next) => {
  const parsed = parseInt(req.query.limit, 10);
  const limit = Math.min(isNaN(parsed) || parsed <= 0 ? 100 : parsed, 500);

  try {
    const { rows } = await pool.query(
      `SELECT 
        auditlogid AS "AuditLogID", 
        employeeid AS "EmployeeID", 
        kgid AS "KGID", 
        actiontype AS "ActionType", 
        actiondetail AS "ActionDetail", 
        ipaddress AS "IPAddress", 
        createdat AS "CreatedAt"
       FROM auditlog 
       ORDER BY createdat DESC 
       LIMIT $1`,
      [limit]
    );

    res.json({ results: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
