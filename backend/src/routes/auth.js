const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/db');
const { recordAudit } = require('../middleware/auditLog');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { kgid, password } = req.body || {};
  if (!kgid || !password) {
    return res.status(400).json({ error: 'KGID and password are required.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT e.EmployeeID, e.KGID, e.FullName, e.PasswordHash, e.UnitID,
              d.AccessTier, r.RankLevel
       FROM Employee e
       JOIN Designation d ON d.DesignationID = e.DesignationID
       JOIN Rank r ON r.RankID = e.RankID
       WHERE e.KGID = $1 AND e.IsActive = TRUE`,
      [kgid]
    );

    const employee = rows[0];
    const passwordOk = employee && await bcrypt.compare(password, employee.passwordhash);

    if (!employee || !passwordOk) {
      await recordAudit({ actionType: 'LOGIN_FAILED', actionDetail: { kgid }, ip: req.ip });
      return res.status(401).json({ error: 'Invalid KGID or password.' });
    }

    const payload = {
      employeeId: employee.employeeid,
      kgid: employee.kgid,
      fullName: employee.fullname,
      accessTier: employee.accesstier,
      unitId: employee.unitid,
      rankLevel: employee.ranklevel
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    await recordAudit({ employeeId: employee.employeeid, kgid: employee.kgid, actionType: 'LOGIN', ip: req.ip });

    res.json({ token, user: payload });
  } catch (err) {
    console.error('[auth/login] error:', err.message);
    res.status(500).json({ error: 'Login failed due to a server error.' });
  }
});

module.exports = router;
