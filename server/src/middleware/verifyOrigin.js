const { allowedOrigins } = require('../config/corsConfig');

/**
 * Rutas exentas de verificación de origen.
 * Webhooks de servicios externos (Stripe, PayPal, etc.) no provienen de un navegador,
 * por lo que no envían la cabecera 'Origin'. Se autentican mediante sus propias
 * firmas criptográficas (ej. header 'Stripe-Signature').
 */
const EXEMPT_PATHS = [
  '/api/pagos/webhook',
  '/api/webhooks/stripe',
];

/**
 * verifyOrigin — Middleware de validación estricta de Origen (CSRF / Cross-Origin Guard)
 *
 * Para métodos mutadores (POST, PUT, PATCH, DELETE):
 * Valida que el header 'Origin' esté presente y pertenezca a `allowedOrigins`.
 * Si no coincide o falta, responde HTTP 403.
 *
 * Excepciones:
 *  - Métodos de lectura o pre-flight (GET, HEAD, OPTIONS)
 *  - Rutas de webhooks de servicios externos (EXEMPT_PATHS o con '/webhook' en la URL)
 */
const verifyOrigin = (req, res, next) => {
  // 1. Omitir métodos de lectura y pre-flight CORS
  const metodo = req.method.toUpperCase();
  if (metodo === 'GET' || metodo === 'HEAD' || metodo === 'OPTIONS') {
    return next();
  }

  // 2. Excluir webhooks externos (ej. Stripe webhooks no traen header Origin de navegador)
  const ruta = req.originalUrl || req.path || '';
  if (EXEMPT_PATHS.some((p) => ruta.startsWith(p)) || ruta.includes('/webhook')) {
    return next();
  }

  const origin = req.headers.origin || req.get('origin');

  if (!origin || !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: 'Origen no autorizado',
      mensaje: 'Petición rechazada: el origen de la solicitud no está en la lista de dominios autorizados.',
    });
  }

  next();
};

module.exports = { verifyOrigin, EXEMPT_PATHS };
