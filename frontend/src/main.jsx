import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Automatically route /api requests to external backend if VITE_API_URL is configured
const customApiBase = import.meta.env.VITE_API_URL;
if (customApiBase && typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  const cleanBase = customApiBase.replace(/\/$/, '');
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${cleanBase}${input}`;
    }
    return originalFetch(input, init);
  };
}

// Register PWA Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ [PWA Service Worker Registered]: Scope ->', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ [PWA Service Worker Registration Failed]:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

