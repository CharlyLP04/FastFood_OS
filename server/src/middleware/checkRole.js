/**
 * Middleware para verificar que el usuario autenticado tenga un rol permitido (HU-42).
 * Debe colocarse después de verificarToken.
 * 
 * @param {...string} rolesPermitidos - Lista de roles autorizados
 * @returns {Function} Express middleware (req, res, next)
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !req.usuario.rol) {
      return res.status(403).json({
        error: 'Acceso denegado',
        mensaje: 'No se encontraron detalles de autenticación válidos.',
      });
    }

    const usuarioRol = req.usuario.rol.trim().toLowerCase();
    const permitidosNormalizados = rolesPermitidos.map(r => r.trim().toLowerCase());

    // Si busca 'administrador', también permitir 'admin'
    if (permitidosNormalizados.includes('administrador')) {
      permitidosNormalizados.push('admin');
    }

    if (!permitidosNormalizados.includes(usuarioRol)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        mensaje: 'No tienes permisos para esta acción.',
      });
    }

    next();
  };
};

module.exports = { verificarRol };
