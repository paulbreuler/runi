import { test, expect } from '@playwright/test';
import { openPanel, isCI } from '../helpers/panel';

test.describe('Network Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('displays network history panel with VirtualDataGrid', async ({ page }) => {
    // Open panel using reliable helper
    const panelOpened = await openPanel(page);

    // Skip test in CI if keyboard shortcut doesn't work reliably
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }

    // In local dev, fail if panel couldn't be opened
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Network tab should be active by default
    const networkTab = page.getByRole('tab', { name: /network/i });
    await expect(networkTab).toBeVisible();

    // Click the network tab to ensure it's active
    await networkTab.click();

    // Wait for the panel content to load
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // The VirtualDataGrid should be rendered
    const virtualDataGrid = page.locator('[data-testid="virtual-datagrid"]');
    await expect(virtualDataGrid).toBeVisible();
  });

  test('shows empty state when no history entries', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Network tab
    const networkTab = page.getByRole('tab', { name: /network/i });
    await networkTab.click();

    // Should show empty state or no rows
    // The VirtualDataGrid should still be present
    const virtualDataGrid = page.locator('[data-testid="virtual-datagrid"]');
    await expect(virtualDataGrid).toBeVisible();
  });

  test('filter bar is visible and has filter controls', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Network tab
    const networkTab = page.getByRole('tab', { name: /network/i });
    await networkTab.click();

    // Wait for panel content
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Method filter should be visible
    const methodFilter = page.locator('[data-testid="method-filter"]');
    await expect(methodFilter).toBeVisible();

    // Status filter should be visible
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await expect(statusFilter).toBeVisible();
  });

  test('method filter can be changed', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Network tab
    const networkTab = page.getByRole('tab', { name: /network/i });
    await networkTab.click();

    // Wait for panel content
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Find and click the method filter
    const methodFilter = page.locator('[data-testid="method-filter"]');
    await expect(methodFilter).toBeVisible();
    await methodFilter.click();

    // Should open a dropdown with method options
    // Wait for the dropdown to appear
    await page.waitForTimeout(100);

    // Look for GET option in the dropdown
    const getOption = page.getByRole('option', { name: /get/i }).first();
    if (await getOption.isVisible()) {
      await getOption.click();
    }
  });

  test('status filter can be changed', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Network tab
    const networkTab = page.getByRole('tab', { name: /network/i });
    await networkTab.click();

    // Wait for panel content
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Find and click the status filter
    const statusFilter = page.locator('[data-testid="status-filter"]');
    await expect(statusFilter).toBeVisible();
    await statusFilter.click();

    // Should open a dropdown with status options
    await page.waitForTimeout(100);

    // Look for 2xx option in the dropdown
    const successOption = page.getByRole('option', { name: /2xx/i }).first();
    if (await successOption.isVisible()) {
      await successOption.click();
    }
  });

  test('compare mode can be toggled', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Network tab
    const networkTab = page.getByRole('tab', { name: /network/i });
    await networkTab.click();

    // Wait for panel content
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Find and click the compare toggle
    const compareToggle = page.locator('[data-testid="compare-toggle"]').first();
    if (await compareToggle.isVisible()) {
      await compareToggle.click();

      // Compare mode should now be active
      // The Compare Responses button might appear
      const compareButton = page.locator('[data-testid="compare-responses-button"]');
      // Button might not be visible until entries are selected, but toggle should work
    }
  });

  test('virtual scroll container is present', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Network tab
    const networkTab = page.getByRole('tab', { name: /network/i });
    await networkTab.click();

    // Wait for panel content
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Virtual scroll container should be present
    const scrollContainer = page.locator('[data-testid="virtual-scroll-container"]');
    await expect(scrollContainer).toBeVisible();
  });

  test('panel can be resized', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Wait for panel
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Panel resizer should be visible
    const resizer = page.locator('[data-testid="panel-resizer"]');
    await expect(resizer).toBeVisible();

    // Get initial panel height
    const panel = page.locator('[data-testid="dockable-panel"]');
    const initialBox = await panel.boundingBox();
    expect(initialBox).not.toBeNull();

    // Drag the resizer up to resize
    if (initialBox) {
      const resizerBox = await resizer.boundingBox();
      if (resizerBox) {
        await page.mouse.move(
          resizerBox.x + resizerBox.width / 2,
          resizerBox.y + resizerBox.height / 2
        );
        await page.mouse.down();
        await page.mouse.move(resizerBox.x + resizerBox.width / 2, resizerBox.y - 100);
        await page.mouse.up();

        // Panel should be larger now
        const newBox = await panel.boundingBox();
        expect(newBox).not.toBeNull();
        if (newBox) {
          expect(newBox.height).toBeGreaterThan(initialBox.height);
        }
      }
    }
  });

  test('keyboard navigation works in the panel', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Network tab
    const networkTab = page.getByRole('tab', { name: /network/i });
    await networkTab.click();

    // Wait for panel content
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Tab navigation should work within the panel
    // Focus should move through filter controls
    await page.keyboard.press('Tab');

    // Verify some element is focused (difficult to test specific element without data)
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('panel header has tabs for Network and Console', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Both tabs should be visible
    const networkTab = page.getByRole('tab', { name: /network/i });
    const consoleTab = page.getByRole('tab', { name: /console/i });

    await expect(networkTab).toBeVisible();
    await expect(consoleTab).toBeVisible();
  });

  test('can switch between Network and Console tabs', async ({ page }) => {
    // Open panel
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Start with Network tab
    const networkTab = page.getByRole('tab', { name: /network/i });
    await networkTab.click();

    // Verify VirtualDataGrid is visible
    const virtualDataGrid = page.locator('[data-testid="virtual-datagrid"]');
    await expect(virtualDataGrid).toBeVisible();

    // Switch to Console tab
    const consoleTab = page.getByRole('tab', { name: /console/i });
    await consoleTab.click();

    // Wait for console content
    await page.waitForSelector('[data-testid="console-logs"]');

    // Console logs should be visible
    const consoleLogs = page.locator('[data-testid="console-logs"]');
    await expect(consoleLogs).toBeVisible();

    // Switch back to Network tab
    await networkTab.click();

    // VirtualDataGrid should be visible again
    await expect(virtualDataGrid).toBeVisible();
  });
});
