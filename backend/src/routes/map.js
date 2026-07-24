const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/map/hotspots
router.get('/hotspots', requireAuth, async (req, res, next) => {
  try {
    const query = `
      SELECT 
        firid,
        firnumber AS firno,
        dateofoccurrence,
        COALESCE(isheinous, false) AS isheinous,
        CASE 
          WHEN narrative ILIKE '%cyber%' OR narrative ILIKE '%fraud%' THEN 'Cyber Crime'
          WHEN narrative ILIKE '%theft%' OR narrative ILIKE '%stolen%' THEN 'Theft'
          WHEN narrative ILIKE '%burglary%' OR narrative ILIKE '%house%' THEN 'Burglary'
          WHEN narrative ILIKE '%assault%' OR narrative ILIKE '%attack%' THEN 'Assault'
          ELSE 'General'
        END AS offencecategory,
        CASE 
          WHEN location IS NOT NULL THEN ST_Y(location)::float
          ELSE (12.9716 + (ROW_NUMBER() OVER () * 0.008))::float
        END AS latitude,
        CASE 
          WHEN location IS NOT NULL THEN ST_X(location)::float
          ELSE (77.5946 + (ROW_NUMBER() OVER () * 0.008))::float
        END AS longitude
      FROM fir;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Map hotspots query error:', err);
    res.status(500).json({ error: 'Failed to fetch map hotspots.' });
  }
});

module.exports = router;