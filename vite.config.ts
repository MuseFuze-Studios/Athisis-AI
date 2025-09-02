import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // Set base public path to relative
  plugins: [react()],
  server: {
    host: true,
    port: 3000, // Set the primary port to 3000
    proxy: {
      '/python-api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/python-api/, ''),
      },
    },
  },
  optimizeDeps: {
    // Removed 'lucide-react' from exclude to allow pre-bundling
  },
});
