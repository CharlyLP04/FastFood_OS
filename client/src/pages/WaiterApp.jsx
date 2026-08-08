import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, ICONS } from '../components/ui/Icon';
import { getProductos, crearPedido } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { CardSkeleton } from '../components/ui/Skeleton';

const MESA_ID = 5;

export default function WaiterApp() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cart, setCart] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderMessage, setOrderMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProductos() {
      try {
        const data = await getProductos();
        if (!cancelled) {
          setProductos(data.data || data.productos || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudieron cargar los productos.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProductos();
    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = (productoId) => {
    setCart((prev) => ({
      ...prev,
      [productoId]: (prev[productoId] || 0) + 1,
    }));
    setOrderMessage(null);
  };

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const cartItems = productos
    .filter((p) => cart[p.id])
    .map((p) => ({
      ...p,
      cantidad: cart[p.id],
    }));

  const cartTotal = cartItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) return;

    setSubmitting(true);
    setOrderMessage(null);

    try {
      const payload = {
        mesa_id: MESA_ID,
        mesero_id: usuario?.id || 1,
        tipo: 'local',
        productos: cartItems.map((item) => ({
          producto_id: item.id,
          cantidad: item.cantidad,
        })),
      };

      const data = await crearPedido(payload);
      setOrderMessage({
        type: 'success',
        text: `${data.mensaje} — Pedido #${data.pedido.id} · Total $${data.pedido.total}`,
      });
      setCart({});
      setShowCart(false);
    } catch (err) {
      setOrderMessage({
        type: 'error',
        text: err.message || 'No se pudo crear el pedido.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex justify-center font-body animate-fade-in">
      <div className="w-full max-w-md border-x border-[#242428] bg-[#141416] flex flex-col h-screen shadow-2xl">
        
        {/* Header App Mesero */}
        <header className="p-5 flex justify-between items-center border-b border-[#242428] bg-[#141416] text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to={usuario?.rol === 'administrador' ? '/' : '/mesero'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="bg-[#E85D2F]/15 border border-[#E85D2F]/30 p-1.5 rounded-xl text-[#E85D2F] flex items-center justify-center">
                  <Icon path={ICONS.burger} size={18} />
                </div>
                <h1 className="font-heading font-black tracking-wider text-base text-white uppercase">BURGER OS</h1>
              </Link>
              {usuario?.rol === 'administrador' && (
                <Link to="/" className="text-[10px] bg-white/10 text-white font-bold px-2.5 py-1 rounded-full ml-1 transition-colors uppercase active:scale-95">
                  Panel
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                MESA <span className="bg-[#E85D2F] text-white px-2 py-0.5 rounded-full text-[11px] font-black">5</span>
              </div>
              <button 
                onClick={async () => { await logout(); navigate('/login'); }}
                className="text-[10px] text-[#C1272D] hover:text-white bg-[#C1272D]/20 hover:bg-[#C1272D] font-bold px-2.5 py-1 rounded-full transition-colors cursor-pointer uppercase tracking-wider active:scale-95"
              >
                Salir
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCart((prev) => !prev)}
            className="bg-[#1C1C20] border border-[#2D2D35] p-3 rounded-full hover:bg-white/10 transition-all duration-200 relative cursor-pointer text-white active:scale-95"
          >
            <Icon path={ICONS.cart} size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#E85D2F] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </header>

        {orderMessage && (
          <div
            className={`mx-4 mt-4 px-4 py-3 rounded-xl text-xs font-bold border animate-slide-up ${
              orderMessage.type === 'success'
                ? 'bg-[#7A8450]/20 text-[#7A8450] border-[#7A8450]/40'
                : 'bg-[#C1272D]/20 text-[#C1272D] border-[#C1272D]/40'
            }`}
          >
            {orderMessage.text}
          </div>
        )}

        {/* Lista de Productos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0B]/60">
          {loading ? (
            <div className="space-y-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : error ? (
            <div className="bg-[#C1272D]/20 border border-[#C1272D] text-[#C1272D] p-4 rounded-xl text-center text-xs font-bold animate-fade-in">
              {error}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {productos.map((item) => (
                <div key={item.id} className="bg-[#141416] p-4 rounded-xl border border-[#242428] shadow-md flex gap-4 hover:border-[#E85D2F]/50 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-[#E85D2F]/15 text-[#E85D2F] flex items-center justify-center shrink-0">
                    <Icon path={ICONS.box} size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-base text-white">{item.nombre}</h3>
                    <p className="text-zinc-400 text-xs leading-snug mb-3">
                      {item.descripcion}
                    </p>
                    <div className="text-[#E85D2F] font-heading font-black text-lg">${item.precio}</div>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => addToCart(item.id)}
                      className="bg-[#E85D2F] text-white p-2.5 rounded-full hover:bg-[#d64e21] transition-all duration-200 cursor-pointer shadow-sm active:scale-90"
                    >
                      <Icon path={ICONS.plus} size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showCart && cartItems.length > 0 && (
          <div className="border-t border-[#242428] bg-[#141416] p-4 space-y-3 shadow-2xl animate-slide-up">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <span className="text-zinc-400 font-bold">
                  {item.cantidad}x {item.nombre}
                </span>
                <span className="font-bold text-white">${(item.precio * item.cantidad).toFixed(0)}</span>
              </div>
            ))}
            <div className="flex justify-between font-heading font-bold text-base pt-2 border-t border-[#242428] text-white">
              <span>Total</span>
              <span className="text-[#E85D2F]">${cartTotal.toFixed(0)}</span>
            </div>
            <button
              type="button"
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="w-full bg-[#E85D2F] hover:bg-[#d64e21] text-white font-heading font-bold py-3 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-60 uppercase text-xs tracking-wider shadow-md active:scale-95"
            >
              {submitting ? 'Enviando pedido...' : 'Confirmar pedido'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
