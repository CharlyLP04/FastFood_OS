const verificarAdministrador = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      error: 'No autenticado',
      mensaje: 'Debes iniciar sesión.'
    });
  }

  const rol = (req.usuario.rol || '').toLowerCase().trim();

  if (rol !== 'administrador' && rol !== 'admin' && rol !== 'gerente') {
    return res.status(403).json({
      error: 'Acceso denegado',
      mensaje: 'Solo los administradores pueden realizar esta acción.'
    });
  }

  next();
};

module.exports = { verificarAdministrador };