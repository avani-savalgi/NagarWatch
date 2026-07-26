require('dotenv').config();
//const path = require('path');
const express = require('express');

const { requireAuth } = require('./middleware/auth');
const { piiRedactionMiddleware } = require('./middleware/piiRedaction');

const authRoutes = require('./routes/auth');
const firRoutes = require('./routes/fir');
const dashboardRoutes = require('./routes/dashboard');
const mapRoutes = require('./routes/map');
const aiRoutes = require('./routes/ai');
const auditRoutes = require('./routes/audit');
const linkAnalysisRoutes = require('./routes/linkAnalysis');
const analyticsRoutes = require('./routes/analytics');

const app = express();

// Trust the AppSail proxy so req.ip / X-Forwarded-For resolve correctly
app.set('trust proxy', 1);

// Temporary diagnostic logging
app.use((req, res, next) => {
  console.log(`[req] ${req.method} ${req.path} origin=${req.headers.origin || 'none'}`);
  next();
});

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'nagarwatch-backend' }));

app.use('/api/auth', authRoutes);

const protectedRouter = express.Router();
protectedRouter.use(requireAuth, piiRedactionMiddleware);

protectedRouter.use('/fir', firRoutes);
protectedRouter.use('/dashboard', dashboardRoutes);
protectedRouter.use('/map', mapRoutes);
protectedRouter.use('/ai', aiRoutes);
protectedRouter.use('/audit', auditRoutes);
protectedRouter.use('/links', linkAnalysisRoutes);
protectedRouter.use('/analytics', analyticsRoutes);

app.use('/api', protectedRouter);

// Serve the built frontend (same-origin — no CORS needed)
//app.use(express.static(path.join(__dirname, '..', 'public')));

// app.get('*', (req, res, next) => {
//   if (req.path.startsWith('/api/')) return next();
//   res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
// });

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`NagarWatch backend listening on port ${PORT}`);
});