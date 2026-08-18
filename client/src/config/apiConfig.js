// URL del backend. 
// En producción (Vercel) las peticiones van al mismo dominio bajo /api y Serverless Functions las maneja.
// En local, Vite proxea /api → http://localhost:3000 (ver vite.config.js)
const API_URL = '/api';

export { API_URL };
