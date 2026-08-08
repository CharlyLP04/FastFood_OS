import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasRole } from '../utils/auth';

/**
 * ProtectedRoute — protege rutas verificando autenticación y roles (HU-5)
 *
 * Flujo:
 *  1. Si loading=true  → muestra null (el AuthContext aún verifica /me)
 *  2. Si !usuario       → redirige a /login
 *  3. Si rol no autorizado → redirige a /403
 *  4. Si todo OK       → renderiza children o <Outlet>
 *
 * @param {React.ReactNode} [children] - Componente hijo opcional
 * @param {string[]} [allowedRoles]    - Roles autorizados para la ruta
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const { usuario, loading } = useAuth();

  // Mientras se verifica la sesión con /api/auth/me, no hacer nada
  // (evita flash de redirección a /login en usuarios con sesión válida)
  if (loading) return null;

  // Sin sesión activa → login
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Rol no autorizado → 403
  if (allowedRoles?.length > 0 && !hasRole(usuario, allowedRoles)) {
    return <Navigate to="/403" replace state={{ from: location.pathname }} />;
  }

  return children ? children : <Outlet />;
}