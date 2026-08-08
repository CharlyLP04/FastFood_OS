/**
 * authValidator.js — Validación y sanitización de inputs para endpoints de auth
 *
 * Usa express-validator para:
 *  - Validar formato y longitud de campos
 *  - Sanitizar inputs (trim, escape, toLowerCase) antes de que lleguen al controlador
 *  - Devolver errores 422 con detalle por campo (sin revelar información sensible)
 *
 * Se aplica DESPUÉS de los rate limiters para no desperdiciar validaciones
 * en requests que ya deben ser bloqueadas.
 */

const { body, validationResult } = require('express-validator');

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: manejo centralizado de errores de validación
// ─────────────────────────────────────────────────────────────────────────────

/**
 * manejarErroresValidacion
 * Debe ir ÚLTIMO en la cadena de validators, antes del controlador.
 * Si hay errores de validación, responde 422 con el primer error de cada campo.
 */
const manejarErroresValidacion = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    // Agrupar errores por campo para una respuesta clara
    const erroresPorCampo = errores.array({ onlyFirstError: true }).map((e) => ({
      campo: e.path,
      mensaje: e.msg,
    }));

    return res.status(422).json({
      error: 'Datos de entrada inválidos',
      detalles: erroresPorCampo,
    });
  }

  return next();
};

// ─────────────────────────────────────────────────────────────────────────────
// Validadores por endpoint
// ─────────────────────────────────────────────────────────────────────────────

/**
 * validarLogin
 * Reglas para POST /api/auth/login
 *
 * - username: requerido, 1–50 chars, solo alfanumérico + guion bajo + punto,
 *             se convierte a minúsculas y se hace trim.
 * - password: requerido, 8–100 chars (sin restricciones de caracteres para
 *             no ayudar al atacante a inferir la política de contraseñas).
 *             El trim se omite intencionalmente — algunos usuarios pueden
 *             tener espacios en su contraseña legítimamente.
 */
const validarLogin = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es obligatorio.')
    .isString()
    .withMessage('El nombre de usuario debe ser texto.')
    .trim()
    .toLowerCase()
    .isLength({ min: 1, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 1 y 50 caracteres.')
    .matches(/^[a-z0-9_.]+$/)
    .withMessage(
      'El nombre de usuario solo puede contener letras, números, puntos y guiones bajos.'
    )
    .escape(), // Sanitiza HTML entities por si acaso

  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria.')
    .isString()
    .withMessage('La contraseña debe ser texto.')
    .isLength({ min: 8, max: 100 })
    .withMessage('La contraseña debe tener entre 8 y 100 caracteres.'),
    // ⚠️ No se hace .trim() ni .escape() en password para preservar el valor exacto
];

/**
 * validarRefresh
 * Reglas para POST /api/auth/refresh
 *
 * - refreshToken: requerido, string no vacío.
 *   No se valida formato JWT aquí para no revelar información al atacante.
 */
const validarRefresh = [
  body('refreshToken')
    .notEmpty()
    .withMessage('El refresh token es obligatorio.')
    .isString()
    .withMessage('El refresh token debe ser texto.')
    .isLength({ min: 1, max: 512 })
    .withMessage('El refresh token tiene un formato inválido.'),
];

module.exports = {
  validarLogin,
  validarRefresh,
  manejarErroresValidacion,
};
