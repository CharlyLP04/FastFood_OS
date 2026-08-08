import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, ICONS } from '../components/ui/Icon';
import { useAuth } from '../hooks/useAuth';
import { getAlertasStockBajo, getDashboardMetrics } from '../services/api';
import { Toast } from '../components/ui/Toast';
import { CardSkeleton, TableRowSkeleton } from '../components/ui/Skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState('hoy'); // 'hoy' | '7dias' | '30dias'
  const [metrics, setMetrics] = useState({
    ventasDelDia: 0,
    crecimientoVentas: 0,
    pedidosActivos: 0,
    ticketPromedio: 0,
    totalPedidosPeriodo: 0,
    trendData: [],
    topProductos: [],
    ultimosPedidos: []
  });
  
  const [alertCount, setAlertCount] = useState(0);
  const [alertItems, setAlertItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState(null);

  const loadData = async (period) => {
    try {
      setLoading(true);
      const [metricsData, alertsData] = await Promise.all([
        getDashboardMetrics(period).catch(() => ({})),
        getAlertasStockBajo().catch(() => ({ total: 0, data: [] }))
      ]);
      
      const cleanMetrics = {
        ventasDelDia: Number(metricsData?.ventasDelDia || 0),
        crecimientoVentas: Number(metricsData?.crecimientoVentas || 0),
        pedidosActivos: Number(metricsData?.pedidosActivos || 0),
        ticketPromedio: Number(metricsData?.ticketPromedio || 0),
        totalPedidosPeriodo: Number(metricsData?.totalPedidosPeriodo || 0),
        trendData: Array.isArray(metricsData?.trendData) ? metricsData.trendData : [],
        topProductos: Array.isArray(metricsData?.topProductos) ? metricsData.topProductos : [],
        ultimosPedidos: Array.isArray(metricsData?.ultimosPedidos) ? metricsData.ultimosPedidos : []
      };

      setMetrics(cleanMetrics);
      setAlertCount(alertsData?.total || 0);
      setAlertItems(alertsData?.data || []);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      showToast('Error al cargar los datos del panel.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod]);

  const criticos = alertItems.filter(item => item.cantidad_actual === 0 || item.stock_minimo === 0 || (item.cantidad_actual / item.stock_minimo) <= 0.5).length;

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value || 0);
  };

  const getStatusBadge = (estado) => {
    switch(estado) {
      case 'pendiente':
      case 'nuevo':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E85D2F]/15 text-[#E85D2F] border border-[#E85D2F]/30">Nuevo</span>;
      case 'en_preparacion':
      case 'preparando':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">Cocina</span>;
      case 'listo':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">Listo</span>;
      case 'pagado':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">Pagado</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700">{estado}</span>;
    }
  };

  const today = new Date();
  const dateOptions = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('es-MX', dateOptions).toUpperCase().replace('.', '');

  const safeTrendData = Array.isArray(metrics?.trendData) && metrics.trendData.length > 0
    ? metrics.trendData
    : [
        { label: '09:00', ventas: 0, ordenes: 0 },
        { label: '12:00', ventas: 0, ordenes: 0 },
        { label: '15:00', ventas: 0, ordenes: 0 },
        { label: '18:00', ventas: 0, ordenes: 0 },
        { label: '21:00', ventas: 0, ordenes: 0 },
      ];

  const maxVentasInTrend = Math.max(...safeTrendData.map(t => Number(t?.ventas || 0)), 100);

  const safeTopProductos = Array.isArray(metrics?.topProductos) ? metrics.topProductos : [];
  const safeUltimosPedidos = Array.isArray(metrics?.ultimosPedidos) ? metrics.ultimosPedidos : [];

  return (
    <>
      <main className="flex-1 bg-[#0A0A0B] text-white font-body relative animate-fade-in">
        <div className="relative z-10 max-w-7xl mx-auto pb-16 space-y-8">
          
          {/* Header Superior del Dashboard con Filtros de Periodo Reales */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#242428] pb-6">
            <div>
              <h1 className="text-3xl font-heading font-black text-white tracking-tight flex items-center gap-3">
                <Icon path={ICONS.dashboard} size={32} className="text-[#E85D2F]" />
                Panel Ejecutivo A La Burger OS
              </h1>
              <p className="text-xs font-bold text-zinc-400 tracking-wider uppercase flex items-center gap-2 mt-1">
                <Icon path={ICONS.clock} size={14} />
                {formattedDate} • <span className="text-[#E85D2F]">SISTEMA EN TIEMPO REAL</span>
              </p>
            </div>
            
            {/* Filtros Funcionales: Hoy / 7 Días / 30 Días */}
            <div className="bg-[#141416] p-1.5 border border-[#242428] rounded-full flex gap-1 shadow-md">
              <button 
                onClick={() => setSelectedPeriod('hoy')}
                className={`text-xs font-heading font-bold px-5 py-2 rounded-full tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  selectedPeriod === 'hoy'
                    ? 'bg-[#E85D2F] text-white shadow-[0_0_12px_rgba(232,93,47,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Hoy
              </button>
              <button 
                onClick={() => setSelectedPeriod('7dias')}
                className={`text-xs font-heading font-bold px-5 py-2 rounded-full tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  selectedPeriod === '7dias'
                    ? 'bg-[#E85D2F] text-white shadow-[0_0_12px_rgba(232,93,47,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                7 Días
              </button>
              <button 
                onClick={() => setSelectedPeriod('30dias')}
                className={`text-xs font-heading font-bold px-5 py-2 rounded-full tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                  selectedPeriod === '30dias'
                    ? 'bg-[#E85D2F] text-white shadow-[0_0_12px_rgba(232,93,47,0.4)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                30 Días
              </button>
            </div>
          </div>

          {/* Tarjetas KPI de Métricas Clave */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                {/* 1. Ventas del Periodo */}
                <div className="bg-[#141416] border border-[#242428] rounded-2xl p-6 flex flex-col justify-between hover:border-[#E85D2F]/50 transition-all duration-200 shadow-xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Ventas ({selectedPeriod === 'hoy' ? 'Hoy' : selectedPeriod === '7dias' ? '7 Días' : '30 Días'})
                    </span>
                    <div className="text-[#E85D2F] bg-[#E85D2F]/15 p-3 rounded-xl border border-[#E85D2F]/30 group-hover:scale-110 transition-transform">
                      <Icon path={ICONS.chart} size={22} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-heading font-black text-white tracking-tight mb-2">
                      {formatCurrency(metrics.ventasDelDia)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider border ${
                        metrics.crecimientoVentas >= 0 
                          ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' 
                          : 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30'
                      }`}>
                        {metrics.crecimientoVentas >= 0 ? '↗ +' : '↘ '} {metrics.crecimientoVentas.toFixed(1)}%
                      </span>
                      <span className="text-zinc-500 font-bold text-xs uppercase tracking-wider">vs. anterior</span>
                    </div>
                  </div>
                </div>

                {/* 2. Pedidos Activos */}
                <div className="bg-[#141416] border border-[#242428] rounded-2xl p-6 flex flex-col justify-between hover:border-[#F59E0B]/50 transition-all duration-200 shadow-xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pedidos en Curso</span>
                    <div className="text-[#F59E0B] bg-[#F59E0B]/15 p-3 rounded-xl border border-[#F59E0B]/30 group-hover:scale-110 transition-transform">
                      <Icon path={ICONS.bag} size={22} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-heading font-black text-white tracking-tight mb-2 flex items-baseline gap-3">
                      {metrics.pedidosActivos}
                      <span className="text-xs font-bold text-[#F59E0B] tracking-wider uppercase bg-[#F59E0B]/15 px-3 py-1 rounded-full border border-[#F59E0B]/30 animate-pulse">
                        En Proceso
                      </span>
                    </h3>
                    <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
                      En cocina / entrega activa
                    </p>
                  </div>
                </div>

                {/* 3. Ticket Promedio */}
                <div className="bg-[#141416] border border-[#242428] rounded-2xl p-6 flex flex-col justify-between hover:border-[#10B981]/50 transition-all duration-200 shadow-xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ticket Promedio</span>
                    <div className="text-[#10B981] bg-[#10B981]/15 p-3 rounded-xl border border-[#10B981]/30 group-hover:scale-110 transition-transform">
                      <Icon path={ICONS.users} size={22} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-heading font-black text-white tracking-tight mb-2">
                      {formatCurrency(metrics.ticketPromedio)}
                    </h3>
                    <p className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
                      Promedio por comanda
                    </p>
                  </div>
                </div>

                {/* 4. Inventario Crítico */}
                <Link to="/inventario" className="bg-[#141416] border border-[#242428] rounded-2xl p-6 flex flex-col justify-between hover:border-[#EF4444]/50 transition-all duration-200 shadow-xl relative overflow-hidden group cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Alertas de Stock</span>
                    <div className="text-[#EF4444] bg-[#EF4444]/15 p-3 rounded-xl border border-[#EF4444]/30 group-hover:bg-[#EF4444] group-hover:text-white transition-all">
                      <Icon path={ICONS.box} size={22} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-heading font-black text-white tracking-tight mb-2 flex items-baseline gap-2">
                      {alertCount} 
                      <span className="text-xs font-bold text-zinc-400">INSUMOS</span>
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {alertCount > 0 ? (
                        <span className="bg-[#EF4444]/20 text-[#EF4444] px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase border border-[#EF4444]/30 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span>
                          {alertCount} por reordenar
                        </span>
                      ) : (
                        <span className="text-[#10B981] font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                          <Icon path={ICONS.check} size={14} /> Stock Saludable
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Gráfica de Tendencia de Ventas + Ranking de Productos Más Vendidos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Gráfica de Tendencia Visual SVG (2 columnas) */}
            <div className="lg:col-span-2 bg-[#141416] border border-[#242428] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Icon path={ICONS.chart} size={20} className="text-[#E85D2F]" />
                    Tendencia de Ventas ($ MXN)
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Comportamiento de ingresos en el periodo seleccionado</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-[#E85D2F]/15 text-[#E85D2F] border border-[#E85D2F]/30 rounded-full uppercase">
                  {selectedPeriod === 'hoy' ? 'Por Hora' : 'Por Día'}
                </span>
              </div>

              {/* Contenedor de Gráfica de Barras Interactiva */}
              <div className="h-64 flex items-end justify-between gap-3 pt-8 pb-2 px-4 bg-[#1C1C20]/60 rounded-xl border border-[#2D2D35] relative">
                {safeTrendData.map((item, idx) => {
                  const itemVentas = Number(item?.ventas || 0);
                  const itemOrdenes = Number(item?.ordenes || 0);
                  const heightPercent = Math.max(10, (itemVentas / maxVentasInTrend) * 100);
                  const isHovered = hoveredTrendIndex === idx;
                  return (
                    <div 
                      key={idx} 
                      className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer"
                      onMouseEnter={() => setHoveredTrendIndex(idx)}
                      onMouseLeave={() => setHoveredTrendIndex(null)}
                    >
                      {/* Tooltip flotante al pasar el mouse */}
                      {isHovered && (
                        <div className="absolute -top-12 bg-[#0A0A0B] text-white border border-[#E85D2F] px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xl z-20 whitespace-nowrap animate-pop-in">
                          <p className="text-[#E85D2F]">{formatCurrency(itemVentas)}</p>
                          <p className="text-[10px] text-zinc-400">{itemOrdenes} órdenes</p>
                        </div>
                      )}

                      {/* Barra Visual */}
                      <div 
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isHovered 
                            ? 'bg-[#E85D2F] shadow-[0_0_20px_rgba(232,93,47,0.8)]' 
                            : 'bg-gradient-to-t from-[#E85D2F]/40 to-[#E85D2F]'
                        }`}
                      />
                      <span className="text-[10px] font-bold text-zinc-400 mt-2 tracking-wider truncate uppercase">
                        {item?.label || ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 5 Productos Más Vendidos */}
            <div className="bg-[#141416] border border-[#242428] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Icon path={ICONS.box} size={20} className="text-[#F59E0B]" />
                    Top Platillos
                  </h2>
                  <span className="text-xs font-bold text-zinc-500 uppercase">Ventas</span>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    <CardSkeleton />
                  </div>
                ) : safeTopProductos.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-[#242428] rounded-xl">
                    Sin ventas registradas en este periodo.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {safeTopProductos.map((prod, idx) => (
                      <div key={prod.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#E85D2F]/20 text-[#E85D2F] text-[10px] flex items-center justify-center font-black">
                              #{idx + 1}
                            </span>
                            {prod.nombre}
                          </span>
                          <span className="text-[#F59E0B] font-bold">{prod.unidades} uds.</span>
                        </div>
                        <div className="w-full h-2 bg-[#1C1C20] rounded-full overflow-hidden border border-[#2D2D35]">
                          <div 
                            className="h-full bg-gradient-to-r from-[#E85D2F] to-[#F59E0B] rounded-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (prod.unidades / (safeTopProductos[0]?.unidades || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-6 border-t border-[#242428]">
                <Link to="/productos" className="text-xs font-bold text-[#E85D2F] hover:text-[#d64e21] uppercase tracking-wider flex items-center justify-center gap-1">
                  Ver catálogo completo →
                </Link>
              </div>
            </div>

          </div>

          {/* Tabla de Últimos Pedidos Recientes */}
          <div className="bg-[#141416] border border-[#242428] rounded-2xl shadow-xl p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-heading font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Icon path={ICONS.clock} size={18} className="text-[#E85D2F]" />
                Últimas Comandas en Vivo
              </h2>
              <Link to="/pedidos" className="text-xs font-bold text-[#E85D2F] hover:text-[#d64e21] uppercase tracking-wider transition-colors duration-200 flex items-center gap-1 bg-[#E85D2F]/15 hover:bg-[#E85D2F]/25 px-4 py-2 rounded-full active:scale-95 border border-[#E85D2F]/30">
                Ver todos los pedidos →
              </Link>
            </div>
            
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </tbody>
                </table>
              </div>
            ) : safeUltimosPedidos.length === 0 ? (
              <div className="p-12 text-center text-zinc-400 font-medium bg-[#1C1C20] rounded-xl border border-dashed border-[#242428] flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-[#E85D2F]/15 text-[#E85D2F] flex items-center justify-center mb-3">
                  <Icon path={ICONS.bag} size={24} />
                </div>
                <h4 className="font-heading font-bold text-white text-base mb-1">Sin pedidos registrados</h4>
                <p className="text-xs text-zinc-400">Las comandas desde la app de meseros aparecerán aquí automáticamente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1C1C20] text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-[#242428]">
                      <th className="px-5 py-3.5 rounded-l-xl">ID</th>
                      <th className="px-5 py-3.5">Mesa / Tipo</th>
                      <th className="px-5 py-3.5">Mesero</th>
                      <th className="px-5 py-3.5">Estado</th>
                      <th className="px-5 py-3.5">Total</th>
                      <th className="px-5 py-3.5 text-right rounded-r-xl">Hora</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-medium divide-y divide-[#242428]">
                    {safeUltimosPedidos.map((pedido) => (
                      <tr key={pedido.id} className="hover:bg-white/5 transition-colors duration-150">
                        <td className="px-5 py-3.5 text-white font-bold">#{pedido.id}</td>
                        <td className="px-5 py-3.5 text-zinc-300 font-bold uppercase text-xs">
                          {pedido.mesa_numero ? `Mesa ${pedido.mesa_numero}` : 'Llevar / Mostrador'}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400">{pedido.mesero || 'Mesero'}</td>
                        <td className="px-5 py-3.5">{getStatusBadge(pedido.estado)}</td>
                        <td className="px-5 py-3.5 text-[#E85D2F] font-bold text-base">{formatCurrency(pedido.total)}</td>
                        <td className="px-5 py-3.5 text-right text-zinc-400 text-xs font-bold">
                          {new Date(pedido.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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