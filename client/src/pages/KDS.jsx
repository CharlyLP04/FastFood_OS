import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, ICONS } from '../components/ui/Icon';
import { useAuth } from '../hooks/useAuth';
import { getPedidos, updatePedidoStatus } from '../services/api';
import { Toast } from '../components/ui/Toast';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function KDS() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [now, setNow] = useState(new Date());

  const fetchPedidos = async () => {
    try {
      const data = await getPedidos();
      const cocinaPedidos = data.filter(p => p.estado === 'pendiente' || p.estado === 'en_preparacion');
      cocinaPedidos.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setPedidos(cocinaPedidos);
      setError('');
    } catch (err) {
      setError(err.message || 'Error al cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const fetchInterval = setInterval(fetchPedidos, 10000);
    const timeInterval = setInterval(() => setNow(new Date()), 10000);
    return () => {
      clearInterval(fetchInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setProcessingId(id);
    try {
      await updatePedidoStatus(id, newStatus);
      setToast({ message: `Pedido #${id} marcado como ${newStatus}`, type: 'success' });
      await fetchPedidos();
    } catch (err) {
      setToast({ message: err.message || 'Error al actualizar el estado', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  const getElapsedMinutes = (dateString) => {
    const start = new Date(dateString);
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? `${diffMins}m` : '<1m';
  };

  const parseNotesToMods = (notasText) => {
    if (!notasText) return [];
    const rawMods = notasText.split(/,|\n/).map(s => s.trim()).filter(s => s.length > 0);
    return rawMods.map(text => {
      const upper = text.toUpperCase();
      let type = 'add';
      if (upper.includes('SIN ') || upper.includes('NO ')) type = 'remove';
      else if (upper.includes('EXTRA ')) type = 'extra';
      return { type, text: upper };
    });
  };

  const getModColor = (type) => {
    if (type === 'remove') return 'border-[#C1272D] text-[#C1272D] bg-[#C1272D]/15';
    if (type === 'add') return 'border-[#D9A441] text-[#D9A441] bg-[#D9A441]/15';
    return 'border-[#7A8450] text-[#7A8450] bg-[#7A8450]/15';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 font-body animate-fade-in">
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header Cocina */}
      <header className="flex flex-wrap justify-between items-center mb-8 border-b border-[#242428] pb-4 bg-[#141416] text-white p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-4">
          <Link to={usuario?.rol === 'administrador' ? '/' : '/cocina'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-[#E85D2F]/15 border border-[#E85D2F]/30 p-2 rounded-xl text-[#E85D2F] flex items-center justify-center">
              <Icon path={ICONS.burger} size={20} />
            </div>
            <h1 className="font-heading font-black tracking-wider text-sm uppercase text-white">A LA BURGER OS <span className="text-zinc-500 font-normal ml-2">/ KDS Cocina</span></h1>
          </Link>
          {usuario?.rol === 'administrador' && (
            <Link to="/" className="text-xs bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-full transition-colors ml-2 active:scale-95">
              Volver al Panel
            </Link>
          )}
        </div>
        <div className="flex gap-4 text-xs font-bold tracking-wider items-center">
          <span className="text-zinc-500 hidden md:inline">LEYENDA:</span>
          <span className="text-[#C1272D] items-center gap-1 hidden sm:flex"><div className="w-2 h-2 rounded-full bg-[#C1272D]"></div> QUITAR</span>
          <span className="text-[#D9A441] items-center gap-1 hidden sm:flex"><div className="w-2 h-2 rounded-full bg-[#D9A441]"></div> AGREGAR</span>
          <span className="text-[#7A8450] items-center gap-1 hidden sm:flex"><div className="w-2 h-2 rounded-full bg-[#7A8450]"></div> EXTRA</span>
          
          <button 
            onClick={async () => { await logout(); navigate('/login'); }}
            className="text-xs text-[#C1272D] hover:text-white bg-[#C1272D]/20 hover:bg-[#C1272D] font-bold px-4 py-1.5 rounded-full transition-colors cursor-pointer uppercase tracking-wider ml-4 active:scale-95"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Loading / Error / Empty States */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <div className="bg-[#C1272D]/15 border border-[#C1272D] text-[#C1272D] p-6 rounded-xl text-center font-bold animate-fade-in">
          {error}
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-20 bg-[#141416] rounded-xl border border-dashed border-[#242428] shadow-sm p-8 max-w-lg mx-auto animate-fade-in flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-[#E85D2F]/15 text-[#E85D2F] flex items-center justify-center mb-4">
            <Icon path={ICONS.chef} size={28} />
          </div>
          <h3 className="font-heading font-black text-white text-xl mb-1">Cocina limpia y al día</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">No hay comandas pendientes. Los pedidos nuevos aparecerán aquí automáticamente en tiempo real.</p>
        </div>
      ) : (
        /* Grid de Comandas con animación de llegada */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pedidos.map((order) => {
            const isPreparing = order.estado === 'en_preparacion';
            return (
              <div key={order.id} className="bg-[#141416] border border-[#242428] rounded-xl p-5 flex flex-col h-full shadow-md hover:shadow-lg transition-all duration-200 animate-order-arrive">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-2xl font-heading font-black text-white">#{order.id}</h2>
                  <span className="bg-[#1C1C20] border border-[#2D2D35] text-zinc-300 text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                    {order.mesa_numero ? `MESA ${order.mesa_numero}` : 'LLEVAR'}
                  </span>
                </div>
                
                <div className={`flex items-center gap-1 mb-5 font-bold text-xs ${isPreparing ? 'text-[#E85D2F]' : 'text-[#7A8450]'}`}>
                   <Icon path={ICONS.clock} size={14} />
                   {getElapsedMinutes(order.created_at)} <span className="text-zinc-500 text-xs font-normal">transcurrido</span>
                </div>

                {/* Items */}
                <div className="flex-1 space-y-3 border-t border-[#242428] pt-4">
                  {order.items.map((item, idx) => {
                    const mods = parseNotesToMods(item.notas);
                    return (
                      <div key={idx} className="bg-[#1C1C20] p-3 rounded-xl border border-[#2D2D35]">
                        <p className="font-bold text-sm text-white">
                          {item.producto_nombre} <span className="text-[#E85D2F]">×{item.cantidad}</span>
                        </p>
                        {mods.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {mods.map((mod, midx) => (
                              <span key={midx} className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getModColor(mod.type)}`}>
                                {mod.text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-[#242428]">
                  {isPreparing ? (
                    <button 
                      onClick={() => handleUpdateStatus(order.id, 'listo')}
                      disabled={processingId === order.id}
                      className="w-full bg-[#7A8450] hover:bg-[#687242] text-white font-heading font-bold py-3 rounded-full flex items-center justify-center gap-2 tracking-wider text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 uppercase shadow-sm active:scale-95"
                    >
                      {processingId === order.id ? 'PROCESANDO...' : (
                        <>MARCAR LISTO <Icon path={ICONS.check} size={16} /></>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-center text-[#E85D2F] text-[10px] font-bold tracking-widest uppercase">NUEVA ORDEN</div>
                      <button 
                        onClick={() => handleUpdateStatus(order.id, 'en_preparacion')}
                        disabled={processingId === order.id}
                        className="w-full bg-[#E85D2F] hover:bg-[#d64e21] text-white font-heading font-bold py-3 rounded-full flex items-center justify-center gap-2 tracking-wider text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 uppercase shadow-sm active:scale-95"
                      >
                        {processingId === order.id ? 'PROCESANDO...' : (
                          <><Icon path={ICONS.chef} size={16} /> EMPEZAR A PREPARAR</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}