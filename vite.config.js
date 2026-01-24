import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  clearScreen: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['storybook-static'],
  },
  server: {
    port: 5175,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5175,
    },
    watch: {
      ignored: ['**/src-tauri/**', '**/storybook-static/**'],
      usePolling: false,
    },
  },
});
