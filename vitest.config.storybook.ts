import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { playwright } from '@vitest/browser-playwright';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vitest configuration for Storybook browser tests.
 *
 * This config is used for running Storybook story tests in a real browser
 * environment using Playwright. Use `npm run test-storybook` to run these tests.
 */
export default defineConfig({
  plugins: [
    react(),
    storybookTest({
      configDir: path.join(__dirname, '.storybook'),
      storybookScript: 'npm run storybook -- --no-open',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      provider: playwright({}),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
    setupFiles: [path.resolve(__dirname, '.storybook/vitest.setup.ts')],
    testTimeout: 30000, // 30 seconds for browser tests
    hookTimeout: 30000,
    globals: true,
    passWithNoTests: true, // Storybook tests are optional
  },
});
