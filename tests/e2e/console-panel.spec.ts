import { test, expect } from '@playwright/test';

test.describe('Console Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('displays console logs in panel', async ({ page }) => {
    // Open console panel (Cmd+Shift+I or Ctrl+Shift+I)
    await page.keyboard.press('Meta+Shift+I'); // Mac: Cmd+Shift+I, Windows: Ctrl+Shift+I

    // Wait for console panel to appear
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Switch to Console tab
    const consoleTab = page.getByRole('tab', { name: /console/i });
    await consoleTab.click();

    // Execute code that logs to console
    await page.evaluate(() => {
      console.log('Test debug message');
      console.error('Test error message');
    });

    // Wait for logs to appear
    await page.waitForSelector('[data-testid="console-logs"]');

    // Verify logs appear in console panel
    const consoleLogs = page.locator('[data-testid="console-logs"]');
    await expect(consoleLogs).toContainText('Test debug message');
    await expect(consoleLogs).toContainText('Test error message');
  });

  test('filters logs by level', async ({ page }) => {
    // Open console panel
    await page.keyboard.press('Meta+Shift+I');
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Switch to Console tab
    const consoleTab = page.getByRole('tab', { name: /console/i });
    await consoleTab.click();

    // Add logs
    await page.evaluate(() => {
      console.debug('Debug message');
      console.error('Error message');
      console.warn('Warning message');
    });

    // Wait for logs
    await page.waitForSelector('[data-testid="console-logs"]');

    // Filter by error
    const errorButton = page.getByRole('button', { name: /errors/i });
    await errorButton.click();

    // Verify only error logs are shown
    const consoleLogs = page.locator('[data-testid="console-logs"]');
    await expect(consoleLogs).toContainText('Error message');
    await expect(consoleLogs).not.toContainText('Debug message');
    await expect(consoleLogs).not.toContainText('Warning message');
  });

  test('clears logs when clear button is clicked', async ({ page }) => {
    // Open console panel
    await page.keyboard.press('Meta+Shift+I');
    await page.waitForSelector('[data-testid="dockable-panel"]');

    // Switch to Console tab
    const consoleTab = page.getByRole('tab', { name: /console/i });
    await consoleTab.click();

    // Add logs
    await page.evaluate(() => {
      console.log('Message 1');
      console.log('Message 2');
    });

    // Wait for logs
    await page.waitForSelector('[data-testid="console-logs"]');
    await expect(page.locator('[data-testid="console-logs"]')).toContainText('Message 1');

    // Clear logs
    const clearButton = page.getByRole('button', { name: /clear/i });
    await clearButton.click();

    // Verify logs are cleared
    await expect(page.locator('[data-testid="console-logs"]')).toContainText(/no logs/i);
  });
});
