// Middleware de autenticación JWT para A La Burger OS
const jwt = require('jsonwebtoken');

/**
 * verificarToken — protege rutas que requieren sesión iniciada.
 *
 * HU-5: Lee el JWT desde la cookie httpOnly `access_token`.
 * En desarrollo (NODE_ENV !== 'production') acepta también el header
 * `Authorization: Bearer <token>` como fallback para facilitar
 * el uso con curl / Postman sin necesidad de gestionar cookies.
 *
 * Prioridad: cookie > Authorization header
 */
const verificarToken = (req, res, next) => {
  // 1. Intentar leer desde cookie httpOnly (ruta principal, producción y dev)
  let token = req.cookies?.access_token ?? null;

  // 2. Fallback a Authorization: Bearer estrictamente en entorno 'development'
  if (!token && process.env.NODE_ENV === 'development') {
    const encabezado = req.headers['authorization'];
    if (encabezado) {
      const partes = encabezado.split(' ');
      if (partes.length === 2 && partes[0] === 'Bearer') {
        token = partes[1];
      }
    }
  }

  if (!token) {
    return res.status(401).json({
      error: 'Acceso denegado',
      mensaje: 'No se proporcionó un token de autenticación.',
    });
  }

  try {
    const cargaUtil = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = cargaUtil;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        mensaje: 'La sesión ha expirado. Por favor, inicia sesión nuevamente.',
      });
    }
    return res.status(403).json({
      error: 'Token inválido',
      mensaje: 'El token proporcionado no es válido.',
    });
  }
};

module.exports = { verificarToken };
