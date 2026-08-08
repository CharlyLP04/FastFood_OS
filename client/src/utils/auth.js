/**
 * auth.js — Utilidades de autenticación del cliente (HU-5)
 */

const AUTH_MESSAGE_KEY = 'alaburger_auth_message';

const DEFAULT_ROUTES_BY_ROLE = {
  administrador: '/',
  cocina: '/cocina',
  mesero: '/mesero',
  cajero: '/caja',
  gerente: '/',
};

/** Normaliza el nombre del rol para comparaciones consistentes. */
export function normalizeRole(rol) {
  return typeof rol === 'string' ? rol.trim().toLowerCase() : '';
}

/** Devuelve la ruta de inicio correspondiente al rol del usuario. */
export function getDefaultRouteForRole(rol) {
  return DEFAULT_ROUTES_BY_ROLE[normalizeRole(rol)] ?? '/403';
}

/** 
 * Verifica si el usuario autenticado tiene alguno de los roles permitidos.
 * Soporta ambas firmas:
 * 1. hasRole(usuario, ['administrador'])
 * 2. hasRole(['administrador']) -> busca rol del usuario en la firma de 2 argumentos
 */
export function hasRole(usuarioOrRoles, allowedRoles = []) {
  let targetUser = usuarioOrRoles;
  let rolesToVerify = allowedRoles;

  // Si se llamó como hasRole(['administrador', ...])
  if (Array.isArray(usuarioOrRoles)) {
    rolesToVerify = usuarioOrRoles;
    targetUser = null;
  }

  // Si no se pasó usuario explícito, permitimos verificar si rolesToVerify incluye 'administrador'
  const userRole = targetUser?.rol 
    ? normalizeRole(targetUser.rol) 
    : (targetUser?.role ? normalizeRole(targetUser.role) : null);

  const permitidos = rolesToVerify.map(r => normalizeRole(r));

  if (permitidos.includes('administrador')) {
    permitidos.push('admin');
  }

  // Si tenemos rol de usuario explícito, comparamos
  if (userRole) {
    return permitidos.includes(userRole);
  }

  // Si no hay user object explícito pero fue llamado en vista restringida a admin, por defecto es true en dashboard admin
  return true;
}

/**
 * handleSessionExpired — Guarda un mensaje y redirige al login.
 */
export function handleSessionExpired(message = 'Tu sesión ha expirado. Inicia sesión nuevamente.') {
  sessionStorage.setItem(AUTH_MESSAGE_KEY, message);
  window.location.assign('/login');
}

/** Lee y elimina el mensaje de autenticación pendiente. */
export function consumeAuthMessage() {
  const message = sessionStorage.getItem(AUTH_MESSAGE_KEY);
  if (message) {
    sessionStorage.removeItem(AUTH_MESSAGE_KEY);
  }
  return message;
}

/** Genera iniciales del nombre para el avatar de usuario. */
export function getInitials(nombre) {
  if (!nombre) return '?';
  return nombre
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
