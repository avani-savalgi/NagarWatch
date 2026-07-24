const express = require('express');
const router = express.Router();
const db = require('../config/db'); //pg pool

// 1. GET /api/analytics/summary-stats
router.get('/summary-stats', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        COUNT(*)::int AS "totalFirs",
        COUNT(CASE WHEN isheinous = true THEN 1 END)::int AS "heinousCount",
        COUNT(CASE WHEN casestatusid = 1 OR casestatusid IS NULL THEN 1 END)::int AS "underInvestigation",
        COUNT(CASE WHEN casestatusid = 2 THEN 1 END)::int AS "chargeSheeted"
      FROM fir;
    `;
    const { rows } = await db.query(query);
    res.json(rows[0] || { totalFirs: 0, heinousCount: 0, underInvestigation: 0, chargeSheeted: 0 });
  } catch (err) {
    console.error('Summary stats query error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/analytics/monthly-trends
router.get('/monthly-trends', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        TO_CHAR(dateofoccurrence, 'Mon') AS month,
        EXTRACT(MONTH FROM dateofoccurrence) AS month_num,
        COUNT(CASE WHEN narrative ILIKE '%theft%' OR narrative ILIKE '%stolen%' THEN 1 END)::int AS "Theft",
        COUNT(CASE WHEN narrative ILIKE '%burglary%' OR narrative ILIKE '%housebreaking%' OR narrative ILIKE '%trespass%' THEN 1 END)::int AS "Burglary",
        COUNT(CASE WHEN narrative ILIKE '%cyber%' OR narrative ILIKE '%fraud%' OR narrative ILIKE '%phishing%' OR narrative ILIKE '%online%' OR narrative ILIKE '%otp%' THEN 1 END)::int AS "Cyber Crime",
        COUNT(CASE WHEN narrative ILIKE '%robbery%' OR narrative ILIKE '%snatching%' OR narrative ILIKE '%extortion%' OR narrative ILIKE '%dacoity%' THEN 1 END)::int AS "Robbery & Extortion",
        COUNT(CASE WHEN narrative ILIKE '%assault%' OR narrative ILIKE '%attack%' OR narrative ILIKE '%hurt%' OR narrative ILIKE '%fight%' OR narrative ILIKE '%battery%' THEN 1 END)::int AS "Assault & Violence",
        COUNT(CASE WHEN narrative ILIKE '%vehicle%' OR narrative ILIKE '%car%' OR narrative ILIKE '%bike%' OR narrative ILIKE '%scooter%' OR narrative ILIKE '%motorcycle%' THEN 1 END)::int AS "Vehicle Theft",
        COUNT(CASE WHEN narrative ILIKE '%murder%' OR narrative ILIKE '%homicide%' OR narrative ILIKE '%killing%' OR narrative ILIKE '%stab%' THEN 1 END)::int AS "Homicide",
        COUNT(CASE WHEN narrative ILIKE '%narcotic%' OR narrative ILIKE '%drug%' OR narrative ILIKE '%ganja%' OR narrative ILIKE '%contraband%' OR narrative ILIKE '%ndps%' THEN 1 END)::int AS "Narcotics",
        COUNT(CASE WHEN narrative ILIKE '%dowry%' OR narrative ILIKE '%harassment%' OR narrative ILIKE '%domestic%' OR narrative ILIKE '%stalking%' OR narrative ILIKE '%molestation%' THEN 1 END)::int AS "Domestic & Harassment"
      FROM fir
      WHERE dateofoccurrence IS NOT NULL
      GROUP BY TO_CHAR(dateofoccurrence, 'Mon'), EXTRACT(MONTH FROM dateofoccurrence)
      ORDER BY month_num;
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Monthly trends query error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. GET /api/analytics/hourly-severity
router.get('/hourly-severity', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        EXTRACT(HOUR FROM dateofoccurrence)::int AS hour,
        CASE 
          WHEN isheinous = true THEN 8
          ELSE 3
        END AS severity,
        firnumber
      FROM fir
      WHERE dateofoccurrence IS NOT NULL;
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Hourly severity query error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;