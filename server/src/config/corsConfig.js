/**
 * corsConfig.js — Configuración CORS con whitelist explícita para A La Burger OS
 *
 * PRODUCCIÓN: solo dominios de Vercel autorizados y el backend en Render.
 * DESARROLLO: localhost en los puertos habituales de Vite (5173) y Express (3000).
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * NOTA FUTURA (HU-JWT-COOKIES):
 *   Cuando el JWT se mueva de localStorage a httpOnly cookies, descomentar
 *   `credentials: true` en el objeto de opciones de abajo. Las cookies
 *   NO viajan en peticiones cross-origin sin esta bandera, y el cliente
 *   deberá añadir `credentials: 'include'` a cada fetch/axios.
 *   También será necesario que ALLOWED_ORIGINS nunca contenga '*'.
 * ──────────────────────────────────────────────────────────────────────────────
 */

const ALLOWED_ORIGINS_PROD = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.VERCEL_URL) {
  ALLOWED_ORIGINS_PROD.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  ALLOWED_ORIGINS_PROD.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
}

const ALLOWED_ORIGINS_DEV = [
  'http://localhost:5173', // Vite dev server
  'http://localhost:3000', // Express (self-requests / Postman con origin)
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

/**
 * Lista final de orígenes permitidos según el entorno.
 * En producción se toma de la variable de entorno ALLOWED_ORIGINS;
 * en desarrollo se añaden los localhost automáticamente.
 */
const buildAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    if (ALLOWED_ORIGINS_PROD.length === 0 && !process.env.VERCEL) {
      console.warn(
        '[CORS] ⚠️  NODE_ENV=production pero ALLOWED_ORIGINS está vacío. ' +
          'Ningún origen externo podrá hacer peticiones.'
      );
    }
    return ALLOWED_ORIGINS_PROD;
  }

  // Desarrollo: producción + localhost
  return [...new Set([...ALLOWED_ORIGINS_PROD, ...ALLOWED_ORIGINS_DEV])];
};

const allowedOrigins = buildAllowedOrigins();

/**
 * Función de validación de origen para el middleware cors().
 * @param {string|undefined} origin - Origen de la petición (undefined = same-origin o curl sin header).
 * @param {Function} callback - Callback de cors (error, permitido).
 */
const originValidator = (origin, callback) => {
  // Peticiones sin header Origin (e.g. curl, Postman sin origen, server-to-server)
  if (!origin) return callback(null, true);

  if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
    return callback(null, true);
  }

  console.warn(`[CORS] ❌ Origen bloqueado: ${origin}`);
  return callback(
    Object.assign(new Error(`Origen no permitido por política CORS: ${origin}`), {
      status: 403,
    })
  );
};

/**
 * Opciones de configuración para el middleware cors().
 *
 * credentials: true — activado para httpOnly cookies (HU-JWT-COOKIES).
 * Las cookies cross-origin solo viajan con esta bandera activa.
 * El cliente DEBE usar fetch(..., { credentials: 'include' }) en todos los requests.
 */
const corsOptions = {
  origin: originValidator,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Retry-After'],
  credentials: true, // ← Activado: cookies httpOnly migradas desde localStorage
  maxAge: 86400, // Pre-flight cache: 24 h
};


module.exports = { corsOptions, allowedOrigins };
