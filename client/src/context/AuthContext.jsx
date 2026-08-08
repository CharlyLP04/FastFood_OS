/**
 * AuthContext.jsx — Estado global de autenticación (HU-5)
 *
 * Reemplaza el uso de localStorage para detectar si el usuario está logueado.
 * Al montar la app, llama GET /api/auth/me para verificar si existe una cookie
 * de acceso válida en el navegador. Si la hay, el servidor devuelve { usuario };
 * si no, devuelve 401 y el estado queda como no autenticado.
 *
 * API del contexto:
 *   usuario  — objeto { id, nombre, username, rol } o null
 *   loading  — true mientras se verifica la sesión inicial (evita flash de /login)
 *   login(usuario)  — guarda el usuario tras login exitoso
 *   logout()        — llama POST /api/auth/logout y limpia el estado
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { logoutApi, me as meApi } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true); // true hasta que /me responda

  // ── Verificar sesión al montar la app ──────────────────────────────────────
  // Se llama SIEMPRE al montar, incluyendo al recargar la página.
  // Si la cookie access_token sigue vigente, /me la valida y devuelve el usuario.
  useEffect(() => {
    let cancelled = false;

    async function verificarSesion() {
      try {
        const data = await meApi(); // GET /api/auth/me con credentials: 'include'
        if (!cancelled) {
          setUsuario(data.usuario);
        }
      } catch {
        // 401 = no hay sesión activa — estado correcto, no es un error
        if (!cancelled) {
          setUsuario(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    verificarSesion();
    return () => { cancelled = true; };
  }, []);

  // ── login: llamado por Login.jsx tras login exitoso ───────────────────────
  const login = useCallback((usuarioData) => {
    setUsuario(usuarioData);
  }, []);

  // ── logout: llama al servidor para limpiar cookies y limpia estado ─────────
  const logout = useCallback(async () => {
    try {
      await logoutApi(); // POST /api/auth/logout — limpia cookies httpOnly en servidor
    } catch {
      // Si el servidor falla, de todas formas limpiamos el estado local
    } finally {
      setUsuario(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
