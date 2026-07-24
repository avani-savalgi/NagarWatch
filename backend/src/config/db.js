const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase SSL connection
  },
  max: 10,
  idleTimeoutMillis: 30000
});

pool.on('error', (err) => {
  console.error('[db] unexpected error on idle client', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params)
};