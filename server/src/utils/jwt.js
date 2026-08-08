const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Criterio de Aceptación: exp a 30 minutos desde iat
// ⚠️ Mantener sincronizado con maxAge de la cookie en authController.js (30 * 60 * 1000)
function generarAccessToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: '30m' }
  );
}

// Refresh token de larga duración (7 días)
function generarRefreshToken(usuario) {
  return jwt.sign(
    { sub: usuario.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  generarAccessToken,
  generarRefreshToken
};