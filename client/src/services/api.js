/**
 * api.js — Cliente HTTP central para A La Burger OS (HU-5)
 *
 * CAMBIOS HU-5:
 *  - credentials: 'include' en TODOS los requests (las cookies httpOnly viajan así)
 *  - Eliminado el header Authorization manual (el JWT ahora va en cookie)
 *  - Refresh automático: si recibe 401 con cookie presente, intenta
 *    POST /api/auth/refresh y reintenta el request original una vez.
 *  - Si el refresh también falla, llama handleSessionExpired y redirige a login.
 */

import { handleSessionExpired } from '../utils/auth';
import { refreshToken } from './authService';

const rawApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');
const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

// ─────────────────────────────────────────────────────────────────────────────
// Guard anti-refresh-loop: evita que múltiples requests en vuelo simultáneos
// disparen varios refresh en paralelo cuando el access_token expira.
// ─────────────────────────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = []; // callbacks que esperan el resultado del refresh

function subscribeToRefresh(cb) {
  refreshSubscribers.push(cb);
}

function resolveRefreshSubscribers(success) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * apiFetch — wrapper central para todos los requests al backend.
 *
 * @param {string} path     - Ruta relativa, e.g. '/productos'
 * @param {object} options  - Opciones de fetch (method, body, headers adicionales)
 * @param {boolean} _isRetry - Interno: evita bucle de refresh infinito
 */
