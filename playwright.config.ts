import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests against Vite dev server.
 *
 * This configuration tests the app running in dev mode with mocked Tauri IPC.
 * For macOS compatibility, we test against the dev server rather than the built
 * Tauri app (WKWebView driver limitations).
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Skip Storybook tests in CI - they require Storybook server on port 6006 */
  testIgnore: process.env.CI ? ['**/*.storybook.spec.ts'] : undefined,

  /* Visual comparison settings */
  expect: {
    toHaveScreenshot: {
      threshold: 0.2, // 20% pixel difference threshold
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

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5175',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Use data-test-id attribute for getByTestId (matches CLAUDE.md standard) */
    testIdAttribute: 'data-test-id',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
