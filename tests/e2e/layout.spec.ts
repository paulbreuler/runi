import { test, expect } from '@playwright/test';

test.describe('MainLayout', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('runi-panel-state');
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
        invoke: (cmd: string): Promise<unknown> => {
          if (cmd === 'load_request_history') {
            return Promise.resolve([]);
          }
          if (cmd === 'get_platform') {
            return Promise.resolve('linux');
          }
          if (cmd === 'cmd_list_collections') {
            return Promise.resolve([]);
          }
          return Promise.resolve({ status: 200, body: '{}', headers: {} });
        },
      };
      delete (window as unknown as Record<string, unknown>).__TAURI__;
    });

    await page.goto('/');
  });

  test('renders all layout components', async ({ page }) => {
    // Verify main layout is present
    await expect(page.getByTestId('main-layout')).toBeVisible();

    // Sidebar is visible by default
    await expect(page.getByTestId('sidebar')).toBeVisible();

    // Verify canvas host is visible (request/response panes removed - now using layout-based rendering)
    await expect(page.getByTestId('canvas-host')).toBeVisible();

    // Verify status bar is visible
    await expect(page.getByTestId('status-bar')).toBeVisible();
  });

  test('keyboard shortcut toggles sidebar (Mac)', async ({ page }) => {
    // Mock Mac platform
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgentData', {
        get: () => ({ platform: 'macOS' }),
        configurable: true,
      });
      Object.defineProperty(navigator, 'userAgent', {
        get: () => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        configurable: true,
      });
    });

    await page.goto('/');

    // Wait for main layout to be ready
    await expect(page.getByTestId('main-layout')).toBeVisible();

    // Verify sidebar is visible by default
    await expect(page.getByTestId('sidebar')).toBeVisible();

    // Focus the page to ensure keyboard events are received
    await page.focus('body');
    await page.waitForTimeout(100);

    // Press ⌘B (Meta+B on Mac) to close sidebar
    await page.keyboard.press('Meta+b');

    // Sidebar should now be hidden
    await expect(page.getByTestId('sidebar')).not.toBeVisible({ timeout: 2000 });

    // Press ⌘B again to open
    await page.keyboard.press('Meta+b');

    // Sidebar should be visible again
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 2000 });
  });

  test('keyboard shortcut toggles sidebar (Windows/Linux)', async ({ page }) => {
    // Mock Windows platform
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgentData', {
        get: () => ({ platform: 'Windows' }),
        configurable: true,
      });
      Object.defineProperty(navigator, 'userAgent', {
        get: () => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        configurable: true,
      });
    });

    await page.goto('/');

    // Wait for main layout to be ready
    await expect(page.getByTestId('main-layout')).toBeVisible();

    // Verify sidebar is visible by default
    await expect(page.getByTestId('sidebar')).toBeVisible();

    // Focus the page to ensure keyboard events are received
    await page.focus('body');
    await page.waitForTimeout(100);

    // Press Ctrl+B on Windows/Linux to close sidebar
    await page.keyboard.press('Control+b');

    // Sidebar should now be hidden
    await expect(page.getByTestId('sidebar')).not.toBeVisible({ timeout: 2000 });

    // Press Ctrl+B again to open
    await page.keyboard.press('Control+b');

    // Sidebar should be visible again
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 2000 });
  });

  // Pane resizer test removed - the UI no longer has a pane resizer.
  // The layout now uses layouts that adapt based on the selected layout option.
});
