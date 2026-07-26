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

// Trust the AppSail proxy so req.ip / X-Forwarded-For resolve correctly
app.set('trust proxy', 1);

// CORS — restricted to explicit allowed origins via env var
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

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