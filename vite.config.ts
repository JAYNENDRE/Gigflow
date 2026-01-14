import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const base = process.env.VITE_BASE || '/';

// https://vitejs.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
  },
});
