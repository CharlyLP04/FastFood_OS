// URL del backend. En producción apunta al servidor de Render.
// En local, Vite proxea /api → http://localhost:3000 (ver vite.config.js)
const API_URL = import.meta.env.DEV
  ? '/api'
  : 'https://api.tudominio.com/api';

export { API_URL };
