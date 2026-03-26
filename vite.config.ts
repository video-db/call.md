import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/renderer/index.html'),
        widget: path.resolve(__dirname, 'src/renderer/widget.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
    },
  },
  server: {
    port: 51730,
    strictPort: false,  // Will find next available port if busy
    // Ensure all HTML files are accessible
    fs: {
      allow: ['..'],
    },
  },
  // Ensure widget.html is accessible in dev mode
  appType: 'mpa',
});
