/**
 * AuthContext.jsx — Estado global de autenticación (HU-5)
 *
 * Al montar la app hace un "wake-up ping" al backend para despertar
 * el servidor de Render antes de que el usuario intente iniciar sesión.
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { logoutApi, me as meApi } from '../services/authService';
import { BACKEND_URL } from '../config/apiConfig';

export const AuthContext = createContext(null);

// Despierta el servidor de Render en background para evitar cold start
function wakeUpServer() {
  fetch(`${BACKEND_URL}/health`, { credentials: 'include' }).catch(() => {});
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Ping al servidor para despertarlo (Render free tier duerme tras 15 min)
    wakeUpServer();

    async function verificarSesion() {
      try {
        const data = await meApi();
        if (!cancelled) {
          setUsuario(data.usuario);
        }
      } catch {
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

  const login = useCallback((usuarioData) => {
    setUsuario(usuarioData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
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
