const express = require('express');
const { pool } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { requireTier } = require('../middleware/rbac');

const router = express.Router();
router.use(requireAuth, requireTier('IO_SHO'));

// 1. GET /api/links/samples — Sample accused list for frontend dropdown testing
// Note: Static routes MUST be placed before dynamic routes (/:query)
router.get('/samples', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT accusedid, accusedname FROM accused LIMIT 15;`
    );
    res.json(rows);
  } catch (err) {
    console.error('[links/samples] error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve sample accused.' });
  }
});

// 2. GET /api/links/:query — Search graph by Accused UUID OR Accused Name
router.get('/:query', async (req, res) => {
  try {
    const searchInput = (req.params.query || '').trim();

    if (!searchInput) {
      return res.status(400).json({ error: 'Search query cannot be empty.' });
    }

    // Check if input matches UUID pattern
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchInput);

    let center;
    if (isUuid) {
      center = await pool.query(
        `SELECT accusedid, accusedname, isrepeatoffender FROM accused WHERE accusedid = $1`,
        [searchInput]
      );
    } else {
      // Search by partial/exact Accused Name (case-insensitive)
      center = await pool.query(
        `SELECT accusedid, accusedname, isrepeatoffender FROM accused WHERE accusedname ILIKE $1 LIMIT 1`,
        [`%${searchInput}%`]
      );
    }

    if (!center.rows.length) {
      return res.status(404).json({ error: `No accused record found for "${searchInput}".` });
    }

    const centerRecord = center.rows[0];
    const centerId = centerRecord.accusedid;

    // Fetch network links connected to the resolved center accused ID
    const links = await pool.query(
      `SELECT al.linkid, al.linktype, al.linkstrength,
              a1.accusedid AS a_id, a1.accusedname AS a_name, a1.isrepeatoffender AS a_repeat,
              a2.accusedid AS b_id, a2.accusedname AS b_name, a2.isrepeatoffender AS b_repeat
       FROM accusedlink al
       JOIN accused a1 ON a1.accusedid = al.accusedid_a
       JOIN accused a2 ON a2.accusedid = al.accusedid_b
       WHERE al.accusedid_a = $1 OR al.accusedid_b = $1`,
      [centerId]
    );

    const nodesMap = new Map();

    // Center node
    nodesMap.set(String(centerId), {
      id: String(centerId),
      label: centerRecord.accusedname,
      isCenter: true,
      isRepeatOffender: centerRecord.isrepeatoffender
    });

    // Populate satellite nodes & edge connections
    const edges = links.rows.map(l => {
      const aId = String(l.a_id);
      const bId = String(l.b_id);

      if (!nodesMap.has(aId)) {
        nodesMap.set(aId, {
          id: aId,
          label: l.a_name,
          isCenter: false,
          isRepeatOffender: l.a_repeat
        });
      }

      if (!nodesMap.has(bId)) {
        nodesMap.set(bId, {
          id: bId,
          label: l.b_name,
          isCenter: false,
          isRepeatOffender: l.b_repeat
        });
      }

      return {
        id: l.linkid,
        source: aId,
        target: bId,
        type: l.linktype,
        strength: Number(l.linkstrength || 1)
      };
    });

    res.json({
      centerAccusedId: centerId,
      centerAccusedName: centerRecord.accusedname,
      nodes: Array.from(nodesMap.values()),
      edges
    });
  } catch (err) {
    console.error('[links/graph] error:', err.message);
    res.status(500).json({ error: 'Could not load link analysis data.' });
  }
});

module.exports = router;