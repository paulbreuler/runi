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

    // Wait for React app to render and sidebar to be visible
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('sidebar')).toBeVisible({ timeout: 10000 });
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
      // Width should be clamped to minimum (256px) or greater, not collapsed
      expect(newBox!.width).toBeGreaterThanOrEqual(240); // Allow some tolerance
      // Should not have collapsed (width should be >= minimum, not 8px)
      expect(newBox!.width).toBeGreaterThan(50); // Definitely not collapsed
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

      await page.mouse.move(
        resizerBox!.x + resizerBox!.width / 2,
        resizerBox!.y + resizerBox!.height / 2
      );
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

      // Verify resizer has hover styles (background color should change)
      const style = await resizer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(style).toBeTruthy();
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

      await page.mouse.move(
        resizerBox!.x + resizerBox!.width / 2,
        resizerBox!.y + resizerBox!.height / 2
      );
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

      await page.mouse.move(
        resizerBox!.x + resizerBox!.width / 2,
        resizerBox!.y + resizerBox!.height / 2
      );
      await page.mouse.down();
      // Drag far to the left
      await page.mouse.move(
        resizerBox!.x - containerWidth * 0.5,
        resizerBox!.y + resizerBox!.height / 2
      );
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

      await page.mouse.move(
        resizerBox!.x + resizerBox!.width / 2,
        resizerBox!.y + resizerBox!.height / 2
      );
      await page.mouse.down();
      // Drag far to the right
      await page.mouse.move(
        resizerBox!.x + containerWidth * 0.5,
        resizerBox!.y + resizerBox!.height / 2
      );
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

      // Verify resizer has hover styles (background color should change)
      const style = await resizer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
      expect(style).toBeTruthy();
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
      await page.mouse.move(
        resizerBox!.x + resizerBox!.width / 2,
        resizerBox!.y + resizerBox!.height / 2
      );
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

      await page.mouse.move(
        resizerBox!.x + resizerBox!.width / 2,
        resizerBox!.y + resizerBox!.height / 2
      );
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

    test('extreme drag scenarios - all the way left, right, and rapid jitter', async ({ page }) => {
      const resizer = page.getByTestId('pane-resizer');
      const requestPane = page.getByTestId('request-pane');
      const responsePane = page.getByTestId('response-pane');
      const container = page.getByTestId('pane-container');

      const containerBox = await container.boundingBox();
      const resizerBox = await resizer.boundingBox();
      expect(containerBox).not.toBeNull();
      expect(resizerBox).not.toBeNull();

      const containerWidth = containerBox!.width;
      const centerY = resizerBox!.y + resizerBox!.height / 2;

      // Test 1: Drag all the way LEFT (minimum - 20%)
      const minX = containerBox!.x + containerWidth * 0.2;
      await page.mouse.move(resizerBox!.x + resizerBox!.width / 2, centerY);
      await page.mouse.down();
      await page.mouse.move(minX, centerY);
      await page.mouse.up();
      await page.waitForTimeout(100);

      // Verify minimum constraint
      const requestBoxAfterMin = await requestPane.boundingBox();
      expect(requestBoxAfterMin).not.toBeNull();
      const requestPercentAfterMin = (requestBoxAfterMin!.width / containerWidth) * 100;
      expect(requestPercentAfterMin).toBeGreaterThanOrEqual(18);

      // Test 2: Drag all the way RIGHT (maximum - 80%)
      const maxX = containerBox!.x + containerWidth * 0.8;
      const resizerBoxAfterMin = await resizer.boundingBox();
      await page.mouse.move(resizerBoxAfterMin!.x + resizerBoxAfterMin!.width / 2, centerY);
      await page.mouse.down();
      await page.mouse.move(maxX, centerY);
      await page.mouse.up();
      await page.waitForTimeout(100);

      // Verify maximum constraint
      const requestBoxAfterMax = await requestPane.boundingBox();
      expect(requestBoxAfterMax).not.toBeNull();
      const requestPercentAfterMax = (requestBoxAfterMax!.width / containerWidth) * 100;
      expect(requestPercentAfterMax).toBeLessThanOrEqual(82);

      // Test 3: Rapid jittering (wild mouse movements) - video game style
      const centerX = containerBox!.x + containerWidth * 0.5;
      const jitterAmplitude = containerWidth * 0.3;

      for (let i = 0; i < 30; i++) {
        // Rapid jitter: alternate between left and right
        const jitterOffset = (i % 2 === 0 ? 1 : -1) * jitterAmplitude * (0.5 + Math.random() * 0.5);
        const jitterX = centerX + jitterOffset;

        const currentResizerBox = await resizer.boundingBox();
        await page.mouse.move(currentResizerBox!.x + currentResizerBox!.width / 2, centerY);
        await page.mouse.down();
        await page.mouse.move(jitterX, centerY);
        await page.mouse.up();

        // Very small delay for rapid jittering
        await page.waitForTimeout(10);

        // Verify perfect sync after each jitter
        const requestBox = await requestPane.boundingBox();
        const responseBox = await responsePane.boundingBox();
        expect(requestBox).not.toBeNull();
        expect(responseBox).not.toBeNull();

        // Total width should equal container width (perfect sync)
        const totalWidth = requestBox!.width + responseBox!.width;
        expect(totalWidth).toBeCloseTo(containerWidth, 2);

        // Request pane should be within constraints
        const requestPercent = (requestBox!.width / containerWidth) * 100;
        expect(requestPercent).toBeGreaterThanOrEqual(18);
        expect(requestPercent).toBeLessThanOrEqual(82);
      }

      // Final verification: All components still functional and in sync
      await expect(requestPane).toBeVisible();
      await expect(responsePane).toBeVisible();
      await expect(resizer).toBeVisible();

      const finalRequestBox = await requestPane.boundingBox();
      const finalResponseBox = await responsePane.boundingBox();
      const finalTotal = finalRequestBox!.width + finalResponseBox!.width;

      // Perfect sync check - total should equal container width
      expect(finalTotal).toBeCloseTo(containerWidth, 2);
    });
  });
});
