const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');
const { loginLimiter, refreshLimiter, usernameLoginLimiter } = require('../middleware/rateLimiter');
const { validarLogin, validarRefresh, manejarErroresValidacion } = require('../middleware/authValidator');

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Orden: IP limiter → username limiter → validator → controller
//  1. loginLimiter          : 10 intentos / IP / 15 min
//  2. usernameLoginLimiter  : 5  intentos / username / 15 min
//  3. validarLogin          : valida y sanitiza inputs
//  4. manejarErroresValidacion : devuelve 422 si hay errores
//  5. authController.login  : autentica y emite cookies httpOnly (HU-5)
// ─────────────────────────────────────────────────────────────
router.post(
  '/login',
  loginLimiter,
  usernameLoginLimiter,
  validarLogin,
  manejarErroresValidacion,
  authController.login
);

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me — HU-5: Verificar sesión activa
// El cliente llama este endpoint al montar la app para saber si hay
// una cookie de acceso válida, sin exponer el JWT a JavaScript.
// ─────────────────────────────────────────────────────────────
router.get('/me', verificarToken, authController.me);

// ─────────────────────────────────────────────────────────────
// POST /api/auth/refresh — HU-5: Renovación de Access Token
// Lee refresh_token desde cookie (path: /api/auth/refresh)
// ─────────────────────────────────────────────────────────────
router.post(
  '/refresh',
  refreshLimiter,
  authController.refreshSession
);

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout — HU-5: Cierre de sesión seguro
// Limpia ambas cookies httpOnly (verificarToken es opcional pero
// permite revocar el refresh_token en BD si el usuario está identificado)
// ─────────────────────────────────────────────────────────────
router.post('/logout', verificarToken, authController.logout);

module.exports = router;