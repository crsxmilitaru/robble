import { defineConfig } from 'vite';

export default defineConfig({
  base: '/robble/',
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
  },
});
