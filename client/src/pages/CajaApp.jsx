import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, ICONS } from '../components/ui/Icon';
import { useAuth } from '../hooks/useAuth';
import { getPedidos, updatePedidoStatus } from '../services/api';
import { Toast } from '../components/ui/Toast';
import { CardSkeleton } from '../components/ui/Skeleton';

export default function CajaApp() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const fetchPedidos = async () => {
    try {
      const data = await getPedidos();
      setPedidos(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Error al cargar los pedidos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    setProcessingId(id);
    try {
      await updatePedidoStatus(id, newStatus);
      setToast({ message: `Pedido #${id} marcado como ${newStatus}`, type: 'success' });
      await fetchPedidos();
    } catch (err) {
      setToast({ message: err.message || 'No se pudo actualizar el pedido.', type: 'error' });
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const activos = pedidos.filter(p => !['pagado', 'cancelado'].includes(p.estado));
  
  const ventasHoy = pedidos
    .filter(p => p.estado === 'pagado')
    .reduce((sum, p) => sum + (p.total || 0), 0);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'listo': return 'bg-[#7A8450]/20 text-[#7A8450] border-[#7A8450]/30';
      case 'en_preparacion': return 'bg-[#E85D2F]/20 text-[#E85D2F] border-[#E85D2F]/30';
      case 'pendiente': return 'bg-[#D9A441]/20 text-[#D9A441] border-[#D9A441]/30';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col font-body animate-fade-in">
      {/* Header Caja */}
      <header className="flex justify-between items-center p-6 border-b border-[#242428] bg-[#141416] text-white shadow-sm">
        <div className="flex items-center gap-4">
          <Link to={usuario?.rol === 'administrador' ? '/' : '/caja'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-[#E85D2F]/15 border border-[#E85D2F]/30 p-2 rounded-xl text-[#E85D2F] flex items-center justify-center">
              <Icon path={ICONS.burger} size={20} />
            </div>
            <h1 className="font-heading font-black tracking-wider text-base uppercase text-white">BURGER OS <span className="text-zinc-500 font-normal ml-2">/ Caja Central</span></h1>
          </Link>
          {usuario?.rol === 'administrador' && (
            <Link to="/" className="text-xs bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-full transition-colors ml-2 uppercase tracking-wider active:scale-95">
              Volver al Panel
            </Link>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-zinc-400 font-bold tracking-wider uppercase mb-0.5">Corte Actual</p>
            <p className="text-[#7A8450] font-heading font-black text-xl leading-none">${ventasHoy.toFixed(2)}</p>
          </div>
          <div className="h-8 w-px bg-[#242428] hidden sm:block"></div>
          <button 
            onClick={async () => { await logout(); navigate('/login'); }}
            className="text-xs text-[#C1272D] hover:text-white bg-[#C1272D]/20 hover:bg-[#C1272D] font-bold px-4 py-2 rounded-full transition-colors cursor-pointer uppercase tracking-wider"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-heading font-black text-white uppercase tracking-tight">Pedidos Pendientes de Cobro</h2>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Selecciona una orden para registrar el pago o actualizar estado.</p>
          </div>
          <button 
            onClick={fetchPedidos}
            className="text-xs bg-[#141416] hover:bg-[#1C1C20] border border-[#242428] text-white font-bold px-4 py-2 rounded-full transition-all duration-200 uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Icon path={ICONS.refresh} size={14} /> Actualizar
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : error ? (
          <div className="bg-[#C1272D]/15 border border-[#C1272D] text-[#C1272D] p-6 rounded-xl text-center font-bold animate-fade-in">
            {error}
          </div>
        ) : activos.length === 0 ? (
          <div className="text-center py-20 bg-[#141416] rounded-xl border border-dashed border-[#242428] shadow-sm p-8 max-w-lg mx-auto animate-fade-in flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#7A8450]/15 text-[#7A8450] flex items-center justify-center mb-3">
              <Icon path={ICONS.check} size={28} />
            </div>
            <h3 className="text-xl font-heading font-bold text-white uppercase tracking-wider">Caja al día</h3>
            <p className="text-xs text-zinc-400 mt-1 font-medium">No hay pedidos pendientes de cobro en este momento. Las nuevas órdenes listas aparecerán aquí automáticamente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-fade-in">
            {activos.map(pedido => (
              <div key={pedido.id} className="bg-[#141416] border border-[#242428] rounded-xl p-6 flex flex-col shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${pedido.estado === 'listo' ? 'bg-[#7A8450]' : 'bg-[#E85D2F]'}`}></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-heading font-black text-white leading-none">#{pedido.id}</h3>
                    <p className="text-xs font-bold text-zinc-400 mt-1.5 uppercase tracking-wider">
                      {pedido.mesa_numero ? `Mesa ${pedido.mesa_numero}` : 'Mostrador'}
                    </p>
                  </div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusStyle(pedido.estado)}`}>
                    {pedido.estado}
                  </div>
                </div>

                <div className="flex-1 mt-2 mb-6">
                  <div className="space-y-2.5">
                    {pedido.items && pedido.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs items-center border-b border-[#242428] pb-2 last:border-0 last:pb-0">
                        <span className="font-bold text-white">
                          <span className="text-[#E85D2F] mr-2">{item.cantidad}x</span> 
                          {item.producto_nombre}
                        </span>
                        <span className="text-zinc-400 font-bold">${item.precio_unitario.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#242428]">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Total a cobrar</span>
                    <span className="text-2xl font-heading font-black text-white">${pedido.total.toFixed(2)}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(pedido.id, 'pagado')}
                      disabled={processingId === pedido.id}
                      className="flex-1 bg-[#7A8450] hover:bg-[#687242] text-white text-xs font-heading font-bold py-3 rounded-full transition-all duration-200 uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      {processingId === pedido.id ? '...' : (
                        <>
                          <Icon path={ICONS.check} size={16} /> Registrar Pago
                        </>
                      )}
                    </button>
                    {pedido.estado === 'pendiente' && (
                      <button
                        onClick={() => handleUpdateStatus(pedido.id, 'cancelado')}
                        disabled={processingId === pedido.id}
                        className="bg-[#C1272D]/20 text-[#C1272D] hover:bg-[#C1272D] hover:text-white border border-[#C1272D]/30 text-xs font-bold p-3 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        title="Cancelar Pedido"
                      >
                        <Icon path={ICONS.trash} size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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
