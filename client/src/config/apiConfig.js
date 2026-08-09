// URL del backend. En producción apunta al servidor de Render.
// En local, Vite proxea /api → http://localhost:3000 (ver vite.config.js)
const API_URL = import.meta.env.DEV
  ? '/api'
  : 'https://alaburger-os-2fyu.onrender.com/api';

export { API_URL };
