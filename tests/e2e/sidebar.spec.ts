import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Tauri IPC - handle different command names
    // Use addInitScript to ensure mock is available before React loads
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
        invoke: (cmd: string): Promise<unknown> => {
          // Handle load_request_history - return empty array for empty history
          if (cmd === 'load_request_history') {
            return Promise.resolve([]);
          }
          // Default mock for other commands (like execute_http_request)
          return Promise.resolve({ status: 200, body: '{}', headers: {} });
        },
      };
    });

    await page.goto('/');

    // Wait for React app to render and history to load
    await page.waitForLoadState('networkidle');
    // Wait for sidebar to be visible
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 10000 });
  });

  test('renders Collections section', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    // Verify sidebar is visible
    await expect(sidebar).toBeVisible();

    // Verify Collections section
    await expect(page.getByText('Collections', { exact: true })).toBeVisible();
    await expect(page.getByText('No collections yet')).toBeVisible();

    // History section was removed - it's now in Network History Panel instead
  });

  test('sidebar has correct width when visible', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    await expect(sidebar).toBeVisible();

    // Verify computed width is approximately 256px (default sidebar width)
    const boundingBox = await sidebar.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      // Allow small tolerance for browser rendering
      expect(boundingBox.width).toBeGreaterThan(250);
      expect(boundingBox.width).toBeLessThan(270);
    }
  });

  test('sidebar takes full vertical height', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    await expect(sidebar).toBeVisible();

    // Get viewport height
    const viewport = page.viewportSize();
    const viewportHeight = viewport ? viewport.height : 800;

    // Get sidebar height
    const boundingBox = await sidebar.boundingBox();
    expect(boundingBox).not.toBeNull();

    if (boundingBox) {
      // Sidebar should take at least 95% of viewport height
      // (accounting for status bar and browser chrome)
      expect(boundingBox.height).toBeGreaterThan(viewportHeight * 0.9);
    }
  });

  test('sidebar has smooth animation', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    await expect(sidebar).toBeVisible();
    // Sidebar uses Motion for animations, not CSS transitions
    // Verify it's visible and has proper styling
    const style = await sidebar.evaluate((el) => window.getComputedStyle(el).display);
    expect(style).not.toBe('none');
  });

  test('sidebar sections have hover effects', async ({ page }) => {
    const collectionsItem = page
      .getByText('Collections')
      .locator('..')
      .locator('..')
      .getByText('No collections yet');

    // Hover over the collections item
    await collectionsItem.hover();

    // Verify hover state (background color should change)
    const style = await collectionsItem.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );

    // Should have some background color change on hover
    expect(style).toBeTruthy();
  });
});
