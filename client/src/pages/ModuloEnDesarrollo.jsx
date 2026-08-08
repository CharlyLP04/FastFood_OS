import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, ICONS } from '../components/ui/Icon';
import { Toast } from '../components/ui/Toast';
import { getInitials } from '../utils/auth';
import { useAuth } from '../hooks/useAuth';


export default function ModuloEnDesarrollo({ modulo }) {
  const navigate = useNavigate();
  const { usuario } = useAuth();


  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const { logout } = useAuth();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getModuloIcon = () => {
    switch (modulo.toLowerCase()) {
      case 'pedidos': return ICONS.bag;
      case 'productos': return ICONS.box;
      case 'sucursales': return ICONS.store;
      case 'usuarios': return ICONS.users;
      case 'reportes': return ICONS.chart;
      default: return ICONS.box;
    }
  };

  return (
    <>
      {/* 3. ÁREA DE TRABAJO */}
        <main className="flex-1 p-8 overflow-y-auto flex items-center justify-center">
          <div className="max-w-md w-full bg-[#141416] border border-[#1F1F23] rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden group">
            {/* Fondo de brillo sutil */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#E8530A]/10 rounded-full blur-3xl group-hover:bg-[#E8530A]/15 transition-all duration-500"></div>
            
            <div className="text-[#E8530A] bg-[#E8530A]/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-105 duration-300">
              <Icon path={getModuloIcon()} size={32} />
            </div>

            <h1 className="text-xl font-black tracking-wide text-white uppercase mb-2">
              Módulo de {modulo}
            </h1>
            
            <div className="inline-block bg-[#E8530A]/10 border border-[#E8530A]/30 text-[#E8530A] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6 animate-pulse">
              En Desarrollo
            </div>

            <p className="text-xs text-neutral-400 font-bold leading-relaxed mb-8 max-w-sm mx-auto uppercase tracking-wide">
              Estamos trabajando en esta sección. Estará disponible en una futura historia de usuario (HU).
            </p>

            <Link
              to="/"
              className="inline-flex items-center justify-center text-xs font-black uppercase tracking-wider text-white bg-[#E8530A] hover:bg-[#ff6214] px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#E8530A]/20 cursor-pointer"
            >
              Volver al Dashboard
            </Link>
          </div>
        </main>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}
