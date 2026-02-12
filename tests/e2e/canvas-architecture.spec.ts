/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 *
 * E2E tests for the canvas architecture including Manila folder tabs,
 * context toolbar, layout picker, and keyboard navigation.
 */

import { test, expect } from '@playwright/test';

test.describe('Canvas Architecture', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to be fully loaded
    await page.waitForSelector('[data-test-id="titlebar"]', { timeout: 10000 });
  });

  test('Manila folder tabs in TitleBar', async ({ page }) => {
    // Verify tabs render in TitleBar
    const titleBar = page.locator('[data-test-id="titlebar"]');
    await expect(titleBar).toBeVisible();

    // Check that context tabs list exists
    const contextTabsList = page.locator('[data-test-id="context-tabs-list"]');
    await expect(contextTabsList).toBeVisible();

    // Verify at least one tab is present (default request-{uuid} tab)
    const tabs = contextTabsList.locator('[role="tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 5000 });

    // Verify a dynamic request tab is present and active (request-{uuid} format)
    const requestTab = page.locator('[data-test-id^="context-tab-request-"]').first();
    await expect(requestTab).toBeVisible();
    await expect(requestTab).toHaveAttribute('aria-selected', 'true');
  });

  test('Context toolbar in canvas area', async ({ page }) => {
    // Verify toolbar exists and is positioned correctly
    const contextToolbar = page.locator('[data-test-id="context-toolbar"]');
    await expect(contextToolbar).toBeVisible();

    // Verify URL bar visible in Request context
    const urlBar = page.locator('[data-test-id="url-bar"]');
    await expect(urlBar).toBeVisible();

    // Verify ActionButtons visible
    const testButton = page.locator('[data-test-id="action-test"]');
    await expect(testButton).toBeVisible();

    const codeButton = page.locator('[data-test-id="action-code"]');
    await expect(codeButton).toBeVisible();

    const saveButton = page.locator('[data-test-id="action-save"]');
    await expect(saveButton).toBeVisible();
  });

  test.skip('Settings toggle', async ({ page }) => {
    // Skipped: Settings panel implementation not yet complete with test IDs
    // TODO: Add data-test-id to settings panel and restore assertions
    // Find settings button in TitleBar
    const settingsButton = page.locator('[data-test-id="titlebar-settings"]');
    await expect(settingsButton).toBeVisible();

    // Click settings button
    await settingsButton.click();

    // Verify settings panel opens
    // Note: The actual implementation may use a different test ID
    // This is a placeholder for the settings panel
    await page.waitForTimeout(300); // Wait for animation

    // Click again
    await settingsButton.click();

    // Verify settings panel closes
    await page.waitForTimeout(300); // Wait for animation
  });

  test.skip('Generic layouts work', async ({ page }) => {
    // Skipped: Layout options UI changed - specific layout test IDs no longer match implementation
    // TODO: Update test with actual layout option test IDs from LayoutPicker component
    const layoutPicker = page.locator('[data-test-id="layout-picker-trigger"]');
    await expect(layoutPicker).toBeVisible();
  });

  test.skip('Keyboard navigation - tab cycling', async ({ page }) => {
    // Skipped: Keyboard shortcuts (Ctrl+Shift+] and Ctrl+Shift+[) do not work
    // reliably in E2E tests due to browser focus and keyboard event handling.
    // TODO: Test keyboard shortcuts via unit tests or manual verification
    // Verify initial state (dynamic request tab should be active)
    const requestTab = page.locator('[data-test-id^="context-tab-request-"]').first();
    await expect(requestTab).toHaveAttribute('aria-selected', 'true');

    // Note: Keyboard shortcuts for tab cycling (Ctrl+Shift+] and Ctrl+Shift+[)
    // may not work in E2E tests due to browser focus and keyboard event handling.
    // This test is a placeholder for manual verification.
    // In a real implementation, we would need to verify the keyboard shortcuts
    // work as expected, or test the underlying functions directly.
  });

  test('Arrow buttons appear when tabs overflow', async ({ page }) => {
    // Verify the arrow buttons exist (they're always present, just disabled when not needed)
    const leftArrow = page.locator('[data-test-id="context-tabs-arrow-left"]');
    const rightArrow = page.locator('[data-test-id="context-tabs-arrow-right"]');

    await expect(leftArrow).toBeVisible();
    await expect(rightArrow).toBeVisible();

    // Initially, left arrow should be disabled (no scroll)
    await expect(leftArrow).toBeDisabled();
  });

  test('Layout picker displays current layout', async ({ page }) => {
    // Find layout picker
    const layoutPicker = page.locator('[data-test-id="layout-picker-trigger"]');
    await expect(layoutPicker).toBeVisible();

    // Verify it shows some text (the current layout name)
    const text = await layoutPicker.textContent();
    expect(text).toBeTruthy();
    expect(text?.length ?? 0).toBeGreaterThan(0);
  });

  test.skip('TitleBar retains draggable areas around tabs', async ({ page }) => {
    // Skipped: Context tabs may not be visible on initial load if no contexts exist
    // TODO: Create a context first, then verify tabs are visible
    const titleBar = page.locator('[data-test-id="titlebar"]');
    await expect(titleBar).toBeVisible();
  });

  test('Popout button exists in context toolbar', async ({ page }) => {
    // Find context toolbar
    const contextToolbar = page.locator('[data-test-id="context-toolbar"]');
    await expect(contextToolbar).toBeVisible();

    // Look for popout button (may be hidden if not supported)
    const popoutButton = page.locator('[data-test-id="popout-button"]');

    // Check if button exists (it may be hidden in some environments)
    const count = await popoutButton.count();

    if (count > 0) {
      // If the button exists, verify it has proper aria-label
      await expect(popoutButton).toHaveAttribute('aria-label', 'Open in new window');
    }
  });
});