async function apiFetch(path, options = {}, _isRetry = false) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // HU-5: cookies httpOnly viajan en todos los requests
  });

  const data = await response.json().catch(() => ({}));

  // ── Manejo de 401 con refresh automático ───────────────────────────────────
  if (response.status === 401 && !_isRetry) {
    // Si ya hay un refresh en curso, esperar su resultado en vez de disparar otro
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeToRefresh((success) => {
          if (success) {
            resolve(apiFetch(path, options, true));
          } else {
            reject(new Error('Sesión expirada'));
          }
        });
      });
    }

    isRefreshing = true;

    try {
      await refreshToken(); // POST /api/auth/refresh — emite nueva cookie access_token
      isRefreshing = false;
      resolveRefreshSubscribers(true);
      // Reintentar el request original con la nueva cookie
      return apiFetch(path, options, true);
    } catch {
      isRefreshing = false;
      resolveRefreshSubscribers(false);
      // El refresh también falló → sesión expirada definitivamente
      handleSessionExpired('Tu sesión ha expirado. Inicia sesión nuevamente.');
      const error = new Error('Sesión expirada');
      error.status = 401;
      throw error;
    }
  }

  if (!response.ok) {
    const error = new Error(data.mensaje || data.error || 'Error en la solicitud');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints exportados
// ─────────────────────────────────────────────────────────────────────────────

export function login(username, password) {
  // Login no usa apiFetch porque maneja su propio flujo de errores
  // y no necesita el refresh automático (aún no hay sesión)
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getProductos() {
  return apiFetch('/productos');
}

export function getAllProductos() {
  return apiFetch('/productos/all');
}

export function createProducto(payload) {
  return apiFetch('/productos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProducto(id, payload) {
  return apiFetch(`/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteProducto(id) {
  return apiFetch(`/productos/${id}`, {
    method: 'DELETE',
  });
}

export function getCategorias() {
  return apiFetch('/productos/categorias');
}

export function createCategoria(payload) {
  return apiFetch('/productos/categorias', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateCategoria(id, payload) {
  return apiFetch(`/productos/categorias/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function deleteCategoria(id) {
  return apiFetch(`/productos/categorias/${id}`, {
    method: 'DELETE',
  });
}

export function getReceta(id) {
  return apiFetch(`/productos/${id}/receta`);
}

export function updateReceta(id, ingredientes) {
  return apiFetch(`/productos/${id}/receta`, {
    method: 'PUT',
    body: JSON.stringify({ ingredientes }),
  });
}

export async function getProductosList({ page = 1, limit = 20, categoria_id, activo } = {}) {
  const params = new URLSearchParams();
  const filtroPorNombre = categoria_id !== undefined
    && categoria_id !== null
    && categoria_id !== ''
    && Number.isNaN(Number(categoria_id));

  if (filtroPorNombre) {
    params.set('page', '1');
    params.set('limit', '10000');
  } else {
    params.set('page', String(page));
    params.set('limit', String(limit));

    if (categoria_id !== undefined && categoria_id !== null && categoria_id !== '') {
      params.set('categoria_id', String(categoria_id));
    }
  }

  if (activo === true || activo === 'true') {
    params.set('activo', 'true');
  } else if (activo === false || activo === 'false') {
    params.set('activo', 'false');
  }

  const resultado = await apiFetch(`/productos?${params.toString()}`);

  if (!filtroPorNombre) {
    return resultado;
  }

  const filtrados = (resultado.data ?? []).filter(
    (producto) => producto.categoria === categoria_id
  );
  const total = filtrados.length;
  const offset = (page - 1) * limit;

  return {
    data: filtrados.slice(offset, offset + limit),
    total,
    page,
    totalPages: total === 0 ? 1 : Math.ceil(total / limit),
  };
}

export async function getCategoriasProducto() {
  const resultado = await getProductosList({ page: 1, limit: 10000 });
  const categoriasMap = new Map();

  for (const producto of resultado.data ?? []) {
    if (
      producto.categoria_id == null ||
      !producto.categoria ||
      categoriasMap.has(producto.categoria_id)
    ) {
      continue;
    }

    categoriasMap.set(producto.categoria_id, {
      id: producto.categoria_id,
      nombre: producto.categoria,
    });
  }

  return Array.from(categoriasMap.values()).sort((a, b) =>
    a.nombre.localeCompare(b.nombre, 'es')
  );
}

// ── Pedidos ──────────────────────────────────────────────────────────────────
export function crearPedido(payload) {
  return apiFetch('/pedidos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getPedidos() {
  return apiFetch('/pedidos');
}

export function updatePedidoStatus(id, estado) {
  return apiFetch(`/pedidos/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}

// ── Inventario ───────────────────────────────────────────────────────────────
export function getInventario(stockBajo = false) {
  const query = stockBajo ? '?stock_bajo=true' : '';
  return apiFetch(`/inventario${query}`);
}

export function crearIngrediente(payload) {
  return apiFetch('/inventario', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function editarIngrediente(id, payload) {
  return apiFetch(`/inventario/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function registrarEntrada(id, payload) {
  return apiFetch(`/inventario/${id}/entrada`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getAlertasStockBajo() {
  return apiFetch('/inventario/alertas/resumen');
}

export function getMovimientos(id, tipo = '', fechaDesde = '', fechaHasta = '') {
  const params = new URLSearchParams();
  if (tipo) params.append('tipo', tipo);
  if (fechaDesde) params.append('fecha_desde', fechaDesde);
  if (fechaHasta) params.append('fecha_hasta', fechaHasta);

  const query = params.toString();
  return apiFetch(`/inventario/${id}/movimientos${query ? '?' + query : ''}`);
}

export function registrarMerma(id, payload) {
  return apiFetch(`/inventario/${id}/merma`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTodosLosMovimientos(tipo = '', fechaDesde = '', fechaHasta = '') {
  const params = new URLSearchParams();
  if (tipo) params.append('tipo', tipo);
  if (fechaDesde) params.append('fecha_desde', fechaDesde);
  if (fechaHasta) params.append('fecha_hasta', fechaHasta);

  const query = params.toString();
  return apiFetch(`/inventario/movimientos${query ? '?' + query : ''}`);
}

// ── Usuarios ──────────────────────────────────────────────────────────────────
export function getUsuarios() {
  return apiFetch('/usuarios');
}

export function getRoles() {
  return apiFetch('/usuarios/roles');
}

export function createUsuario(payload) {
  return apiFetch('/usuarios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUsuario(id, payload) {
  return apiFetch(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function toggleUsuarioStatus(id) {
  return apiFetch(`/usuarios/${id}/status`, {
    method: 'PATCH',
  });
}

// ── Configuración ─────────────────────────────────────────────────────────────
export function getConfiguraciones() {
  return apiFetch('/configuracion');
}

export function updateConfiguraciones(payload) {
  return apiFetch('/configuracion', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ── Búsqueda ─────────────────────────────────────────────────────────────────
export function globalSearch(query) {
  const params = new URLSearchParams({ q: query });
  return apiFetch(`/search?${params.toString()}`);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function getDashboardMetrics(period = 'hoy') {
  return apiFetch(`/dashboard/metrics?period=${encodeURIComponent(period)}`);
}
