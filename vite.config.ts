import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Cấu hình Vite cho mockup SWP391 (React + TypeScript + Tailwind CSS)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  },
  server: {
    port: 3000
  },
  build: {
    chunkSizeWarningLimit: 2000
  }
});
