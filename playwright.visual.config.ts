import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Storybook visual regression tests.
 *
 * This configuration:
 * - Tests files in tests/visual/
 * - Automatically starts Storybook server before tests
 * - Reuses existing Storybook server if already running (for local development)
 * - Uses http://localhost:6006 as base URL
 *
 * Usage:
 *   npm run test-storybook:visual
 *   npm run test-storybook:visual:update
 */
export default defineConfig({
  testDir: './tests/visual',

  /* Visual comparison settings */
  expect: {
    toHaveScreenshot: {
      threshold: 0.2, // Per-pixel color difference tolerance (0–1 scale)
      mode: 'strict', // Strict comparison mode
    },
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',

  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:6006',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run Storybook server before starting the tests */
  webServer: {
    command: 'npm run storybook -- --no-open',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI, // Reuse if Storybook is already running (local dev)
    timeout: 120 * 1000, // 2 minutes to start
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
