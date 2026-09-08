/**
 * initDb.js — Inicialización automática de la base de datos
 *
 * Ejecuta el schema.sql al arrancar el servidor en producción
 * si las tablas no existen aún. Es idempotente (usa IF NOT EXISTS).
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initDb() {
  const pool = new Pool({
    connectionString: process.env.DB_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  let client;
  try {
    client = await pool.connect();

    // Verificar si las tablas ya existen
    const { rows } = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'roles'
    `);

    if (parseInt(rows[0].count) > 0) {
      console.log('✅ [initDb] Base de datos ya inicializada, omitiendo schema.');
      return;
    }

    console.log('🔧 [initDb] Primera vez — ejecutando schema.sql...');
    const schemaPath = path.join(__dirname, '..', '..', 'db', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(sql);
    console.log('✅ [initDb] Schema ejecutado exitosamente.');
    console.log('📋 [initDb] Tablas creadas: roles, usuarios, categorias, productos,');
    console.log('            ingredientes, inventario, mesas, pedidos, ventas...');
    console.log('🌱 [initDb] Datos semilla insertados.');
  } catch (err) {
    console.error('❌ [initDb] Error al inicializar la base de datos:', err.message);
    // No matar el proceso — el servidor puede seguir con errores de DB
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

module.exports = initDb;
