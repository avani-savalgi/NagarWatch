// Three access tiers:
//   BEAT_CONSTABLE  — view-only, station-scoped
//   IO_SHO          — full operational access, FIR detail, link analysis, MO search
//   SP_SCRB_ADMIN   — state-wide analytics, raw query execution, audit log access

const TIER_RANK = { BEAT_CONSTABLE: 1, IO_SHO: 2, SP_SCRB_ADMIN: 3 };

/**
 * requireTier('IO_SHO') allows IO_SHO and SP_SCRB_ADMIN through,
 * but blocks BEAT_CONSTABLE.
 */
function requireTier(minTier) {
  const minRank = TIER_RANK[minTier];
  return (req, res, next) => {
    const userTier = req.user && req.user.accessTier;
    const userRank = TIER_RANK[userTier] || 0;
    if (userRank < minRank) {
      return res.status(403).json({
        error: `This action requires ${minTier.replace('_', ' ')} access or higher.`
      });
    }
    next();
  };
}

/**
 * Restricts a data query to the officer's own unit/station unless they
 * hold SP_SCRB_ADMIN (state-wide) access. Attaches `req.scopeUnitId`
 * (null means "no restriction — state-wide").
 */
function applyUnitScope(req, res, next) {
  if (req.user.accessTier === 'SP_SCRB_ADMIN') {
    req.scopeUnitId = null;
  } else {
    req.scopeUnitId = req.user.unitId;
  }
  next();
}

module.exports = { requireTier, applyUnitScope };
