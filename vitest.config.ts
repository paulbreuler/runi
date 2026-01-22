import { defineConfig, defineProject } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
  test: {
    // Root-level defaults (applied to all projects unless overridden)
    globals: true,
    passWithNoTests: true,
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
    // Project configurations
    projects: [
      {
        name: 'unit',
        test: {
          include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
          environment: 'jsdom',
          setupFiles: ['./vitest.setup.ts'],
          testTimeout: 10000, // 10 seconds for async tests
          hookTimeout: 10000, // 10 seconds for setup/teardown
          pool: 'threads', // Use threads for better performance
          maxWorkers: 4, // Maximum number of worker threads (Vitest 4: replaced maxThreads/minThreads)
          isolate: true, // Isolate test environment between tests
          sequence: {
            groupOrder: 'unit',
          },
        },
      },
      defineProject({
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(__dirname, '.storybook'),
            storybookScript: 'npm run storybook -- --no-open',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright({}),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
          testTimeout: 30000, // 30 seconds for browser tests
          hookTimeout: 30000,
          sequence: {
            groupOrder: 'storybook',
          },
        },
      }),
    ],
  },
});
