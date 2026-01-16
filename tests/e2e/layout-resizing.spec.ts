import { test, expect } from '@playwright/test';

test.describe('Layout Resizing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Mock Tauri IPC
    await page.evaluate(() => {
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
        invoke: (): Promise<{ status: number; body: string; headers: Record<string, string> }> =>
          Promise.resolve({ status: 200, body: '{}', headers: {} }),
      };
    });
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

      await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
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

    test('sidebar respects minimum width (256px)', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      const resizer = page.getByTestId('sidebar-resizer');

      // Get initial width
      const initialBox = await sidebar.boundingBox();
      expect(initialBox).not.toBeNull();

      // Try to drag resizer to the left (decrease width)
      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.down();
      // Drag far to the left
      await page.mouse.move(resizerBox!.x - 200, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.up();

      await page.waitForTimeout(300);

      // Verify width is at least 256px
      const newBox = await sidebar.boundingBox();
      expect(newBox).not.toBeNull();
      expect(newBox!.width).toBeGreaterThanOrEqual(240); // Allow some tolerance
    });

    test('sidebar respects maximum width (500px)', async ({ page }) => {
      const sidebar = page.getByTestId('sidebar');
      const resizer = page.getByTestId('sidebar-resizer');

      // Get initial width
      const initialBox = await sidebar.boundingBox();
      expect(initialBox).not.toBeNull();

      // Drag resizer far to the right (increase width)
      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.down();
      // Drag far to the right
      await page.mouse.move(resizerBox!.x + 500, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.up();

      await page.waitForTimeout(300);

      // Verify width is at most 500px
      const newBox = await sidebar.boundingBox();
      expect(newBox).not.toBeNull();
      expect(newBox!.width).toBeLessThanOrEqual(520); // Allow some tolerance
    });

    test('sidebar resizer shows handle on hover', async ({ page }) => {
      const resizer = page.getByTestId('sidebar-resizer');

      // Hover over resizer
      await resizer.hover();

      // Wait for hover animation
      await page.waitForTimeout(100);

      // Verify handle is visible (opacity should increase)
      const handle = resizer.locator('.flex.flex-col.items-center.gap-1');
      await expect(handle).toBeVisible();
    });
  });

  test.describe('Pane Resizing', () => {
    test('pane resizer is visible and interactive', async ({ page }) => {
      const resizer = page.getByTestId('pane-resizer');
      const requestPane = page.getByTestId('request-pane');
      const responsePane = page.getByTestId('response-pane');

      // Verify all elements are visible
      await expect(resizer).toBeVisible();
      await expect(requestPane).toBeVisible();
      await expect(responsePane).toBeVisible();

      // Verify resizer has correct cursor
      await expect(resizer).toHaveCSS('cursor', /col-resize|ew-resize/);
    });

    test('panes start at 50/50 split', async ({ page }) => {
      const requestPane = page.getByTestId('request-pane');
      const responsePane = page.getByTestId('response-pane');

      const requestBox = await requestPane.boundingBox();
      const responseBox = await responsePane.boundingBox();

      expect(requestBox).not.toBeNull();
      expect(responseBox).not.toBeNull();

      const totalWidth = requestBox!.width + responseBox!.width;
      const requestPercentage = (requestBox!.width / totalWidth) * 100;

      // Should be approximately 50% (allow 5% tolerance)
      expect(requestPercentage).toBeGreaterThan(45);
      expect(requestPercentage).toBeLessThan(55);
    });

    test('panes can be resized by dragging', async ({ page }) => {
      const requestPane = page.getByTestId('request-pane');
      const responsePane = page.getByTestId('response-pane');
      const resizer = page.getByTestId('pane-resizer');

      // Get initial widths
      const initialRequestBox = await requestPane.boundingBox();
      const initialResponseBox = await responsePane.boundingBox();
      expect(initialRequestBox).not.toBeNull();
      expect(initialResponseBox).not.toBeNull();

      const initialRequestWidth = initialRequestBox!.width;

      // Drag resizer to the right (increase request pane)
      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.down();
      await page.mouse.move(resizerBox!.x + 100, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.up();

      // Wait for resize to complete
      await page.waitForTimeout(300);

      // Verify request pane width increased
      const newRequestBox = await requestPane.boundingBox();
      expect(newRequestBox).not.toBeNull();
      expect(newRequestBox!.width).toBeGreaterThan(initialRequestWidth);
    });

    test('pane resizer respects minimum size (20%)', async ({ page }) => {
      const requestPane = page.getByTestId('request-pane');
      const resizer = page.getByTestId('pane-resizer');

      // Get container width
      const container = page.getByTestId('pane-container');
      const containerBox = await container.boundingBox();
      expect(containerBox).not.toBeNull();
      const containerWidth = containerBox!.width;

      // Drag resizer far to the left (decrease request pane)
      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.down();
      // Drag far to the left
      await page.mouse.move(resizerBox!.x - containerWidth * 0.5, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.up();

      await page.waitForTimeout(300);

      // Verify request pane is at least 20% of container
      const newRequestBox = await requestPane.boundingBox();
      expect(newRequestBox).not.toBeNull();
      const requestPercentage = (newRequestBox!.width / containerWidth) * 100;
      expect(requestPercentage).toBeGreaterThanOrEqual(18); // Allow some tolerance
    });

    test('pane resizer respects maximum size (80%)', async ({ page }) => {
      const requestPane = page.getByTestId('request-pane');
      const resizer = page.getByTestId('pane-resizer');

      // Get container width
      const container = page.getByTestId('pane-container');
      const containerBox = await container.boundingBox();
      expect(containerBox).not.toBeNull();
      const containerWidth = containerBox!.width;

      // Drag resizer far to the right (increase request pane)
      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.down();
      // Drag far to the right
      await page.mouse.move(resizerBox!.x + containerWidth * 0.5, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.up();

      await page.waitForTimeout(300);

      // Verify request pane is at most 80% of container
      const newRequestBox = await requestPane.boundingBox();
      expect(newRequestBox).not.toBeNull();
      const requestPercentage = (newRequestBox!.width / containerWidth) * 100;
      expect(requestPercentage).toBeLessThanOrEqual(82); // Allow some tolerance
    });

    test('pane resizer shows handle on hover', async ({ page }) => {
      const resizer = page.getByTestId('pane-resizer');

      // Hover over resizer
      await resizer.hover();

      // Wait for hover animation
      await page.waitForTimeout(100);

      // Verify handle is visible
      const handle = resizer.locator('.flex.flex-col.items-center.gap-1');
      await expect(handle).toBeVisible();
    });
  });

  test.describe('Scrollbar Stability', () => {
    test('scrollbars do not flash during resize', async ({ page }) => {
      // Add scrollable content
      await page.evaluate(() => {
        const requestPane = document.querySelector('[data-testid="request-pane"]');
        if (requestPane) {
          requestPane.innerHTML = `
            <div style="height: 2000px; padding: 20px;">
              <h2>Scrollable Content</h2>
              ${Array.from({ length: 50 }, (_, i) => `<p>Item ${i + 1}</p>`).join('')}
            </div>
          `;
        }
      });

      const resizer = page.getByTestId('pane-resizer');
      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      // Start dragging
      await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.down();

      // Check scrollbar-gutter during drag
      const requestPane = page.getByTestId('request-pane');
      const scrollbarGutter = await requestPane.evaluate((el) => {
        return window.getComputedStyle(el).scrollbarGutter;
      });

      // Should have stable scrollbar gutter
      expect(scrollbarGutter).toBe('stable');

      await page.mouse.up();
    });
  });

  test.describe('Performance', () => {
    test('resize operations are smooth and responsive', async ({ page }) => {
      const resizer = page.getByTestId('pane-resizer');
      const requestPane = page.getByTestId('request-pane');

      const resizerBox = await resizer.boundingBox();
      expect(resizerBox).not.toBeNull();

      // Measure resize performance
      const startTime = Date.now();

      await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.down();
      await page.mouse.move(resizerBox!.x + 50, resizerBox!.y + resizerBox!.height / 2);
      await page.mouse.up();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Resize should complete quickly (< 500ms for smooth feel)
      expect(duration).toBeLessThan(500);

      // Verify pane updated
      await page.waitForTimeout(100);
      const newBox = await requestPane.boundingBox();
      expect(newBox).not.toBeNull();
    });
  });
});
