import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Vite 5.4.12+ blocks unknown Host headers (DNS rebinding fix).
    // In preview mode the proxy sends a sandbox-specific Host, so allow all.
    ...(process.env.BASE44_PREVIEW_MODE === '1' ? { allowedHosts: true } : {}),
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
