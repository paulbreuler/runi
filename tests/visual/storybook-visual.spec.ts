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

  test('RequestBuilder body panel fills height', async ({ page }) => {
    await page.goto('/?path=/story/request-requestbuilder--playground');
    const iframe = page.frameLocator('iframe[id="storybook-preview-iframe"]');
    // Wait for the story to mount before querying tabs (CI can be slow)
    await iframe.locator('[data-test-id="request-builder"]').waitFor({
      state: 'visible',
      timeout: 25000,
    });
    const bodyTab = iframe.locator('[data-test-id="request-tab-body"]');
    await bodyTab.waitFor({ state: 'visible', timeout: 10000 });
    await bodyTab.click();
    const cmContainer = iframe.locator('[data-test-id="code-editor-cm-container"]');
    await expect(cmContainer).toBeVisible();
    // CM6 editor is mounted — body panel is visible
    await expect(iframe.locator('body')).toHaveScreenshot('request-builder-body-panel.png');
  });

  test('ResponseViewer raw panel layout', async ({ page }) => {
    await page.goto('/?path=/story/response-responseviewer--playground');
    const iframe = page.frameLocator('iframe[id="storybook-preview-iframe"]');
    // Wait for the story to mount before querying tabs
    await iframe.locator('[data-test-id="response-viewer"]').waitFor({
      state: 'visible',
      timeout: 15000,
    });
    const rawTab = iframe.locator('[data-test-id="response-tab-raw"]');
    await rawTab.waitFor({ state: 'visible', timeout: 10000 });
    await rawTab.click();
    await expect(iframe.locator('[data-test-id="response-raw"]')).toBeVisible();
    await expect(iframe.locator('body')).toHaveScreenshot('response-viewer-raw-panel.png');
  });

  test('CodeEditor search highlight', async ({ page }) => {
    await page.goto('/?path=/story/codehighlighting-codeeditor--edit-playground');
    const iframe = page.frameLocator('iframe[id="storybook-preview-iframe"]');
    await iframe.locator('[data-test-id="code-editor"]').waitFor({
      state: 'visible',
      timeout: 15000,
    });
    // CM6 search is opened via Mod+F (Meta on macOS, Control on Linux/Windows)
    const cmContent = iframe.locator('.cm-content');
    await cmContent.click();
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await cmContent.press(`${modifier}+f`);
    // CM6 renders its own search panel with .cm-search class
    const searchInput = iframe.locator('.cm-search input').first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill('test');
    await expect(iframe.locator('body')).toHaveScreenshot('code-editor-search-highlight.png');
  });

  // FIXME: Skipped due to CI flakiness - sidebar timing issues
  // This test is quarantined until we can make it deterministic by waiting for
  // a stable "ready" signal before taking the screenshot (e.g., wait for sidebar
  // animations to complete, or use a test-specific flag to disable animations).
  // Tracking: Consider adding a data-test-ready attribute when layout is stable.
  test.skip('MainLayout full composition', async ({ page }) => {
    await page.goto('/?path=/story/layout-mainlayout--playground');
    const iframe = page.frameLocator('iframe[id="storybook-preview-iframe"]');

    // Wait for core layout elements to be visible
    const mainLayout = iframe.locator('[data-test-id="main-layout"]');
    await mainLayout.waitFor({
      state: 'visible',
      timeout: 30000,
    });

    // Ensure sidebar is present and visible (wait for spring animation if any)
    const sidebar = iframe.locator('[data-test-id="sidebar"]');
    await sidebar.waitFor({ state: 'visible', timeout: 15000 });

    // Ensure multiple tabs are visible (registered via story decorator)
    await expect(iframe.locator('[data-test-id="context-tabs-list"]')).toBeVisible();
    await expect(iframe.locator('[data-test-id^="context-tab-"]').first()).toBeVisible();

    // Ensure content area is present
    await expect(iframe.locator('[data-test-id="content-area"]')).toBeVisible();

    // Take screenshot of the entire layout
    await expect(iframe.locator('body')).toHaveScreenshot('main-layout-composition.png', {
      mask: [iframe.locator('[data-test-id="status-bar"]')], // Mask dynamic status bar content
      animations: 'disabled', // Use Playwright's animation disabling
    });
  });
});
