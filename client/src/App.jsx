import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { getDefaultRouteForRole } from './utils/auth';

import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy loaded components (Code-Splitting)
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventario = lazy(() => import('./pages/Inventario'));
const Pedidos = lazy(() => import('./pages/Pedidos'));
const Productos = lazy(() => import('./pages/Productos'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const KDS = lazy(() => import('./pages/KDS'));
const WaiterApp = lazy(() => import('./pages/WaiterApp'));
const CajaApp = lazy(() => import('./pages/CajaApp'));
const ModuloEnDesarrollo = lazy(() => import('./pages/ModuloEnDesarrollo'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const AppLayout = lazy(() => import('./components/layout/AppLayout'));

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
      <Suspense fallback={<LoadingScreen />}>
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
      </Suspense>
    </ErrorBoundary>
  );
}