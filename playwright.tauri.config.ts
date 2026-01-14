import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for testing the built Tauri application.
 *
 * ⚠️ WARNING: Full Tauri app testing on macOS is limited due to WKWebView driver
 * limitations. This configuration is provided for reference but may not work
 * reliably on macOS.
 *
 * For macOS-compatible testing, use `playwright.config.ts` which tests against
 * the dev server with mocked Tauri IPC.
 *
 * @see https://v2.tauri.app/develop/tests/
 * @see PROMPT.md for macOS-compatible testing strategy
 */
export default defineConfig({
  testDir: './tests/e2e/tauri',
  
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
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        /* For Tauri, you would typically use a custom launcher */
        /* This is a placeholder configuration */
      },
    },
  ],

  /* Build Tauri app before running tests */
  webServer: {
    command: 'npm run tauri build',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
    timeout: 300 * 1000, // 5 minutes for build
    stdout: 'ignore',
    stderr: 'pipe',
  },
  
  /* Note: This configuration is experimental and may require custom setup
   * for Tauri app testing. On macOS, WKWebView driver limitations may prevent
   * this from working. Use dev server testing (`playwright.config.ts`) instead.
   */
});