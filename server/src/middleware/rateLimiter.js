/**
 * rateLimiter.js — Rate limiting para A La Burger OS
 *
 * Dos estrategias de defensa en profundidad para /login:
 *
 *  1. loginLimiter        — por IP  : 10 req / 15 min
 *     Requiere app.set('trust proxy', 1) para leer la IP real detrás de Render.
 *
 *  2. usernameLoginLimiter — por username : 5 req / 15 min
 *     Bloquea ataques de fuerza bruta que rotan IPs (botnets).
 *     La clave es el username en minúsculas del body del request.
 *     Si el body no tiene username (request malformado) cae a la clave
 *     '__unknown__' para no revelar si el contador está activo.
 *
 * Ambos limitadores cuentan TODOS los requests al endpoint (no solo los
 * fallidos), para no revelar información al atacante sobre cuándo falló.
 *
 * NOTA REDIS: Actualmente usa MemoryStore (default de express-rate-limit).
 * En un entorno multi-instancia (scale-out en Render) se recomienda reemplazar
 * por rate-limit-redis. Para hacerlo, instala `rate-limit-redis` y `ioredis`
 * y reemplaza el store así:
 *
 *   const RedisStore = require('rate-limit-redis');
 *   const Redis = require('ioredis');
 *   const client = new Redis(process.env.REDIS_URL);
 *   store: new RedisStore({ sendCommand: (...args) => client.call(...args) })
 */

const rateLimit = require('express-rate-limit');

// ─────────────────────────────────────────────────────────────────────────────
// Mensaje de error reutilizable
// ─────────────────────────────────────────────────────────────────────────────

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error: 'Demasiados intentos',
    mensaje: 'Has excedido el número máximo de intentos. Intenta nuevamente más tarde.',
    retryAfter: Math.ceil(req.rateLimit?.resetTime
      ? (req.rateLimit.resetTime - Date.now()) / 1000
      : 900),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Limitador por IP — /login y /refresh
// ─────────────────────────────────────────────────────────────────────────────

/**
 * loginLimiter
 * Máximo 10 intentos por IP en una ventana de 15 minutos.
 * Usa req.ip que, con `trust proxy: 1`, contiene la IP real del cliente.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  standardHeaders: 'draft-7', // Incluye RateLimit-* headers (RFC 6585)
  legacyHeaders: false,       // Deshabilita X-RateLimit-* deprecados
  handler: rateLimitHandler,
  // keyGenerator por defecto usa req.ip — correcto con trust proxy: 1
});

/**
 * refreshLimiter
 * Más permisivo: el cliente puede necesitar renovar el token automáticamente.
 * 20 intentos por IP en 15 minutos.
 */
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Limitador por username — solo /login
// ─────────────────────────────────────────────────────────────────────────────

/**
 * usernameLoginLimiter
 * Máximo 5 intentos por username en una ventana de 15 minutos.
 *
 * Derrota ataques de credential stuffing / fuerza bruta que rotan IPs:
 * aunque el atacante cambie de IP, el contador por username persiste.
 *
 * IMPORTANTE: se aplica DESPUÉS de loginLimiter (por IP) para que un
 * atacante no pueda ni llegar al contador por username si ya superó el
 * límite por IP. El orden en authRoutes.js es [loginLimiter, usernameLoginLimiter].
 *
 * keyGenerator: normaliza el username a minúsculas para evitar bypass
 * con variaciones de capitalización (Admin / ADMIN / admin → misma clave).
 */
const usernameLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    const username = req.body?.username;
    if (!username || typeof username !== 'string') {
      return '__unknown__'; // Body malformado — clave genérica
    }
    return `username:${username.toLowerCase().trim()}`;
  },
  handler: (req, res) => {
    const username = req.body?.username || 'desconocido';
    console.warn(`[RateLimit] Username bloqueado por exceso de intentos: ${username}`);
    res.status(429).json({
      error: 'Cuenta temporalmente bloqueada',
      mensaje:
        'Se han detectado demasiados intentos de inicio de sesión para este usuario. ' +
        'Intenta nuevamente en 15 minutos.',
      retryAfter: Math.ceil(req.rateLimit?.resetTime
        ? (req.rateLimit.resetTime - Date.now()) / 1000
        : 900),
    });
  },
  // MemoryStore por defecto. Ver nota al inicio del archivo para migrar a Redis.
});

module.exports = { loginLimiter, refreshLimiter, usernameLoginLimiter };
