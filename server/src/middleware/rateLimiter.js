/**
 * rateLimiter.js — Rate limiting para A La Burger OS
 *
 * Dos estrategias de defensa en profundidad para /login:
 *
 *  1. loginLimiter        — por IP
 *     Requiere app.set('trust proxy', 1) para leer la IP real detrás de Render.
 *
 *  2. usernameLoginLimiter — por username
 *     Bloquea ataques de fuerza bruta que rotan IPs (botnets).
 *     La clave es el username en minúsculas del body del request.
 *     Si el body no tiene username (request malformado) cae a la clave
 *     '__unknown__' para no revelar si el contador está activo.
 *
 * Ambos limitadores cuentan TODOS los requests al endpoint (no solo los
 * fallidos), para no revelar información al atacante sobre cuándo falló.
 *
 * LÍMITES CONFIGURABLES POR ENTORNO (process.env.NODE_ENV):
 *   producción : loginLimiter → 10 req/IP | usernameLoginLimiter → 5 req/username
 *   desarrollo  : loginLimiter → 50 req/IP | usernameLoginLimiter → 30 req/username
 * El comportamiento en Render/producción NO cambia.
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
// Límites configurables por entorno
// ─────────────────────────────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV !== 'production';

/** loginLimiter: 10 intentos/IP en producción, 50 en desarrollo */
const LOGIN_IP_MAX = isDev ? 50 : 10;

/** usernameLoginLimiter: 5 intentos/username en producción, 30 en desarrollo */
const LOGIN_USERNAME_MAX = isDev ? 30 : 5;

// ─────────────────────────────────────────────────────────────────────────────
// Handler genérico (sin datos de usuario — usado por refreshLimiter)
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
// Handler para loginLimiter (bloqueo por IP — incluye log de seguridad)
// ─────────────────────────────────────────────────────────────────────────────

const loginIpBlockedHandler = (req, res) => {
  const ip        = req.ip || req.socket?.remoteAddress || 'desconocida';
  const username  = req.body?.username || 'desconocido';
  const timestamp = new Date().toISOString();
  console.warn(
    `[RateLimit][IP-BLOCK] ${timestamp} | IP: ${ip} | username intentado: ${username} | ` +
    `Bloqueado por exceso de intentos desde esa IP. Límite: ${LOGIN_IP_MAX}/15 min.`
  );
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
 * Máximo LOGIN_IP_MAX intentos por IP en una ventana de 15 minutos.
 * Producción: 10 | Desarrollo: 50
 * Usa req.ip que, con `trust proxy: 1`, contiene la IP real del cliente.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: LOGIN_IP_MAX,
  standardHeaders: 'draft-7', // Incluye RateLimit-* headers (RFC 6585)
  legacyHeaders: false,       // Deshabilita X-RateLimit-* deprecados
  handler: loginIpBlockedHandler, // Log de seguridad: IP + username + timestamp
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
  max: LOGIN_USERNAME_MAX,   // Producción: 5 | Desarrollo: 30
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
    const ip        = req.ip || req.socket?.remoteAddress || 'desconocida';
    const username  = req.body?.username || 'desconocido';
    const timestamp = new Date().toISOString();
    console.warn(
      `[RateLimit][USERNAME-BLOCK] ${timestamp} | username: ${username} | IP: ${ip} | ` +
      `Bloqueado por exceso de intentos para ese usuario. Límite: ${LOGIN_USERNAME_MAX}/15 min.`
    );
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
