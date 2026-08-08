import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Icon, ICONS } from '../ui/Icon';
import { Toast } from '../ui/Toast';
import { getInitials } from '../../utils/auth';
import { globalSearch, getAlertasStockBajo, getPedidos } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [toast, setToast] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notifRef = useRef(null);

  // Click outside listener for search & notifications
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut CMD+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await globalSearch(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error in search', error);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Cargar Notificaciones Reales (Stock bajo + Pedidos pendientes)
  const fetchRealNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const [alertsData, ordersData] = await Promise.all([
        getAlertasStockBajo().catch(() => ({ data: [] })),
        getPedidos().catch(() => []),
      ]);

      const notifs = [];

      // 1. Alert insumos con stock bajo
      const insumosCriticos = alertsData.data || [];
      insumosCriticos.forEach((item) => {
        notifs.push({
          id: `stock-${item.id}`,
          tipo: 'stock',
          titulo: 'Alerta de Inventario',
          mensaje: `${item.nombre}: Quedan ${item.cantidad_actual} ${item.unidad} (mín: ${item.stock_minimo})`,
          hora: 'Hace un momento',
          badge: 'Stock Bajo',
          badgeColor: 'bg-[#C1272D]/20 text-[#C1272D] border-[#C1272D]/30',
          path: '/inventario',
          read: false,
        });
      });

      // 2. Pedidos en preparación o pendientes
      const pedidosPendientes = (ordersData || []).filter((p) => p.estado === 'pendiente' || p.estado === 'en_preparacion');
      pedidosPendientes.slice(0, 3).forEach((p) => {
        notifs.push({
          id: `order-${p.id}`,
          tipo: 'pedido',
          titulo: `Pedido #${p.id} en ${p.estado === 'en_preparacion' ? 'Cocina' : 'Espera'}`,
          mensaje: `Total: $${p.total} · ${p.items?.length || 0} productos registrados`,
          hora: 'Hace un momento',
          badge: p.estado === 'en_preparacion' ? 'En Cocina' : 'Nuevo',
          badgeColor: 'bg-[#E85D2F]/20 text-[#E85D2F] border-[#E85D2F]/30',
          path: p.estado === 'en_preparacion' ? '/cocina' : '/pedidos',
          read: false,
        });
      });

      // 3. Notificación de sistema
      notifs.push({
        id: 'sys-online',
        tipo: 'sistema',
        titulo: 'Sistema Operativo',
        mensaje: 'A La Burger OS conectado con base de datos en tiempo real.',
        hora: 'Hoy',
        badge: 'Online',
        badgeColor: 'bg-[#7A8450]/20 text-[#7A8450] border-[#7A8450]/30',
        path: '/',
        read: true,
      });

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchRealNotifications();
    const notifInterval = setInterval(fetchRealNotifications, 30000); // Actualiza notificaciones cada 30s
    return () => clearInterval(notifInterval);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setToast({ message: 'Todas las notificaciones marcadas como leídas', type: 'info' });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: ICONS.dashboard },
    { path: '/pedidos', label: 'Pedidos', icon: ICONS.bag },
    { path: '/cocina', label: 'Cocina', icon: ICONS.chef },
    { path: '/productos', label: 'Productos', icon: ICONS.box },
    { path: '/inventario', label: 'Inventario', icon: ICONS.box },
    { path: '/usuarios', label: 'Usuarios', icon: ICONS.users },
    { path: '/reportes', label: 'Reportes', icon: ICONS.chart },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const currentNav = useMemo(() => {
    return navItems.find(item => isActive(item.path));
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-white font-body overflow-hidden">
      
      {/* SIDEBAR LATERAL DARK */}
      <aside className="w-64 border-r border-[#242428] bg-[#141416] text-white flex flex-col shrink-0 z-30 shadow-xl">
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo con icono SVG */}
          <div className="p-6 border-b border-[#242428] flex items-center gap-3 shrink-0">
            <div className="bg-[#E85D2F]/15 border border-[#E85D2F]/30 p-2 rounded-xl text-[#E85D2F] flex items-center justify-center shadow-[0_0_15px_rgba(232,93,47,0.25)] transition-transform hover:scale-105">
              <Icon path={ICONS.burger} size={20} />
            </div>
            <div>
              <h2 className="font-heading font-black tracking-wider text-sm uppercase text-white">A LA BURGER</h2>
              <p className="text-[10px] text-[#E85D2F] font-bold tracking-widest uppercase">OS Platform</p>
            </div>
          </div>

          {/* Navegación */}
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase px-3 mb-3">
              Menú Principal
            </p>
            <nav className="space-y-1.5">
              {navItems.map((item, index) => {
                const active = isActive(item.path);
                return (
                  <Link 
                    key={index}
                    to={item.path} 
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      active 
                        ? 'bg-[#E85D2F] text-white font-bold shadow-[0_0_16px_rgba(232,93,47,0.35)] translate-x-0.5' 
                        : 'text-zinc-400 hover:text-white hover:bg-white/5 hover:translate-x-1'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon 
                        path={item.icon} 
                        size={18} 
                        className={active ? "text-white" : "text-zinc-500 group-hover:text-white transition-colors duration-200"} 
                      />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-[#242428] bg-black/40 shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#E85D2F] text-white font-bold text-sm flex items-center justify-center border border-white/10 shadow-sm transition-transform hover:scale-105">
                {getInitials(usuario?.nombre)}
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{usuario?.nombre} {usuario?.apellido}</p>
                <p className="text-[10px] text-[#E85D2F] font-bold uppercase tracking-wider truncate">{usuario?.rol}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-white/5 hover:bg-[#C1272D] rounded-full transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0B]">
        
        {/* HEADER SUPERIOR DARK */}
        <header className="h-16 border-b border-[#242428] bg-[#141416] text-white px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          {/* Breadcrumb */}
          <div className="text-xs font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-2">
            <span className="font-heading font-black text-[#E85D2F]">A LA BURGER OS</span> 
            <span className="text-zinc-600">/</span> 
            <span className="text-white">{currentNav?.label || 'DASHBOARD'}</span>
          </div>

          {/* Buscador y Controles */}
          <div className="flex items-center gap-6">
            <div className="relative w-64 hidden lg:block" ref={searchRef}>
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                <Icon path={ICONS.search} size={16} />
              </span>
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchResults(true);
                }}
                placeholder="Buscar pedido, producto..." 
                className="w-full bg-[#1C1C20] border border-[#2D2D35] rounded-full pl-9 pr-9 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E85D2F] focus:ring-1 focus:ring-[#E85D2F] transition-all duration-200"
              />
              {!searchQuery && (
                <span className="absolute inset-y-0 right-3 flex items-center text-[10px] text-zinc-500 font-bold bg-[#141416] px-2 my-1.5 rounded-full border border-[#242428]">
                  ⌘K
                </span>
              )}

              {/* Result dropdown animado */}
              {showSearchResults && searchQuery.trim() !== '' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#141416] border border-[#242428] rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[360px] animate-pop-in">
                  {isSearching ? (
                    <div className="p-4 text-center text-zinc-400 text-xs font-bold flex items-center justify-center gap-2">
                      <Icon path={ICONS.refresh} size={16} className="animate-spin text-[#E85D2F]" />
                      Buscando...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-zinc-500 text-xs">
                      Sin resultados para "{searchQuery}"
                    </div>
                  ) : (
                    <div className="overflow-y-auto custom-scrollbar">
                      {searchResults.map((res) => (
                        <div 
                          key={`${res.type}-${res.id}`}
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery('');
                            if (res.type === 'producto') navigate('/productos');
                            if (res.type === 'usuario') navigate('/usuarios');
                            if (res.type === 'inventario') navigate('/inventario');
                            if (res.type === 'pedido') navigate('/pedidos');
                          }}
                          className="px-4 py-3 hover:bg-white/5 border-b border-[#242428] last:border-0 cursor-pointer transition-all duration-150 flex items-center gap-3 text-xs"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#E85D2F]/20 text-[#E85D2F] flex items-center justify-center shrink-0">
                            <Icon path={ICONS.box} size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-bold truncate">{res.title}</p>
                            <p className="text-[10px] text-zinc-500 truncate uppercase">{res.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions & NOTIFICATIONS DROPDOWN */}
            <div className="flex items-center gap-2 border-r border-[#242428] pr-4 relative" ref={notifRef}>
              <button 
                onClick={() => {
                  fetchRealNotifications();
                  setToast({ message: 'Datos e inventario sincronizados', type: 'info' });
                }}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-all duration-200 cursor-pointer active:scale-95"
                title="Sincronizar datos"
              >
                <Icon path={ICONS.refresh} size={18} />
              </button>

              {/* Botón Campana con Badge dinámico */}
              <button 
                onClick={() => setShowNotifications((prev) => !prev)}
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5 transition-all duration-200 relative cursor-pointer active:scale-95"
                title="Centro de Notificaciones"
              >
                <Icon path={ICONS.bell} size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#E85D2F] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* PANEL DESPLEGABLE DE NOTIFICACIONES ULTRA-PREMIUM */}
              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-80 sm:w-[420px] bg-[#141416]/95 backdrop-blur-2xl border border-[#242428] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(232,93,47,0.2)] overflow-hidden z-50 flex flex-col max-h-[480px] animate-pop-in">
                  
                  {/* Top Accent Gradient Bar */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#EF4444] via-[#E85D2F] to-[#10B981]" />

                  {/* Header Notificaciones */}
                  <div className="p-4 border-b border-[#242428] flex items-center justify-between bg-[#1C1C20]/80">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#E85D2F]/15 text-[#E85D2F] flex items-center justify-center border border-[#E85D2F]/30 shadow-inner">
                        <Icon path={ICONS.bell} size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs font-heading font-black uppercase text-white tracking-wider">Centro de Notificaciones</h3>
                        <p className="text-[10px] text-zinc-400 font-medium">Alertas en tiempo real del restaurante</p>
                      </div>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-[#E85D2F] hover:text-[#ff7444] bg-[#E85D2F]/15 hover:bg-[#E85D2F]/25 px-3 py-1 rounded-full border border-[#E85D2F]/30 transition-all cursor-pointer"
                      >
                        Marcar leídas
                      </button>
                    )}
                  </div>

                  {/* Lista Notificaciones */}
                  <div className="overflow-y-auto custom-scrollbar flex-1 divide-y divide-[#242428]/60 p-2 space-y-1">
                    {loadingNotifications ? (
                      <div className="p-8 text-center text-zinc-400 text-xs font-bold flex items-center justify-center gap-2">
                        <Icon path={ICONS.refresh} size={18} className="animate-spin text-[#E85D2F]" />
                        Cargando notificaciones...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500 text-xs">
                        Sin notificaciones en este momento.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setShowNotifications(false);
                            if (notif.path) navigate(notif.path);
                          }}
                          className={`p-3.5 rounded-xl hover:bg-[#1C1C20] cursor-pointer transition-all duration-200 flex items-start gap-3 relative border ${
                            !notif.read ? 'bg-[#E85D2F]/5 border-[#E85D2F]/20' : 'border-transparent hover:border-[#2D2D35]'
                          }`}
                        >
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-[#E85D2F] absolute top-4 left-1.5 animate-pulse shadow-[0_0_8px_#E85D2F]" />
                          )}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-sm ${
                            notif.tipo === 'stock' 
                              ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30' 
                              : notif.tipo === 'pedido'
                              ? 'bg-[#E85D2F]/15 text-[#E85D2F] border-[#E85D2F]/30'
                              : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          }`}>
                            {notif.tipo === 'stock' && <Icon path={ICONS.box} size={16} />}
                            {notif.tipo === 'pedido' && <Icon path={ICONS.bag} size={16} />}
                            {notif.tipo === 'sistema' && <Icon path={ICONS.check} size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-bold text-white truncate">{notif.titulo}</p>
                              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border tracking-wider uppercase ${
                                notif.tipo === 'stock' 
                                  ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40 shadow-[0_0_10px_rgba(239,68,68,0.25)]' 
                                  : notif.tipo === 'pedido'
                                  ? 'bg-[#E85D2F]/20 text-[#E85D2F] border-[#E85D2F]/40 shadow-[0_0_10px_rgba(232,93,47,0.25)]'
                                  : 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                              }`}>
                                {notif.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-snug font-medium">{notif.mensaje}</p>
                            <span className="text-[9px] text-zinc-500 font-bold block mt-1.5 uppercase tracking-wider">{notif.hora}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer Notificaciones */}
                  <div className="p-3 border-t border-[#242428] bg-[#1C1C20]/80 text-center">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/inventario');
                      }}
                      className="text-[11px] font-bold text-[#E85D2F] hover:text-[#ff7444] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-full"
                    >
                      <span>Ver inventario e insumos</span> →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-tight text-white">{usuario?.nombre || 'Usuario'}</p>
                <p className="text-[10px] text-[#E85D2F] font-bold uppercase tracking-wider">{usuario?.rol || 'Sin rol'}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#E85D2F] text-white font-bold text-xs flex items-center justify-center border border-white/10 shadow-sm transition-transform hover:scale-105">
                {getInitials(usuario?.nombre)}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO DE LA PÁGINA (CON TRANSICIÓN SUAVE) */}
        <main className="flex-1 overflow-y-auto p-8 page-transition" key={location.pathname}>
          <Outlet />
        </main>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}