import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['simple-peer'],
  },
  server: {
    port: 3000,
    proxy: {
      '/socket.io': 'http://localhost:5000',
    },
  },
  define: {
    global: 'window',
  },
});
