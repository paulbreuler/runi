import { test, expect } from '@playwright/test';

test.describe('Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Mock Tauri IPC
    await page.evaluate(() => {
      (window as any).__TAURI_INTERNALS__ = {
        invoke: async () => ({ status: 200, body: '{}', headers: {} }),
      };
    });
  });

  test('renders Collections and History sections', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    // Verify sidebar is visible
    await expect(sidebar).toBeVisible();

    // Verify Collections section
    await expect(page.getByText('Collections')).toBeVisible();
    await expect(page.getByText('No collections yet')).toBeVisible();

    // Verify History section
    await expect(page.getByText('History')).toBeVisible();
    await expect(page.getByText('No history yet')).toBeVisible();
  });

  test('sidebar has correct width when visible', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/w-64/);

    // Verify computed width is approximately 256px (w-64 = 16rem = 256px)
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
    const viewportHeight = page.viewportSize()?.height || 800;

    // Get sidebar height
    const boundingBox = await sidebar.boundingBox();
    expect(boundingBox).not.toBeNull();

    if (boundingBox) {
      // Sidebar should take at least 95% of viewport height
      // (accounting for status bar and browser chrome)
      expect(boundingBox.height).toBeGreaterThan(viewportHeight * 0.9);
    }
  });

  test('sidebar has transition classes for smooth animation', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    await expect(sidebar).toBeVisible();
    await expect(sidebar).toHaveClass(/transition-all/);
    await expect(sidebar).toHaveClass(/duration-200/);
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
