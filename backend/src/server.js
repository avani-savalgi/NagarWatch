require('dotenv').config();
const express = require('express');
const cors = require('cors');

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

// CORS configuration with credentials support
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true 
}));

app.use(express.json({ limit: '1mb' }));

// Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'nagarwatch-backend' }));

// Public Routes
app.use('/api/auth', authRoutes);

// Protected API Router Group
const protectedRouter = express.Router();
protectedRouter.use(requireAuth, piiRedactionMiddleware);

protectedRouter.use('/fir', firRoutes);
protectedRouter.use('/dashboard', dashboardRoutes);
protectedRouter.use('/map', mapRoutes);
protectedRouter.use('/ai', aiRoutes);
protectedRouter.use('/audit', auditRoutes);
protectedRouter.use('/links', linkAnalysisRoutes);
protectedRouter.use('/analytics', analyticsRoutes);

// Mount protected router group under /api
app.use('/api', protectedRouter);

// 404 Handler
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.X_ZOHO_CATALYST_PORT || process.env.PORTprocess.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`NagarWatch backend listening on port ${PORT}`);
});
