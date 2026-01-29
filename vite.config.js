import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

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
    entries: ['src/**/*.{ts,tsx}'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Tauri in its own chunk; all other node_modules in one vendor chunk
          // to avoid circular refs (vendor <-> react-vendor etc.)
          if (id.includes('@tauri-apps')) {
            return 'tauri-vendor';
          }
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1350,
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
