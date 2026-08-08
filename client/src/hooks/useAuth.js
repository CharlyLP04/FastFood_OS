/**
 * useAuth.js — Hook de acceso al AuthContext (HU-5)
 *
 * Uso:
 *   const { usuario, loading, login, logout } = useAuth();
 *
 * Lanza un error si se usa fuera de <AuthProvider> para detectar
 * usos accidentales fuera del árbol de componentes correcto.
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth() debe usarse dentro de <AuthProvider>. Verifica que main.jsx envuelva <App> con <AuthProvider>.');
  }
  return ctx;
}
