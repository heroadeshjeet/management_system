/**
 * Global API Configuration
 * Targets the persistent Render backend with environment variable override support.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://aryabhatta-backend.onrender.com/api';

export default API_BASE_URL;
