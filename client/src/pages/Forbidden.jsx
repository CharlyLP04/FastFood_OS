import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole } from '../utils/auth';
import { useAuth } from '../hooks/useAuth';

export default function Forbidden() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const homeRoute = usuario ? getDefaultRouteForRole(usuario.rol) : '/login';

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex items-center justify-center px-6 font-body">
      <div className="bg-[#141416] border border-[#242428] rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
        <p className="text-[#E85D2F] font-heading font-black text-6xl mb-3">403</p>
        <h1 className="text-xl font-heading font-bold mb-2 uppercase tracking-wide text-white">Acceso denegado</h1>
        <p className="text-xs text-zinc-400 mb-6">
          No tienes permisos para acceder a esta sección. (Rol detectado: {usuario?.rol || 'ninguno'})
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Link
            to={homeRoute}
            className="inline-block bg-[#E85D2F] hover:bg-[#d64e21] text-white font-heading font-bold px-6 py-3 rounded-full transition-colors text-xs uppercase tracking-wider w-full sm:w-auto text-center cursor-pointer shadow-sm active:scale-95"
          >
            {usuario ? 'Volver a mi panel' : 'Iniciar sesión'}
          </Link>
          {usuario && (
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className="inline-block bg-white/10 hover:bg-white/20 border border-white/15 text-white font-heading font-bold px-6 py-3 rounded-full transition-colors text-xs uppercase tracking-wider w-full sm:w-auto cursor-pointer active:scale-95"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
