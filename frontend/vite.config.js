import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// vite.config.js — Vite build configuration.
//
// The `proxy` block forwards any request starting with /api from the
// frontend dev server to the backend on port 3001.
// This means you can call fetch('/api/health') in React without worrying
// about CORS during local development.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
