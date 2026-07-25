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
        -- Extract category directly from narrative string or fall back to General
        COALESCE(
          NULLIF(TRIM(substring(narrative FROM 'Offence category:\s*([^.]+)\.')), ''),
          'General'
        ) AS offencecategory,
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

// GET /api/map/categories (For dynamically populating your frontend dropdown!)
router.get('/categories', requireAuth, async (req, res, next) => {
  try {
    const query = `
      SELECT DISTINCT 
        COALESCE(
          NULLIF(TRIM(substring(narrative FROM 'Offence category:\s*([^.]+)\.')), ''),
          'General'
        ) AS category
      FROM fir
      ORDER BY category ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows.map(r => r.category));
  } catch (err) {
    console.error('Fetch map categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

module.exports = router;