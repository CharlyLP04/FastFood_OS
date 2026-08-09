// api.js — usa VITE_API_URL si está definida (producción Render), sino /api (local con proxy Vite)
const rawApiUrl = import.meta.env.VITE_API_URL || '/api';
const API_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

export const BACKEND_URL = API_URL;
