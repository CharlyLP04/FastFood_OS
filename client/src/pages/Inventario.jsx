import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, ICONS } from '../components/ui/Icon';
import { getInitials, hasRole } from '../utils/auth';
import { useAuth } from '../hooks/useAuth';

import { getInventario, crearIngrediente, editarIngrediente, registrarEntrada, getMovimientos, registrarMerma, getTodosLosMovimientos } from '../services/api';

export default function Inventario() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inventario, setInventario] = useState([]);
  const [soloStockBajo, setSoloStockBajo] = useState(false);

  // Estados del modal para nuevo ingrediente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalNombre, setModalNombre] = useState('');
  const [modalCantidad, setModalCantidad] = useState('');
  const [modalUnidad, setModalUnidad] = useState('kg');
  const [modalStockMinimo, setModalStockMinimo] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Estados del modal para registrar entrada
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [entradaId, setEntradaId] = useState(null);
  const [entradaNombre, setEntradaNombre] = useState('');
  const [entradaCantidad, setEntradaCantidad] = useState('');
  const [entradaProveedor, setEntradaProveedor] = useState('');
  const [entradaCosto, setEntradaCosto] = useState('');
  const [entradaError, setEntradaError] = useState('');
  const [entradaSubmitting, setEntradaSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Estados del modal de Merma
  const [isMermaModalOpen, setIsMermaModalOpen] = useState(false);
  const [mermaId, setMermaId] = useState(null);
  const [mermaNombre, setMermaNombre] = useState('');
  const [mermaCantidad, setMermaCantidad] = useState('');
  const [mermaMotivo, setMermaMotivo] = useState('');
  const [mermaError, setMermaError] = useState('');
  const [mermaSubmitting, setMermaSubmitting] = useState(false);

  // Estados del modal de Historial de Movimientos
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [historialList, setHistorialList] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialError, setHistorialError] = useState('');
  const [historialFiltroTipo, setHistorialFiltroTipo] = useState('');

  const loadInventario = async (stockBajoOnly) => {
    setLoading(true);
    setError('');
    try {
      const result = await getInventario(stockBajoOnly);
      setInventario(result.data || []);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setError(err.message || 'No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventario(soloStockBajo);
  }, [soloStockBajo]);

  const handleCrearIngrediente = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSubmitting(true);
    try {
      const payload = {
        nombre: modalNombre.trim(),
        unidad: modalUnidad,
        stock_minimo: Number(modalStockMinimo) || 0,
      };

      if (isEditing) {
        await editarIngrediente(editingId, payload);
        setSuccessMessage(`Insumo "${modalNombre}" actualizado con éxito.`);
      } else {
        payload.cantidad_actual = Number(modalCantidad) || 0;
        await crearIngrediente(payload);
        setSuccessMessage(`Insumo "${modalNombre}" registrado con éxito.`);
      }

      setIsModalOpen(false);
      setIsEditing(false);
      setEditingId(null);
      setModalNombre('');
      setModalCantidad('');
      setModalUnidad('kg');
      setModalStockMinimo('');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadInventario(soloStockBajo);
    } catch (err) {
      console.error('Error al guardar ingrediente:', err);
      setModalError(err.message || 'No se pudo guardar el insumo.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleOpenEditModal = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setModalNombre(item.nombre);
    setModalCantidad(item.cantidad_actual.toString());
    setModalUnidad(item.unidad);
    setModalStockMinimo(item.stock_minimo.toString());
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEntradaModal = (item) => {
    setEntradaId(item.id);
    setEntradaNombre(item.nombre);
    setEntradaCantidad('');
    setEntradaProveedor('');
    setEntradaCosto('');
    setEntradaError('');
    setIsEntradaModalOpen(true);
  };

  const handleSaveEntrada = async (e) => {
    e.preventDefault();
    setEntradaError('');
    setEntradaSubmitting(true);
    try {
      const payload = {
        cantidad: Number(entradaCantidad),
        proveedor: entradaProveedor.trim() || undefined,
        costo_unitario: entradaCosto !== '' ? Number(entradaCosto) : undefined,
      };

      await registrarEntrada(entradaId, payload);
      setSuccessMessage(`¡Entrada registrada con éxito para ${entradaNombre}!`);
      setTimeout(() => setSuccessMessage(''), 4000);

      setIsEntradaModalOpen(false);
      setEntradaId(null);
      loadInventario(soloStockBajo);
    } catch (err) {
      console.error('Error al registrar entrada:', err);
      setEntradaError(err.message || 'No se pudo registrar la entrada.');
    } finally {
      setEntradaSubmitting(false);
    }
  };

  const handleOpenMermaModal = (item) => {
    setMermaId(item.id);
    setMermaNombre(item.nombre);
    setMermaCantidad('');
    setMermaMotivo('');
    setMermaError('');
    setIsMermaModalOpen(true);
  };

  const handleSaveMerma = async (e) => {
    e.preventDefault();
    setMermaError('');
    setMermaSubmitting(true);
    try {
      const payload = {
        cantidad: Number(mermaCantidad),
        motivo: mermaMotivo.trim(),
      };

      await registrarMerma(mermaId, payload);
      setSuccessMessage(`¡Merma registrada con éxito para ${mermaNombre}!`);
      setTimeout(() => setSuccessMessage(''), 4000);

      setIsMermaModalOpen(false);
      setMermaId(null);
      loadInventario(soloStockBajo);
    } catch (err) {
      console.error('Error al registrar merma:', err);
      setMermaError(err.message || 'No se pudo registrar la merma.');
    } finally {
      setMermaSubmitting(false);
    }
  };

  const loadHistorial = async (tipo) => {
    setHistorialLoading(true);
    setHistorialError('');
    try {
      const res = await getTodosLosMovimientos(tipo);
      setHistorialList(res.data || []);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setHistorialError(err.message || 'No se pudo cargar el historial.');
    } finally {
      setHistorialLoading(false);
    }
  };

  const handleOpenHistorialModal = () => {
    setHistorialFiltroTipo('');
    setIsHistorialModalOpen(true);
    loadHistorial('');
  };

  useEffect(() => {
    if (isHistorialModalOpen) {
      loadHistorial(historialFiltroTipo);
    }
  }, [historialFiltroTipo]);

  const displayInventario = [...inventario].sort((a, b) => {
    if (soloStockBajo) {
      const ratioA = a.stock_minimo === 0 ? 0 : a.cantidad_actual / a.stock_minimo;
      const ratioB = b.stock_minimo === 0 ? 0 : b.cantidad_actual / b.stock_minimo;
      return ratioA - ratioB;
    }
    return 0;
  });

  return (
    <>
      <main className="flex-1 bg-[#0A0A0B] text-white font-body animate-fade-in">
        <div className="max-w-7xl mx-auto pb-20">
          
          {/* Header de Inventario */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 border-b border-[#242428] pb-6">
            <div>
              <h1 className="text-3xl font-heading font-black text-white tracking-tight flex items-center gap-3">
                <Icon path={ICONS.box} size={30} className="text-[#E85D2F]" />
                Inventario de Materia Prima
              </h1>
              <p className="text-xs sm:text-sm font-medium text-zinc-400 mt-1">
                Control en tiempo real de existencias, insumos y auditoría de movimientos.
              </p>
            </div>

            {/* Controles: Botones de Acción */}
            <div className="flex items-center gap-3">
              {hasRole(usuario, ['administrador']) && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenHistorialModal}
                    className="flex items-center gap-2 bg-[#141416] hover:bg-[#1C1C20] text-white border border-[#242428] px-4 py-3 rounded-full font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Icon path={ICONS.clipboardList} size={16} className="text-[#E85D2F]" /> Ver Movimientos
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingId(null);
                      setModalNombre('');
                      setModalCantidad('');
                      setModalUnidad('kg');
                      setModalStockMinimo('');
                      setModalError('');
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#E85D2F] to-[#d64e21] hover:from-[#f0683a] hover:to-[#e85d2f] text-white font-heading font-black text-xs uppercase tracking-wider px-5 py-3 rounded-full transition-all shadow-[0_4px_20px_rgba(232,93,47,0.35)] active:scale-95 cursor-pointer"
                  >
                    <Icon path={ICONS.plus} size={18} /> Nuevo Insumo
                  </button>
                </>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer bg-[#141416] border border-[#242428] px-4 py-3 rounded-full hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={soloStockBajo}
                  onChange={(e) => setSoloStockBajo(e.target.checked)}
                  className="accent-[#E85D2F] h-4 w-4 cursor-pointer"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Solo stock bajo
                </span>
              </label>
            </div>
          </div>

          {/* Banners */}
          {error && (
            <div className="mb-6 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl p-4 flex items-center gap-3 text-[#EF4444] text-xs font-bold uppercase tracking-wider animate-fade-in">
              <Icon path={ICONS.trash} size={18} /> {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-6 bg-[#10B981]/15 border border-[#10B981]/30 rounded-xl p-4 flex items-center gap-3 text-[#10B981] text-xs font-bold uppercase tracking-wider animate-fade-in">
              <Icon path={ICONS.check} size={18} /> {successMessage}
            </div>
          )}

          {/* Tabla de Inventario */}
          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-xs font-bold flex items-center justify-center gap-2">
              <Icon path={ICONS.refresh} size={20} className="animate-spin text-[#E85D2F]" /> Cargando insumos...
            </div>
          ) : inventario.length === 0 ? (
            <div className="border border-dashed border-[#242428] rounded-xl py-16 flex flex-col items-center justify-center text-center text-zinc-400 bg-[#141416] p-8">
              <div className="w-14 h-14 rounded-full bg-[#E85D2F]/15 text-[#E85D2F] flex items-center justify-center mb-3">
                <Icon path={ICONS.box} size={28} />
              </div>
              <p className="text-sm font-heading font-bold uppercase tracking-wider text-white mb-1">Sin insumos registrados</p>
              <p className="text-xs text-zinc-400 max-w-xs">Haz clic en "Nuevo Insumo" para registrar tus primeras materias primas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-[#141416] border border-[#242428] rounded-xl shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#242428] text-xs font-bold text-zinc-400 uppercase tracking-wider bg-[#1C1C20]">
                    <th className="p-4 pl-6 rounded-tl-xl">Insumo</th>
                    <th className="p-4 text-right">Existencias</th>
                    <th className="p-4">Unidad</th>
                    <th className="p-4 text-right">Mínimo</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 pr-6">Última Actualización</th>
                    <th className="p-4 text-center pr-6 rounded-tr-xl">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242428] text-sm font-medium">
                  {displayInventario.map((item) => {
                    const isLowStock = item.cantidad_actual <= item.stock_minimo;
                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 pl-6 font-bold text-white uppercase text-xs">
                          {item.nombre}
                        </td>
                        <td className={`p-4 text-right font-black text-base ${isLowStock ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                          {item.cantidad_actual}
                        </td>
                        <td className="p-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          {item.unidad}
                        </td>
                        <td className="p-4 text-right font-bold text-xs text-zinc-400">
                          {item.stock_minimo}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                            isLowStock 
                              ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30' 
                              : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                          }`}>
                            {isLowStock ? 'Stock Bajo' : 'Suficiente'}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-xs text-zinc-400 font-medium">
                          {item.ultima_actualizacion
                            ? new Date(item.ultima_actualizacion).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                            : 'Sin registro'}
                        </td>
                        <td className="p-4 text-center pr-6">
                          <div className="flex items-center justify-center gap-2">
                            {hasRole(usuario, ['administrador']) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEntradaModal(item)}
                                  className="text-xs font-bold bg-[#E85D2F]/15 hover:bg-[#E85D2F] text-[#E85D2F] hover:text-white px-3 py-1.5 rounded-full transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1 active:scale-95"
                                >
                                  <Icon path={ICONS.download} size={14} /> Entrada
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(item)}
                                  className="text-xs font-bold bg-[#1C1C20] hover:bg-white/10 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1 active:scale-95"
                                >
                                  <Icon path={ICONS.edit} size={14} /> Editar
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenMermaModal(item)}
                              className="text-xs font-bold bg-[#EF4444]/15 hover:bg-[#EF4444] text-[#EF4444] hover:text-white px-3 py-1.5 rounded-full transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1 active:scale-95"
                            >
                              <Icon path={ICONS.trash} size={14} /> Merma
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
         MODAL CREAR / EDITAR INSUMO — ULTRA PREMIUM DESIGN
         ───────────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-[#141416]/95 border border-[#242428] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(232,93,47,0.15)] overflow-hidden animate-pop-in">
            {/* Top Accent Gradient Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#E85D2F] via-[#F59E0B] to-[#E85D2F]" />

            {/* Header Modal */}
            <div className="p-6 border-b border-[#242428] flex items-center justify-between bg-[#1C1C20]/80">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E85D2F]/20 to-transparent border border-[#E85D2F]/30 text-[#E85D2F] flex items-center justify-center shadow-inner">
                  <Icon path={ICONS.box} size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                    {isEditing ? 'Editar Insumo' : 'Nuevo Insumo'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium">Registra existencias de materia prima</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCrearIngrediente} className="p-6 space-y-5">
              {modalError && (
                <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl p-3.5 text-xs font-bold text-[#EF4444] uppercase tracking-wide flex items-center gap-2">
                  <Icon path={ICONS.trash} size={16} /> {modalError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Nombre del Insumo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={modalNombre}
                    onChange={(e) => setModalNombre(e.target.value)}
                    placeholder="Ej. Carne de Res 200g, Queso Cheddar"
                    className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-2 focus:ring-[#E85D2F]/20 text-white rounded-xl px-4 py-3.5 text-sm outline-none transition-all font-medium placeholder-zinc-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    {isEditing ? 'Cantidad Actual' : 'Cantidad Inicial'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    min="0"
                    readOnly={isEditing}
                    value={modalCantidad}
                    onChange={(e) => setModalCantidad(e.target.value)}
                    placeholder="0"
                    className={`w-full border border-[#2D2D35] text-white rounded-xl px-4 py-3.5 text-sm outline-none font-bold ${
                      isEditing ? 'bg-[#141416] text-zinc-500 cursor-not-allowed border-dashed' : 'bg-[#1C1C20] focus:border-[#E85D2F]'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Unidad de Medida
                  </label>
                  <select
                    value={modalUnidad}
                    onChange={(e) => setModalUnidad(e.target.value)}
                    className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-2 focus:ring-[#E85D2F]/20 text-white rounded-xl px-4 py-3.5 text-sm outline-none font-medium cursor-pointer"
                  >
                    <option value="kg">kg (Kilogramo)</option>
                    <option value="g">g (Gramo)</option>
                    <option value="l">l (Litro)</option>
                    <option value="ml">ml (Mililitro)</option>
                    <option value="pza">pza (Pieza)</option>
                    <option value="caja">caja (Caja)</option>
                    <option value="botella">botella (Botella)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Stock Mínimo (Alerta de Reorden)
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  min="0"
                  value={modalStockMinimo}
                  onChange={(e) => setModalStockMinimo(e.target.value)}
                  placeholder="Ej. 10"
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-2 focus:ring-[#E85D2F]/20 text-white rounded-xl px-4 py-3.5 text-sm outline-none font-medium placeholder-zinc-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242428]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-6 py-2.5 rounded-full text-xs font-heading font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#E85D2F] to-[#d64e21] hover:from-[#f0683a] hover:to-[#e85d2f] shadow-[0_4px_20px_rgba(232,93,47,0.4)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {modalSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Registrar Insumo')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
         MODAL HISTORIAL DE MOVIMIENTOS — FUNCIONAL (CORREGIDO)
         ───────────────────────────────────────────────────────────── */}
      {isHistorialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsHistorialModalOpen(false)} />
          
          <div className="relative w-full max-w-4xl bg-[#141416]/95 border border-[#242428] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
            
            {/* Header Movimientos */}
            <div className="p-6 border-b border-[#242428] flex items-center justify-between bg-[#1C1C20] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E85D2F]/15 border border-[#E85D2F]/30 text-[#E85D2F] flex items-center justify-center">
                  <Icon path={ICONS.clipboardList} size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                    Movimientos de Inventario
                  </h2>
                  <p className="text-xs text-zinc-400">Auditoría completa de entradas, mermas y salidas</p>
                </div>
              </div>

              {/* Filtros por tipo */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistorialFiltroTipo('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${
                    historialFiltroTipo === '' ? 'bg-[#E85D2F] text-white' : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setHistorialFiltroTipo('entrada')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${
                    historialFiltroTipo === 'entrada' ? 'bg-[#10B981] text-white' : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  Entradas
                </button>
                <button
                  onClick={() => setHistorialFiltroTipo('merma')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-colors ${
                    historialFiltroTipo === 'merma' ? 'bg-[#EF4444] text-white' : 'bg-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  Mermas
                </button>

                <button 
                  onClick={() => setIsHistorialModalOpen(false)} 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center ml-4 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tabla del Historial */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {historialLoading ? (
                <div className="p-12 text-center text-zinc-400 text-xs font-bold flex items-center justify-center gap-2">
                  <Icon path={ICONS.refresh} size={20} className="animate-spin text-[#E85D2F]" /> Cargando movimientos...
                </div>
              ) : historialList.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 text-xs border border-dashed border-[#242428] rounded-xl p-8">
                  Sin registro de movimientos para este filtro.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1C1C20] text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-[#242428]">
                      <th className="px-4 py-3 rounded-tl-xl">Insumo</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3 text-right">Cantidad</th>
                      <th className="px-4 py-3">Motivo / Referencia</th>
                      <th className="px-4 py-3 text-right rounded-tr-xl">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242428] text-xs font-medium">
                    {historialList.map((mov) => {
                      const isEntrada = mov.tipo === 'entrada';
                      const isMerma = mov.tipo === 'merma';
                      return (
                        <tr key={mov.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{mov.ingrediente_nombre}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              isEntrada 
                                ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' 
                                : isMerma 
                                ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30' 
                                : 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30'
                            }`}>
                              {mov.tipo}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${isEntrada ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {isEntrada ? '+' : '-'}{mov.cantidad}
                          </td>
                          <td className="px-4 py-3 text-zinc-400 max-w-xs truncate">
                            {mov.motivo || mov.referencia || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-500 font-bold">
                            {new Date(mov.fecha || mov.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-[#242428] bg-[#1C1C20] text-right shrink-0">
              <button
                onClick={() => setIsHistorialModalOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR ENTRADA */}
      {isEntradaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setIsEntradaModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#141416] border border-[#242428] rounded-2xl shadow-2xl overflow-hidden animate-pop-in">
            <div className="p-6 border-b border-[#242428] flex items-center justify-between bg-[#1C1C20]">
              <h3 className="font-heading font-black text-lg text-white uppercase">
                Entrada: {entradaNombre}
              </h3>
              <button onClick={() => setIsEntradaModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveEntrada} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Cantidad Recibida</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={entradaCantidad}
                  onChange={(e) => setEntradaCantidad(e.target.value)}
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] text-white rounded-xl px-4 py-3 text-sm outline-none font-medium"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Proveedor (Opcional)</label>
                <input
                  type="text"
                  value={entradaProveedor}
                  onChange={(e) => setEntradaProveedor(e.target.value)}
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] text-white rounded-xl px-4 py-3 text-sm outline-none font-medium"
                  placeholder="Ej. Distribuidora Carnes SA"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#242428]">
                <button type="button" onClick={() => setIsEntradaModalOpen(false)} className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-400">Cancelar</button>
                <button type="submit" disabled={entradaSubmitting} className="px-6 py-2.5 rounded-full text-xs font-heading font-bold text-white bg-[#10B981] hover:bg-[#059669]">
                  {entradaSubmitting ? 'Guardando...' : 'Registrar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MERMA */}
      {isMermaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setIsMermaModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#141416] border border-[#242428] rounded-2xl shadow-2xl overflow-hidden animate-pop-in">
            <div className="p-6 border-b border-[#242428] flex items-center justify-between bg-[#1C1C20]">
              <h3 className="font-heading font-black text-lg text-[#EF4444] uppercase">
                Registrar Merma: {mermaNombre}
              </h3>
              <button onClick={() => setIsMermaModalOpen(false)} className="text-zinc-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveMerma} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Cantidad Perdida</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  required
                  value={mermaCantidad}
                  onChange={(e) => setMermaCantidad(e.target.value)}
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#EF4444] text-white rounded-xl px-4 py-3 text-sm outline-none font-medium"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Motivo de Merma</label>
                <textarea
                  required
                  value={mermaMotivo}
                  onChange={(e) => setMermaMotivo(e.target.value)}
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#EF4444] text-white rounded-xl px-4 py-3 text-sm outline-none font-medium"
                  placeholder="Ej. Expiración, empaque dañado, caída..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#242428]">
                <button type="button" onClick={() => setIsMermaModalOpen(false)} className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-400">Cancelar</button>
                <button type="submit" disabled={mermaSubmitting} className="px-6 py-2.5 rounded-full text-xs font-heading font-bold text-white bg-[#EF4444] hover:bg-[#dc2626]">
                  {mermaSubmitting ? 'Guardando...' : 'Registrar Merma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
