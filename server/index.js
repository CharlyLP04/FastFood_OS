const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// HU-4: Validar variables de entorno críticas ANTES de cargar cualquier módulo.
const validateEnv = require('./src/config/validateEnv');
validateEnv();

// Auto-inicialización de la base de datos (corre schema.sql si es primera vez)
const initDb = require('./src/config/initDb');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const { corsOptions } = require('./src/config/corsConfig');
const { helmetOptions } = require('./src/config/helmetConfig');

const authRoutes = require('./src/routes/authRoutes');
const rutas = require('./src/routes/index');

// Inicializar la aplicación Express
const app = express();

// Necesario para Render/Heroku: confiar en el proxy reverso
app.set('trust proxy', 1);

// Puerto desde variables de entorno
const PUERTO = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────
// SEGURIDAD: Headers HTTP (helmet) — debe ir antes de cualquier ruta
// ─────────────────────────────────────────────────────────────

app.use(helmet(helmetOptions));

// ─────────────────────────────────────────────────────────────
// CORS — whitelist explícita, sin wildcard "*"
// Orígenes permitidos se configuran en src/config/corsConfig.js
// y en la variable de entorno ALLOWED_ORIGINS (producción).
// ─────────────────────────────────────────────────────────────

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Pre-flight para todos los endpoints

// ─────────────────────────────────────────────────────────────
// IMPORTANTE: LOS PARSERS VAN ANTES DE LAS RUTAS
// ─────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // HU-5: necesario para leer req.cookies.access_token

// Validación de Origen para métodos mutadores (POST, PUT, PATCH, DELETE)
const { verifyOrigin } = require('./src/middleware/verifyOrigin');
app.use(verifyOrigin);

// ─────────────────────────────────────────────────────────────
// RUTAS
// ─────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);
app.use('/api', rutas);
app.use('/', rutas);

// ─────────────────────────────────────────────────────────────
// 404
// ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    ruta: req.originalUrl,
  });
});

// ─────────────────────────────────────────────────────────────
// ERROR GLOBAL
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: err.message,
  });
});

// ─────────────────────────────────────────────────────────────

// Exportar la aplicación para que Vercel Serverless Functions pueda manejarla
module.exports = app;

// Iniciar servidor solo si no estamos en el entorno serverless de Vercel
if (!process.env.VERCEL) {
  // Inicializar DB antes de aceptar peticiones
  initDb().then(() => {
    app.listen(PUERTO, () => {
      console.log(`🍔 Servidor FastFood OS corriendo en http://localhost:${PUERTO}`);
      console.log(`📡 Entorno: ${process.env.NODE_ENV || 'desarrollo'}`);
    });
  });
}
