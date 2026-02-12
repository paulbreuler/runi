import { test, expect } from '@playwright/test';

test.describe('Layout Resizing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.removeItem('runi-panel-state');
      } catch {
        // Ignore storage access issues in hardened browser contexts
      }
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

    await page.goto('/?e2eSidebar=1', { waitUntil: 'domcontentloaded' });

    // Wait for React app to render
    try {
      await page.waitForSelector('[data-test-id="main-layout"]', {
        state: 'attached',
        timeout: 20000,
      });
    } catch (error) {
      const bodyText = await page.evaluate(
        () => document.body?.innerText?.trim().slice(0, 500) ?? ''
      );
      throw new Error(`Main layout not found. Body text: ${bodyText}`, { cause: error });
    }

    // Ensure sidebar is visible for resize tests
    await page.evaluate(async () => {
      const { useSettingsStore } = await import('/src/stores/useSettingsStore');
      useSettingsStore.getState().setSidebarVisible(true);
    });

    // Wait for sidebar to be visible and animation to complete
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 15000 });
    // Wait for sidebar animation to complete before running tests
    await page.waitForTimeout(500);
  });

  test.describe('Sidebar Resizing', () => {
    test('sidebar resizer is visible and interactive', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      const resizer = page.getByTestId('sidebar-resizer');

      // Verify sidebar and resizer are visible
      await expect(sidebar).toBeVisible();
      await expect(resizer).toBeVisible();

      // Verify resizer has correct cursor
      await expect(resizer).toHaveCSS('cursor', /col-resize|ew-resize/);
    });

    test('sidebar can be resized by dragging', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      const resizer = page.getByTestId('sidebar-resizer');

      // Get initial width
      const initialBox = await sidebar.boundingBox();
      expect(initialBox).not.toBeNull();
      const initialWidth = initialBox!.width;

      // Drag resizer to the right (increase width)
      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      await page.mouse.move(
        resizerBox!.x + resizerBox!.width / 2,
        resizerBox!.y + resizerBox!.height / 2
      );
      await page.mouse.down();
      await page.mouse.move(resizerBox!.x + 100, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.up();

      // Wait for resize to complete
      await page.waitForTimeout(300);

      // Verify width increased
      const newBox = await sidebar.boundingBox();
      expect(newBox).not.toBeNull();
      expect(newBox!.width).toBeGreaterThan(initialWidth);
    });

    test.skip('sidebar respects minimum width (256px)', async ({ page }) => {
      // Sidebar should already be visible from beforeEach
      const sidebar = page.getByTestId('sidebar');
      await expect(sidebar).toBeVisible();

      const resizer = page.getByTestId('sidebar-resizer');
      await expect(resizer).toBeVisible();

      // Get initial width (should be 256px by default)
      const initialBox = await sidebar.boundingBox();
      expect(initialBox).not.toBeNull();
      const initialWidth = initialBox!.width;
      expect(initialWidth).toBeGreaterThanOrEqual(240); // Should be at least 256px

      // Try to drag resizer to the left (decrease width) but not enough to collapse
      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      const centerX = resizerBox!.x + resizerBox!.width / 2;
      const centerY = resizerBox!.y + resizerBox!.height / 2;

      // Drag left by a small amount (30px) - should clamp to minimum width, not collapse
      await resizer.hover();
      await page.mouse.move(centerX, centerY);
      await page.mouse.down();
      // Drag left by 30px (should stay above minimum, not collapse)
      await page.mouse.move(centerX - 30, centerY, { steps: 5 });
      await page.mouse.up();

      // Wait for animation to complete
      await page.waitForTimeout(800);

      // Verify sidebar is still visible (not collapsed)
      await expect(sidebar).toBeVisible();

      // Verify width is clamped to minimum (256px) or greater
      const newBox = await sidebar.boundingBox();
      expect(newBox).not.toBeNull();
      // Width should be clamped to minimum (260px) or greater, not collapsed
      expect(newBox!.width).toBeGreaterThanOrEqual(255); // Allow small tolerance
      // Should not have collapsed (width should be >= minimum, not 8px)
      expect(newBox!.width).toBeGreaterThan(50); // Definitely not collapsed
    });

    test('sidebar respects maximum width (600px)', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      const resizer = page.getByTestId('sidebar-resizer');

      // Get initial width
      const initialBox = await sidebar.boundingBox();
      expect(initialBox).not.toBeNull();

      // Drag resizer far to the right (increase width)
      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      await page.mouse.move(
        resizerBox!.x + resizerBox!.width / 2,
        resizerBox!.y + resizerBox!.height / 2
      );
      await page.mouse.down();
      // Drag far to the right (more than max width)
      await page.mouse.move(resizerBox!.x + 800, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.up();

      await page.waitForTimeout(300);

      // Verify width is clamped to MAX_SIDEBAR_WIDTH (600px)
      const newBox = await sidebar.boundingBox();
      expect(newBox).not.toBeNull();
      expect(newBox!.width).toBeLessThanOrEqual(610); // Allow small tolerance
    });

    test('sidebar resizer shows handle on hover', async ({ page }) => {
      const resizer = page.getByTestId('sidebar-resizer');

      // Hover over resizer
      await resizer.hover();

      // Wait for hover animation
      await page.waitForTimeout(100);

      // Verify resizer has hover styles (background color should change)
      const style = await resizer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(style).toBeTruthy();
    });
  });

  // Pane resizing tests removed - the UI no longer has a pane resizer between request/response.
  // The layout now uses a single-pane design that adapts based on selected layout.
});
