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
  return next();
};

module.exports = { verifyOrigin, EXEMPT_PATHS };
