import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 10000, // 10 seconds for async tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    pool: 'threads', // Use threads for better performance
    maxWorkers: 4, // Maximum number of worker threads (Vitest 4: replaced maxThreads/minThreads)
    isolate: true, // Isolate test environment between tests
    reporters: ['verbose', 'html'], // Better output + HTML report
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.stories.{ts,tsx}',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.d.ts',
        'src/main.tsx', // Entry point
        'src/routes/**', // Route files if not tested
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
      ],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
});
