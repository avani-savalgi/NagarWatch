const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { applyUnitScope } = require('../middleware/rbac');

const router = express.Router();
router.use(requireAuth, applyUnitScope);

// GET /api/dashboard/summary —stats for the overview tab.
router.get('/summary', async (req, res) => {
  const unitClause = req.scopeUnitId ? `WHERE UnitID = $1` : '';
  const params = req.scopeUnitId ? [req.scopeUnitId] : [];

  try {
    const totals = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE TRUE) AS total_fir,
         COUNT(*) FILTER (WHERE IsHeinous) AS heinous_count,
         COUNT(*) FILTER (WHERE DateFiled >= now() - interval '7 days') AS last7days,
         COUNT(*) FILTER (WHERE CaseStatusID IN (SELECT CaseStatusID FROM CaseStatusRef WHERE StatusLabel IN ('Convicted','Charge-sheeted'))) AS resolved
       FROM FIR ${unitClause}`,
      params
    );

    const byStatus = await pool.query(
      `SELECT cs.StatusLabel, COUNT(*) AS count
       FROM FIR f JOIN CaseStatusRef cs ON cs.CaseStatusID = f.CaseStatusID
       ${req.scopeUnitId ? 'WHERE f.UnitID = $1' : ''}
       GROUP BY cs.StatusLabel ORDER BY count DESC`,
      params
    );

    const byOffenceCategory = await pool.query(
      `SELECT ls.OffenceCategory, COUNT(*) AS count
       FROM FIR f
       JOIN FIRLegalSection fls ON fls.FIRID = f.FIRID
       JOIN LegalSection ls ON ls.LegalSectionID = fls.LegalSectionID
       ${req.scopeUnitId ? 'WHERE f.UnitID = $1' : ''}
       GROUP BY ls.OffenceCategory ORDER BY count DESC`,
      params
    );

    res.json({
      totals: totals.rows[0],
      byStatus: byStatus.rows,
      byOffenceCategory: byOffenceCategory.rows
    });
  } catch (err) {
    console.error('[dashboard/summary] error:', err.message);
    res.status(500).json({ error: 'Could not load dashboard summary.' });
  }
});

module.exports = router;
