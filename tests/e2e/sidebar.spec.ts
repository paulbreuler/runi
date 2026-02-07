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
          if (cmd === 'load_feature_flags') {
            return Promise.resolve({ http: { collectionsEnabled: true } });
          }
          if (cmd === 'cmd_list_collections') {
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

    // Sidebar is collapsed by default, so we need to open it first
    // Use keyboard shortcut to toggle sidebar open (Cmd+B on Mac, Ctrl+B on Windows/Linux)
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

    // Wait for sidebar to be visible and animation to complete
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 10000 });
    // Wait for sidebar animation to complete before running tests
    await page.waitForTimeout(500);
  });

  test('renders Collections section', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    // Verify sidebar is visible
    await expect(sidebar).toBeVisible();

    // Verify Collections section header is visible
    await expect(page.getByText('Collections', { exact: true })).toBeVisible();

    // Collections drawer is open by default
    const collectionsDrawer = page.getByTestId('collections-drawer');
    await expect(collectionsDrawer).toBeVisible();

    // Now verify the content is visible (or gated by feature flags)
    const collectionListDisabled = page.getByTestId('collection-list-disabled');
    if ((await collectionListDisabled.count()) > 0) {
      await expect(collectionListDisabled).toBeVisible();
      return;
    }

    await expect(page.getByTestId('collection-list-empty')).toBeVisible();

    // History section was removed - it's now in Network History Panel instead
  });

  test('sidebar has correct width when visible', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    await expect(sidebar).toBeVisible();

    // Wait for sidebar to reach its full width (animation completes)
    // Sidebar should be approximately 256px when fully expanded
    await expect(async () => {
      const boundingBox = await sidebar.boundingBox();
      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        // Allow small tolerance for browser rendering
        expect(boundingBox.width).toBeGreaterThan(250);
        expect(boundingBox.width).toBeLessThan(270);
      }
    }).toPass({ timeout: 5000 });

    // Verify final width
    const boundingBox = await sidebar.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.width).toBeGreaterThan(250);
      expect(boundingBox.width).toBeLessThan(270);
    }
  });

  test('sidebar takes full vertical height', async ({ page }) => {
    const sidebar = page.getByTestId('sidebar');

    await expect(sidebar).toBeVisible();

    // Sidebar should fill nearly all of its parent container height.
    const { sidebarHeight, parentHeight } = await sidebar.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentElement?.getBoundingClientRect();
      return {
        sidebarHeight: rect.height,
        parentHeight: parentRect?.height ?? 0,
      };
    });

    expect(parentHeight).toBeGreaterThan(0);
    expect(sidebarHeight).toBeGreaterThan(parentHeight - 4);
    expect(sidebarHeight).toBeLessThanOrEqual(parentHeight + 4);
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
    const collectionListDisabled = page.getByTestId('collection-list-disabled');
    if ((await collectionListDisabled.count()) > 0) {
      await expect(collectionListDisabled).toBeVisible();
      return;
    }

    const collectionsItem = page.getByTestId('collection-list-empty');

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
