/**
 * Global API Configuration & URL Utility
 * Targets the persistent Render backend with environment variable override support.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://aryabhatta-backend.onrender.com/api';

/**
 * Clean URL builder to avoid double /api slashes
 */
export const apiUrl = (endpoint = '') => {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (clean.startsWith('/api/')) {
    return `${base}${clean.substring(4)}`;
  }
  if (clean === '/api') {
    return base;
  }
  return `${base}${clean}`;
};

export default API_BASE_URL;
