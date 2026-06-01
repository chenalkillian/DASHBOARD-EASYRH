/** URL de base de l'API backend (sans slash final). */
export const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  'http://localhost:3000';

export const apiUrl = (path) => `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
