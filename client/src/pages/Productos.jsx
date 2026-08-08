import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon, ICONS } from '../components/ui/Icon';
import { getInitials, hasRole } from '../utils/auth';
import { useAuth } from '../hooks/useAuth';

import {
  getAllProductos,
  createProducto,
  updateProducto,
  deleteProducto,
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getReceta,
  updateReceta,
  getInventario
} from '../services/api';

export default function Productos() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  
  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  
  const [prodNombre, setProdNombre] = useState('');
  const [prodDescripcion, setProdDescripcion] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodCategoria, setProdCategoria] = useState('');
  const [prodDisponible, setProdDisponible] = useState(true);
  const [prodError, setProdError] = useState('');
  const [prodSubmitting, setProdSubmitting] = useState(false);

  // Recipe Modal State
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [activeRecipeProduct, setActiveRecipeProduct] = useState(null);
  const [recetaItems, setRecetaItems] = useState([]);
  const [inventario, setInventario] = useState([]);
  
  const [recipeError, setRecipeError] = useState('');
  const [recipeSubmitting, setRecipeSubmitting] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [catNombre, setCatNombre] = useState('');
  const [catError, setCatError] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, invRes] = await Promise.all([
        getAllProductos(),
        getCategorias(),
        getInventario(false)
      ]);
      const fetchedCats = catRes.data || [];
      setProductos(prodRes.data || []);
      setCategorias(fetchedCats);
      setInventario(invRes.data || []);

      if (fetchedCats.length > 0 && !prodCategoria) {
        setProdCategoria(fetchedCats[0].id);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // --- Product Management ---
  const openNewProductModal = () => {
    setIsEditingProduct(false);
    setEditingProductId(null);
    setProdNombre('');
    setProdDescripcion('');
    setProdPrecio('');
    setProdCategoria(categorias.length > 0 ? categorias[0].id : '');
    setProdDisponible(true);
    setProdError('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setIsEditingProduct(true);
    setEditingProductId(prod.id);
    setProdNombre(prod.nombre);
    setProdDescripcion(prod.descripcion || '');
    setProdPrecio(prod.precio.toString());
    setProdCategoria(prod.categoria_id);
    setProdDisponible(prod.disponible);
    setProdError('');
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProdError('');
    setProdSubmitting(true);

    try {
      const payload = {
        nombre: prodNombre.trim(),
        descripcion: prodDescripcion.trim() || undefined,
        precio: Number(prodPrecio),
        categoria_id: Number(prodCategoria),
        disponible: prodDisponible
      };

      if (isEditingProduct) {
        await updateProducto(editingProductId, payload);
        setSuccessMessage(`Producto "${prodNombre}" actualizado con éxito.`);
      } else {
        await createProducto(payload);
        setSuccessMessage(`Producto "${prodNombre}" creado con éxito.`);
      }

      setIsProductModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadInitialData();
    } catch (err) {
      console.error(err);
      setProdError(err.message || 'Error al guardar el producto.');
    } finally {
      setProdSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de desactivar o eliminar el producto "${nombre}"?`)) return;
    try {
      await deleteProducto(id);
      setSuccessMessage(`Producto "${nombre}" eliminado.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadInitialData();
    } catch (err) {
      setError(err.message || 'Error al eliminar el producto.');
    }
  };

  // --- Category Management ---
  const openNewCategoryModal = () => {
    setIsEditingCategory(false);
    setEditingCategoryId(null);
    setCatNombre('');
    setCatError('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat) => {
    setIsEditingCategory(true);
    setEditingCategoryId(cat.id);
    setCatNombre(cat.nombre);
    setCatError('');
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCatError('');
    setCatSubmitting(true);

    try {
      if (isEditingCategory) {
        await updateCategoria(editingCategoryId, { nombre: catNombre.trim() });
        setSuccessMessage('Categoría actualizada con éxito.');
      } else {
        await createCategoria({ nombre: catNombre.trim() });
        setSuccessMessage('Categoría creada con éxito.');
      }

      resetCategoryForm();
      setIsCategoryModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadInitialData();
    } catch (err) {
      setCatError(err.message || 'Error al guardar la categoría.');
    } finally {
      setCatSubmitting(false);
    }
  };

  const resetCategoryForm = () => {
    setIsEditingCategory(false);
    setEditingCategoryId(null);
    setCatNombre('');
    setCatError('');
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('¿Seguro de eliminar esta categoría? Pudo afectar a productos vinculados.')) return;
    try {
      await deleteCategoria(id);
      setSuccessMessage('Categoría eliminada.');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadInitialData();
    } catch (err) {
      setError(err.message || 'Error al eliminar la categoría.');
    }
  };

  // --- Recipe Management ---
  const openRecipeModal = async (prod) => {
    setActiveRecipeProduct(prod);
    setRecipeError('');
    setIsRecipeModalOpen(true);
    try {
      const res = await getReceta(prod.id);
      setRecetaItems(res.data || []);
    } catch (err) {
      setRecipeError(err.message || 'Error al cargar la receta.');
    }
  };

  const addRecipeItem = () => {
    if (inventario.length === 0) return;
    setRecetaItems(prev => [
      ...prev,
      {
        ingrediente_id: inventario[0].ingrediente_id,
        cantidad: 1,
        unidad: inventario[0].unidad
      }
    ]);
  };

  const updateRecipeItem = (index, field, value) => {
    setRecetaItems(prev => {
      const next = [...prev];
      if (field === 'ingrediente_id') {
        const valNum = Number(value);
        const invMatch = inventario.find(i => i.ingrediente_id === valNum);
        next[index] = {
          ...next[index],
          ingrediente_id: valNum,
          unidad: invMatch ? invMatch.unidad : next[index].unidad
        };
      } else {
        next[index] = {
          ...next[index],
          [field]: value
        };
      }
      return next;
    });
  };

  const removeRecipeItem = (index) => {
    setRecetaItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleRecipeSubmit = async (e) => {
    e.preventDefault();
    setRecipeError('');
    setRecipeSubmitting(true);

    try {
      const ingredientesPayload = recetaItems.map(item => ({
        ingrediente_id: Number(item.ingrediente_id),
        cantidad: Number(item.cantidad)
      }));

      await updateReceta(activeRecipeProduct.id, { ingredientes: ingredientesPayload });
      setSuccessMessage(`Receta de "${activeRecipeProduct.nombre}" actualizada.`);
      setIsRecipeModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setRecipeError(err.message || 'Error al guardar la receta.');
    } finally {
      setRecipeSubmitting(false);
    }
  };

  return (
    <>
      <main className="flex-1 bg-[#0A0A0B] text-white font-body animate-fade-in">
        <div className="max-w-7xl mx-auto pb-20">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-[#242428] pb-6">
            <div>
              <h1 className="text-3xl font-heading font-black text-white tracking-tight flex items-center gap-3">
                <Icon path={ICONS.box} size={30} className="text-[#E85D2F]" />
                Catálogo de Productos
              </h1>
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                Gestiona platillos, precios, categorías y recetas de producción.
              </p>
            </div>

            {hasRole(usuario, ['administrador']) && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openNewCategoryModal}
                  className="bg-[#141416] hover:bg-[#1C1C20] border border-[#242428] text-white font-heading font-bold text-xs px-4 py-3 rounded-full transition-all uppercase tracking-wider active:scale-95 cursor-pointer shadow-sm"
                >
                  Categorías
                </button>
                <button
                  type="button"
                  onClick={openNewProductModal}
                  className="bg-[#E85D2F] hover:bg-[#d64e21] text-white font-heading font-bold text-xs px-5 py-3 rounded-full transition-all uppercase tracking-wider active:scale-95 cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Icon path={ICONS.plus} size={18} /> Nuevo Producto
                </button>
              </div>
            )}
          </div>

          {/* Banners Success/Error */}
          {successMessage && (
            <div className="mb-6 bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] p-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 animate-fade-in">
              <Icon path={ICONS.check} size={18} /> {successMessage}
            </div>
          )}
          {error && (
            <div className="mb-6 bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] p-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-3 animate-fade-in">
              <Icon path={ICONS.trash} size={18} /> {error}
            </div>
          )}

          {/* Table Products */}
          {loading ? (
            <div className="p-12 text-center text-zinc-400 text-xs font-bold flex items-center justify-center gap-2">
              <Icon path={ICONS.refresh} size={20} className="animate-spin text-[#E85D2F]" /> Cargando menú...
            </div>
          ) : (
            <div className="bg-[#141416] border border-[#242428] rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1C1C20] text-zinc-400 text-xs font-bold uppercase tracking-wider border-b border-[#242428]">
                      <th className="px-6 py-4 rounded-tl-xl">Producto</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4">Precio</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right rounded-tr-xl">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242428] text-sm font-medium">
                    {productos.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-sm">{p.nombre}</p>
                          {p.descripcion && (
                            <p className="text-xs text-zinc-400 line-clamp-1">{p.descripcion}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold px-3 py-1 bg-[#1C1C20] text-zinc-300 border border-[#2D2D35] rounded-full uppercase tracking-wider">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-[#E85D2F] text-base">
                          ${p.precio.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                            p.disponible ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' : 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30'
                          }`}>
                            {p.disponible ? 'Disponible' : 'No disponible'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openRecipeModal(p)}
                              className="p-2 text-zinc-400 hover:text-white bg-[#1C1C20] hover:bg-white/10 rounded-lg transition-colors cursor-pointer active:scale-95"
                              title="Configurar Receta"
                            >
                              <Icon path={ICONS.clipboardList} size={16} />
                            </button>
                            {hasRole(usuario, ['administrador']) && (
                              <>
                                <button
                                  onClick={() => openEditProductModal(p)}
                                  className="p-2 text-zinc-400 hover:text-white bg-[#1C1C20] hover:bg-white/10 rounded-lg transition-colors cursor-pointer active:scale-95"
                                  title="Editar Producto"
                                >
                                  <Icon path={ICONS.edit} size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id, p.nombre)}
                                  className="p-2 text-[#EF4444] hover:bg-[#EF4444]/20 bg-[#1C1C20] rounded-lg transition-colors cursor-pointer active:scale-95"
                                  title="Eliminar Producto"
                                >
                                  <Icon path={ICONS.trash} size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* PRODUCT MODAL ULTRA-PREMIUM REDESIGN */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsProductModalOpen(false)} />
          
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
                    {isEditingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-medium">Configura los datos clave del menú</p>
                </div>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body Form */}
            <form id="productForm" onSubmit={handleProductSubmit} className="p-6 space-y-5">
              {prodError && (
                <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl p-3.5 text-xs font-bold text-[#EF4444] uppercase tracking-wide flex items-center gap-2">
                  <Icon path={ICONS.trash} size={16} /> {prodError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  value={prodNombre}
                  onChange={(e) => setProdNombre(e.target.value)}
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-2 focus:ring-[#E85D2F]/20 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all font-medium"
                  placeholder="Ej. Hamburguesa Doble Queso"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Descripción
                </label>
                <textarea
                  value={prodDescripcion}
                  onChange={(e) => setProdDescripcion(e.target.value)}
                  className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-2 focus:ring-[#E85D2F]/20 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all font-medium custom-scrollbar"
                  placeholder="Descripción breve..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={prodPrecio}
                    onChange={(e) => setProdPrecio(e.target.value)}
                    className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-2 focus:ring-[#E85D2F]/20 rounded-xl px-4 py-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-all font-medium"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Categoría
                  </label>
                  <select
                    value={prodCategoria}
                    onChange={(e) => setProdCategoria(e.target.value)}
                    className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] focus:ring-2 focus:ring-[#E85D2F]/20 rounded-xl px-4 py-3.5 text-sm text-white outline-none transition-all font-medium cursor-pointer capitalize"
                    required
                  >
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Toggle Switch */}
              <label className="flex items-center justify-between p-4 bg-[#1C1C20] border border-[#2D2D35] rounded-xl cursor-pointer hover:border-zinc-700 transition-all mt-2">
                <div>
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Producto Disponible (Visible)
                  </span>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    Habilitado para comandas en tiempo real
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={prodDisponible}
                  onChange={(e) => setProdDisponible(e.target.checked)}
                  className="w-5 h-5 accent-[#E85D2F] rounded cursor-pointer"
                />
              </label>
            </form>

            {/* Footer Modal */}
            <div className="p-6 border-t border-[#242428] flex justify-end gap-3 bg-[#1C1C20]/80">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="productForm"
                disabled={prodSubmitting}
                className="px-6 py-2.5 rounded-full text-xs font-heading font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#E85D2F] to-[#d64e21] hover:from-[#f0683a] hover:to-[#e85d2f] shadow-[0_4px_20px_rgba(232,93,47,0.4)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {prodSubmitting ? 'Guardando...' : 'Guardar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="relative w-full max-w-md bg-[#141416] border border-[#242428] rounded-xl shadow-2xl overflow-hidden animate-pop-in">
            <div className="p-6 border-b border-[#242428] flex items-center justify-between bg-[#1C1C20]">
              <h2 className="text-xl font-heading font-black text-white uppercase tracking-wider">
                Categorías
              </h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-zinc-400 hover:text-white p-2">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <form id="categoryForm" onSubmit={handleCategorySubmit} className="space-y-3">
                {catError && (
                  <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 rounded-xl p-3 text-xs font-bold text-[#EF4444]">
                    {catError}
                  </div>
                )}
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    {isEditingCategory ? 'Editar Nombre' : 'Nueva Categoría'}
                  </label>
                  <input
                    type="text"
                    value={catNombre}
                    onChange={(e) => setCatNombre(e.target.value)}
                    className="w-full bg-[#1C1C20] border border-[#2D2D35] focus:border-[#E85D2F] rounded-xl px-4 py-3 text-sm text-white outline-none font-medium"
                    placeholder="Ej. Bebidas, Hamburguesas"
                    required
                  />
                </div>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pt-2">
                {categorias.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3 bg-[#1C1C20] border border-[#2D2D35] rounded-xl text-xs font-bold text-white">
                    <span className="capitalize">{cat.nombre}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openEditCategoryModal(cat)} className="p-1 text-zinc-400 hover:text-white"><Icon path={ICONS.edit} size={14} /></button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-[#EF4444] hover:text-white"><Icon path={ICONS.trash} size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-[#242428] flex justify-end gap-3 bg-[#1C1C20]">
              <button onClick={() => setIsCategoryModalOpen(false)} className="px-5 py-2.5 rounded-full text-xs font-bold text-zinc-400 hover:text-white">Cerrar</button>
              <button type="submit" form="categoryForm" disabled={catSubmitting} className="px-6 py-2.5 rounded-full text-xs font-heading font-bold text-white bg-[#E85D2F] hover:bg-[#d64e21]">
                {catSubmitting ? 'Guardando...' : (isEditingCategory ? 'Actualizar' : 'Agregar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
