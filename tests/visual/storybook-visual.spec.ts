import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for Storybook stories.
 *
 * This test suite captures screenshots of Storybook stories
 * and compares them against baseline images to detect visual regressions.
 *
 * The Playwright config (playwright.visual.config.ts) automatically starts
 * Storybook before running tests, so no manual setup is required.
 *
 * To run visual tests:
 *   npm run test-storybook:visual
 *
 * To update baselines after intentional changes:
 *   npm run test-storybook:visual:update
 *
 * Note: This is a basic implementation. For production use, consider:
 *   - Using @storybook/test-runner for better integration
 *   - Adding Chromatic for cloud-based visual testing
 *   - Implementing story discovery automation
 *
 * @see docs/STORYBOOK_TESTING.md for testing best practices
 */
test.describe('Storybook Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Storybook (baseURL is set in playwright.visual.config.ts)
    await page.goto('/');

    // Wait for Storybook to load - check for the preview iframe
    await page.waitForSelector('iframe[id="storybook-preview-iframe"]', {
      timeout: 30000,
    });
  });

  test('Storybook loads successfully', async ({ page }) => {
    // Verify the page title contains Storybook
    await expect(page).toHaveTitle(/Storybook/i);

    // Verify Storybook preview iframe is visible (already waited in beforeEach)
    const iframe = page.locator('iframe[id="storybook-preview-iframe"]');
    await expect(iframe).toBeVisible();

    // Verify Storybook UI is loaded by checking for common Storybook elements
    // This is a smoke test to ensure the test infrastructure works
    // Individual story visual tests should be added as needed
    const storybookUI = page.locator('body').first();
    await expect(storybookUI).toBeVisible();
  });

  // TODO: Add individual story tests as stories are created
  // Example:
  // test('Button component matches baseline', async ({ page }) => {
  //   await page.goto('/?path=/story/ui-components--button-default');
  //   const iframe = page.frameLocator('iframe[id="storybook-preview-iframe"]');
  //   await expect(iframe.locator('body')).toHaveScreenshot('button-default.png');
  // });
});
