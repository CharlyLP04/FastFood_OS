/**
 * authService.js — Servicios de autenticación (HU-5)
 */

import { API_URL } from '../config/apiConfig';

export async function loginApi(username, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.mensaje || 'Error al iniciar sesión');
  }

  return data;
}

export async function me() {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Sin sesión activa');
  }

  return response.json();
}

export async function logoutApi() {
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function refreshToken() {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('No se pudo renovar la sesión');
  }

  return response.json();
}