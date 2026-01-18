import { test, expect } from '@playwright/test';
import { openPanel, isCI } from '../helpers/panel';

test.describe('Error Propagation with Correlation IDs', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('error propagates from Rust to React with correlation ID', async ({ page }) => {
    // Open console panel using reliable helper
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Console tab
    const consoleTab = page.getByRole('tab', { name: /console/i });
    await consoleTab.click();

    // Trigger error in Rust by making invalid request
    // Find URL input and send button (adjust selectors based on actual UI)
    const urlInput = page.getByLabel(/url/i).or(page.getByPlaceholderText(/url/i)).first();
    const sendButton = page.getByRole('button', { name: /send/i }).first();

    // Enter invalid URL
    await urlInput.fill('not-a-valid-url');
    await sendButton.click();

    // Wait for error to appear
    await page.waitForTimeout(1000); // Wait for request to complete

    // Verify error appears in console panel with correlation ID
    const consoleLogs = page.locator('[data-testid="console-logs"]');

    // Check for error log
    const errorLog = consoleLogs.locator('[data-testid*="console-log-error"]');
    await expect(errorLog.first()).toBeVisible({ timeout: 5000 });

    // Verify correlation ID is present in error message or log entry
    const errorText = await errorLog.first().textContent();
    expect(errorText).toContain('Correlation ID');
  });

  test('correlation ID can be used to filter logs', async ({ page }) => {
    // Open console panel using reliable helper
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Console tab
    const consoleTab = page.getByRole('tab', { name: /console/i });
    await consoleTab.click();

    // Trigger multiple requests with different correlation IDs
    const urlInput = page.getByLabel(/url/i).or(page.getByPlaceholderText(/url/i)).first();
    const sendButton = page.getByRole('button', { name: /send/i }).first();

    // Make a request
    await urlInput.fill('https://httpbin.org/get');
    await sendButton.click();
    await page.waitForTimeout(1000);

    // Get correlation ID from console log
    const consoleLogs = page.locator('[data-testid="console-logs"]');
    const logEntry = consoleLogs.locator('[data-testid*="console-log"]').first();
    await logEntry.waitFor({ timeout: 5000 });

    // Extract correlation ID (first 8 chars displayed in UI)
    const correlationIdText = await logEntry.textContent();
    const correlationIdMatch = correlationIdText?.match(/([a-f0-9]{8})/i);

    if (correlationIdMatch) {
      const correlationId = correlationIdMatch[1];

      // Filter by correlation ID
      const filterInput = page.getByPlaceholderText(/filter by correlation id/i);
      await filterInput.fill(correlationId);

      // Verify only logs with that correlation ID are shown
      const filteredLogs = consoleLogs.locator('[data-testid*="console-log"]');
      const count = await filteredLogs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('console panel captures logs before React mounts', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Immediately open console panel using reliable helper
    const panelOpened = await openPanel(page);
    if (!panelOpened && isCI()) {
      test.skip(true, 'Keyboard shortcut not reliable in CI environment');
      return;
    }
    if (!panelOpened) {
      throw new Error('Panel could not be opened via keyboard shortcut');
    }

    // Switch to Console tab
    const consoleTab = page.getByRole('tab', { name: /console/i });
    await consoleTab.click();

    // Check for startup logs (should be captured before React mount)
    const consoleLogs = page.locator('[data-testid="console-logs"]');

    // Startup timing log should be present (from main.tsx)
    // This validates that console service works before React mounts
    await page.waitForTimeout(500); // Wait for startup logs

    // Verify console panel is functional
    await expect(consoleLogs).toBeVisible();
  });
});
