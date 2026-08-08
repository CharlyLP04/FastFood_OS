const { Pool } = require('pg');

// Detectar si la URL es interna de Render (no requiere SSL)
const dbUrl = process.env.DB_URL || '';
const isInternalRender = dbUrl.includes('.internal');
const sslConfig = isInternalRender
  ? false
  : (dbUrl.includes('neon.tech') || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: sslConfig,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = pool;