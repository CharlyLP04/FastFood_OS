/**
 * authService.js — Servicios de autenticación (HU-5)
 *
 * Los tokens JWT ahora viven en httpOnly cookies — el cliente NUNCA los
 * lee ni los almacena. Todas las llamadas incluyen credentials: 'include'
 * para que el navegador envíe y reciba las cookies automáticamente.
 *
 * El estado de autenticación se gestiona en AuthContext, NO aquí.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

/**
 * login — Envía credenciales al servidor.
 * El servidor responde seteando access_token y refresh_token como cookies httpOnly.
 * Solo devuelve el objeto usuario (sin tokens en el body).
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ usuario: object }>}
 */
export async function loginApi(username, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include', // Necesario para recibir las cookies httpOnly
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.mensaje || 'Error al iniciar sesión');
  }

  return data; // { usuario: { id, nombre, username, rol } }
}

/**
 * me — Verifica si hay una sesión activa consultando al servidor.
 * El servidor lee la cookie access_token y devuelve { usuario } si es válida.
 * Devuelve null / lanza error si no hay sesión.
 *
 * Usado por AuthContext al montar la app.
 *
 * @returns {Promise<{ usuario: object }>}
 */
export async function me() {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Sin sesión activa');
  }

  return response.json(); // { usuario }
}

/**
 * logoutApi — Llama al servidor para revocar las cookies httpOnly.
 * El servidor limpia ambas cookies (access_token y refresh_token).
 * El estado local lo limpia AuthContext.
 */
export async function logoutApi() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

/**
 * refreshToken — Solicita un nuevo access_token usando el refresh_token cookie.
 * El navegador envía la cookie automáticamente (path: /api/auth/refresh).
 * El servidor responde seteando una nueva cookie access_token.
 */
export async function refreshToken() {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('No se pudo renovar la sesión');
  }

  return response.json(); // { ok: true }
}