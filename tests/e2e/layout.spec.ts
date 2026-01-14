import { test, expect } from '@playwright/test';

test.describe('MainLayout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Mock Tauri IPC for these tests
    await page.evaluate(() => {
      // Simple mock setup - intercept any Tauri invokes
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
        invoke: async () => ({ status: 200, body: '{}', headers: {} }),
      };
    });
  });

  test('renders all layout components', async ({ page }) => {
    // Verify main layout is present
    await expect(page.getByTestId('main-layout')).toBeVisible();

    // Verify sidebar is visible by default
    await expect(page.getByTestId('sidebar')).toBeVisible();

    // Verify request and response panes are visible
    await expect(page.getByTestId('request-pane')).toBeVisible();
    await expect(page.getByTestId('response-pane')).toBeVisible();

    // Verify status bar is visible
    await expect(page.getByTestId('status-bar')).toBeVisible();
  });

  test('keyboard shortcut toggles sidebar (Mac)', async ({ page }) => {
    // Mock Mac platform
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'platform', {
        get: () => 'MacIntel',
      });
    });

    await page.goto('/');

    // Verify sidebar is visible initially
    await expect(page.getByTestId('sidebar')).toBeVisible();

    // Press ⌘B (Meta+B on Mac)
    await page.keyboard.press('Meta+b');

    // Sidebar should be hidden
    await expect(page.getByTestId('sidebar')).not.toBeVisible();

    // Press ⌘B again
    await page.keyboard.press('Meta+b');

    // Sidebar should be visible again
    await expect(page.getByTestId('sidebar')).toBeVisible();
  });

  test('keyboard shortcut toggles sidebar (Windows/Linux)', async ({ page }) => {
    // Mock Windows platform
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32',
      });
    });

    await page.goto('/');

    // Verify sidebar is visible initially
    await expect(page.getByTestId('sidebar')).toBeVisible();

    // Press Ctrl+B on Windows/Linux
    await page.keyboard.press('Control+b');

    // Sidebar should be hidden
    await expect(page.getByTestId('sidebar')).not.toBeVisible();
  });

  test('pane resizer is visible and interactive', async ({ page }) => {
    const resizer = page.getByTestId('pane-resizer');

    // Verify resizer is visible
    await expect(resizer).toBeVisible();

    // Verify resizer has correct cursor style
    await expect(resizer).toHaveCSS('cursor', 'col-resize');

    // Get initial positions
    const requestPane = page.getByTestId('request-pane');
    const responsePane = page.getByTestId('response-pane');

    const requestRect = await requestPane.boundingBox();
    const responseRect = await responsePane.boundingBox();

    expect(requestRect).not.toBeNull();
    expect(responseRect).not.toBeNull();

    // Verify panes are roughly equal width initially (50/50 split)
    if (requestRect && responseRect) {
      const totalWidth = requestRect.width + responseRect.width;
      const requestPercentage = (requestRect.width / totalWidth) * 100;

      // Should be approximately 50% (allow 5% tolerance)
      expect(requestPercentage).toBeGreaterThan(45);
      expect(requestPercentage).toBeLessThan(55);
    }
  });
});
