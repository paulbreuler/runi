import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

/**
 * Main vitest configuration for unit tests.
 *
 * This config is used for running unit tests in jsdom environment.
 * For Storybook tests, use `npm run test-storybook` which uses
 * vitest.config.storybook.ts.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.vitest': 'undefined',
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  test: {
    name: 'unit',
    include: ['src/**/*.{test,spec}.{js,ts,tsx}', 'scripts/**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['**/node_modules/**', 'scripts/audit/**'],
    environment: 'jsdom', // Default to jsdom, scripts tests use @vitest-environment node comment
    globals: true,
    // setupFiles is applied to all tests, but vitest.setup.tsx checks for window
    // Scripts tests in node environment won't have window, so setup will be skipped
    setupFiles: ['./vitest.setup.tsx'],
    testTimeout: 10000, // 10 seconds for async tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
    pool: 'threads', // Use threads for better performance
    maxWorkers: 4, // Maximum number of worker threads
    isolate: true, // Isolate test environment between tests
    reporters: ['verbose', 'html'],
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
});
