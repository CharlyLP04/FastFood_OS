/**
 * helmetConfig.js — Configuración de helmet para FastFood OS
 *
 * Este servidor es una API REST pura (JSON), no sirve HTML ni recursos
 * estáticos propios, por lo que la CSP por defecto de helmet no aplica.
 * Se activan únicamente las directivas relevantes para una API.
 *
 * Referencia: https://helmetjs.github.io/
 */

const helmetOptions = {
  // ── Content-Security-Policy ───────────────────────────────────────────────
  // En una API REST pura no se sirve HTML, pero se define una CSP mínima
  // para cubrir el caso de que algún endpoint devuelva HTML de error.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'none'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"], // Equivalente a X-Frame-Options: DENY
    },
  },

  // ── HTTP Strict Transport Security ───────────────────────────────────────
  // Fuerza HTTPS durante 1 año. Render ya sirve todo por HTTPS.
  strictTransportSecurity: {
    maxAge: 31536000, // 1 año en segundos
    includeSubDomains: true,
  },

  // ── Cross-Origin Resource Policy ─────────────────────────────────────────
  // 'cross-origin' es necesario porque el frontend en Vercel (dominio distinto)
  // necesita leer las respuestas de esta API en Render.
  crossOriginResourcePolicy: { policy: 'cross-origin' },

  // ── Cross-Origin Opener Policy ───────────────────────────────────────────
  crossOriginOpenerPolicy: { policy: 'same-origin' },

  // ── Referrer Policy ──────────────────────────────────────────────────────
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // ── X-Content-Type-Options ───────────────────────────────────────────────
  // Previene MIME-sniffing (noSniff: true es el default de helmet, lo dejamos explícito)
  noSniff: true,

  // ── X-Frame-Options ──────────────────────────────────────────────────────
  frameguard: { action: 'deny' },

  // ── X-Powered-By ─────────────────────────────────────────────────────────
  // Oculta el header "X-Powered-By: Express" para no revelar el stack.
  hidePoweredBy: true,

  // ── Permissions Policy ───────────────────────────────────────────────────
  // Deshabilita features del navegador no necesarias para la API.
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
};

module.exports = { helmetOptions };
