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

    // Sidebar is collapsed by default, so open it first
    const isMac = await page.evaluate(() => {
      return (
        navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
        (navigator.userAgentData as { platform?: string } | undefined)?.platform === 'macOS'
      );
    });
    await page.focus('body');
    await page.waitForTimeout(100);
    await page.evaluate(
      ({ meta, ctrl }) => {
        const event = new KeyboardEvent('keydown', {
          key: 'b',
          code: 'KeyB',
          keyCode: 66,
          which: 66,
          metaKey: meta,
          ctrlKey: ctrl,
          shiftKey: false,
          altKey: false,
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(event);
      },
      { meta: isMac, ctrl: !isMac }
    );

    // Verify sidebar is now visible
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

    // Verify sidebar is collapsed by default
    await expect(page.getByTestId('sidebar')).not.toBeVisible();

    // Focus the page to ensure keyboard events are received
    await page.focus('body');
    await page.waitForTimeout(100);

    // Press ⌘B (Meta+B on Mac) to open sidebar
    await page.keyboard.press('Meta+b');

    // Sidebar should now be visible
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 2000 });

    // Press ⌘B again to close
    await page.keyboard.press('Meta+b');

    // Sidebar should be hidden again
    await expect(page.getByTestId('sidebar')).not.toBeVisible({ timeout: 2000 });
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

    // Verify sidebar is collapsed by default
    await expect(page.getByTestId('sidebar')).not.toBeVisible();

    // Focus the page to ensure keyboard events are received
    await page.focus('body');
    await page.waitForTimeout(100);

    // Press Ctrl+B on Windows/Linux to open sidebar
    await page.keyboard.press('Control+b');

    // Sidebar should now be visible
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 2000 });

    // Press Ctrl+B again to close
    await page.keyboard.press('Control+b');

    // Sidebar should be hidden again
    await expect(page.getByTestId('sidebar')).not.toBeVisible({ timeout: 2000 });
  });

  test('pane resizer is visible and interactive', async ({ page }) => {
    const resizer = page.getByTestId('pane-resizer');

    // Verify resizer is visible
    await expect(resizer).toBeVisible();

    // Verify resizer has correct cursor style
    await expect(resizer).toHaveCSS('cursor', /col-resize|ew-resize/);

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
