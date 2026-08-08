import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import KDS from './pages/KDS';
import WaiterApp from './pages/WaiterApp';
import CajaApp from './pages/CajaApp';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import Inventario from './pages/Inventario';
import Pedidos from './pages/Pedidos';
import Productos from './pages/Productos';
import Usuarios from './pages/Usuarios';
import Configuracion from './pages/Configuracion';
import ModuloEnDesarrollo from './pages/ModuloEnDesarrollo';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { getDefaultRouteForRole } from './utils/auth';

/**
 * AuthenticatedRedirect — redirige al usuario a su ruta por rol.
 * Solo se renderiza cuando ya sabemos que hay sesión (usuario !== null).
 */
function AuthenticatedRedirect() {
  const { usuario } = useAuth();
  return <Navigate to={getDefaultRouteForRole(usuario?.rol)} replace />;
}

/**
 * PublicRoute — solo accesible si NO hay sesión activa.
 * Mientras loading=true muestra null para evitar flash de redirección.
 */
function PublicRoute({ children }) {
  const { usuario, loading } = useAuth();
  if (loading) return null;
  if (usuario) return <AuthenticatedRedirect />;
  return children;
}

/**
 * CatchAllRoute — manejo de rutas desconocidas.
 * Espera a que cargue la sesión antes de decidir destino.
 */
function CatchAllRoute() {
  const { usuario, loading } = useAuth();
  if (loading) return null;
  if (usuario) return <AuthenticatedRedirect />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* RUTA DE INGRESO (LOGIN) */}
        <Route
          path="/login"
          element={<PublicRoute><Login /></PublicRoute>}
        />

        {/* Pantalla de Acceso Denegado 403 */}
        <Route path="/403" element={<Forbidden />} />

        {/* RUTAS ADMINISTRATIVAS */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['administrador', 'gerente']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="/reportes" element={<ModuloEnDesarrollo modulo="Reportes" />} />
        </Route>

        {/* PANTALLA DE COCINA (KDS) */}
        <Route
          path="/cocina"
          element={
            <ProtectedRoute allowedRoles={['cocina', 'administrador']}>
              <KDS />
            </ProtectedRoute>
          }
        />

        {/* PANTALLA DE MESEROS */}
        <Route
          path="/mesero"
          element={
            <ProtectedRoute allowedRoles={['mesero', 'administrador']}>
              <WaiterApp />
            </ProtectedRoute>
          }
        />

        {/* PANTALLA DE CAJERO */}
        <Route
          path="/caja"
          element={
            <ProtectedRoute allowedRoles={['cajero', 'administrador']}>
              <CajaApp />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </ErrorBoundary>
  );
}