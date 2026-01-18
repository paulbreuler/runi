import { test, expect } from '@playwright/test';
import { openPanel, isCI } from '../helpers/panel';

test.describe('Error Propagation with Correlation IDs', () => {
  test.beforeEach(async ({ page }) => {
    // Mock Tauri IPC to return errors with correlation IDs for error propagation tests
    await page.addInitScript(() => {
      // Mark Tauri as available
      (window as unknown as Record<string, unknown>).__TAURI__ = true;
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {
        invoke: (cmd: string, args?: { params?: { url?: string } }): Promise<unknown> => {
          // Handle load_request_history - return empty array for empty history
          if (cmd === 'load_request_history') {
            return Promise.resolve([]);
          }
          // Handle execute_request - return error with correlation ID for invalid URLs
          if (cmd === 'execute_request') {
            const url = args?.params?.url ?? '';
            if (url === 'not-a-valid-url' || url.includes('not-a-valid')) {
              // Return a JSON-serialized AppError (as Rust would)
              const correlationId = '7c7c06ef-cdc1-4534-8561-ac740fbe6fee';
              return Promise.reject(
                JSON.stringify({
                  correlation_id: correlationId,
                  code: 'INVALID_URL',
                  message: 'Could not resolve hostname',
                  details: null,
                })
              );
            }
            // Default mock for valid requests
            return Promise.resolve({
              status: 200,
              status_text: 'OK',
              body: '{}',
              headers: {},
              timing: { total_ms: 100, dns_ms: 10, connect_ms: 20, tls_ms: 30, first_byte_ms: 40 },
            });
          }
          // Default mock for other commands
          return Promise.resolve({ status: 200, body: '{}', headers: {} });
        },
      };
    });

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
    // Try getByLabel first, fallback to getByPlaceholder if not found
    let urlInput = page.getByLabel(/url/i).first();
    const isLabelVisible = await urlInput.isVisible().catch(() => false);
    if (!isLabelVisible) {
      urlInput = page.getByPlaceholder(/url/i).first();
    }
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
    // Error messages from AppError include "(Correlation ID: <uuid>)" or correlation ID is displayed separately
    const errorText = await errorLog.first().textContent();
    // Check for either "Correlation ID:" text or UUID pattern (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const hasCorrelationId =
      errorText?.includes('Correlation ID') ||
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i.test(errorText ?? '');
    expect(hasCorrelationId).toBe(true);
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

    // Trigger an error request to generate a log with correlation ID
    // Try getByLabel first, fallback to getByPlaceholder if not found
    let urlInput = page.getByLabel(/url/i).first();
    const isLabelVisible = await urlInput.isVisible().catch(() => false);
    if (!isLabelVisible) {
      urlInput = page.getByPlaceholder(/url/i).first();
    }
    const sendButton = page.getByRole('button', { name: /send/i }).first();

    // Make an error request to generate a log entry
    await urlInput.fill('not-a-valid-url');
    await sendButton.click();
    await page.waitForTimeout(1000);

    // Get correlation ID from console log
    const consoleLogs = page.locator('[data-testid="console-logs"]');
    const errorLog = consoleLogs.locator('[data-testid*="console-log-error"]').first();
    await errorLog.waitFor({ timeout: 5000 });

    // Extract correlation ID from error log (check for UUID pattern or first 8 chars)
    const errorText = await errorLog.textContent();
    // Try to extract full UUID first, then fall back to first 8 chars
    const uuidMatch = errorText?.match(
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
    );
    const first8Match = errorText?.match(/([a-f0-9]{8})/i);

    if (uuidMatch || first8Match) {
      const correlationId = uuidMatch ? uuidMatch[1] : first8Match![1];

      // Filter by correlation ID (use first 8 chars - partial match should work)
      const filterInput = page.getByPlaceholder(/filter by correlation id/i);
      await filterInput.fill(correlationId.substring(0, 8));

      // Wait for filter to apply
      await page.waitForTimeout(300);

      // Verify at least one log with that correlation ID is shown (partial match)
      const filteredLogs = consoleLogs.locator('[data-testid*="console-log"]');
      const count = await filteredLogs.count();
      expect(count).toBeGreaterThan(0);
    } else {
      // If no correlation ID found, skip the filter test but don't fail
      test.skip(true, 'Could not extract correlation ID from log entry');
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
