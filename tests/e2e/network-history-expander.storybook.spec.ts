import { test, expect } from '@playwright/test';

/**
 * Test expander functionality in Network History Panel.
 *
 * This test verifies that:
 * - Expander buttons work on ALL rows, not just the last one
 * - Clicking an expander on any row expands that row
 * - Only one row can be expanded at a time
 * - Expanded content (ExpandedPanel) is visible when a row is expanded
 * - Clicking the same expander again collapses the row
 */
test.describe('Network History Panel Expander', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the ExpanderTest story iframe
    // Storybook URL structure: /iframe.html?id=components-history-networkhistorypanel--expander-test
    await page.goto(
      'http://localhost:6006/iframe.html?id=components-history-networkhistorypanel--expander-test'
    );

    // Wait for the panel to render and React to fully hydrate
    await page.waitForSelector('[data-testid="virtual-datagrid"]', { timeout: 15000 });
    // Wait for at least one expander button to exist (may not be visible due to virtualization)
    const expandButtons = page.locator('[data-testid="expand-button"]');
    await expandButtons.first().waitFor({ state: 'attached', timeout: 5000 });
  });

  test('expander works on first row', async ({ page }) => {
    // Find all expander buttons
    const expandButtons = page.locator('[data-testid="expand-button"]');
    const count = await expandButtons.count();
    expect(count).toBeGreaterThan(0);

    // Get the first expander button
    const firstButton = expandButtons.first();

    // Use JavaScript click to bypass viewport issues with virtualized content
    await firstButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for expanded content to appear
    await page.waitForSelector('[data-testid="expanded-section"]', { timeout: 2000 });

    // Verify expanded panel is visible
    const expandedPanel = page.locator('[data-testid="expanded-panel"]');
    await expect(expandedPanel).toBeVisible();

    // Verify tabs are visible in the expanded panel
    const tabsList = page.locator('[data-testid="expanded-tabs-list"]');
    await expect(tabsList).toBeVisible();
  });

  test('expander works on second row', async ({ page }) => {
    const expandButtons = page.locator('[data-testid="expand-button"]');
    const count = await expandButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Get the second expander button (index 1)
    const secondButton = expandButtons.nth(1);

    // Use JavaScript click to bypass viewport issues
    await secondButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for expanded content to appear
    await page.waitForSelector('[data-testid="expanded-section"]', { timeout: 2000 });

    // Verify expanded panel is visible
    const expandedPanel = page.locator('[data-testid="expanded-panel"]');
    await expect(expandedPanel).toBeVisible();
  });

  test('expander works on third row', async ({ page }) => {
    const expandButtons = page.locator('[data-testid="expand-button"]');
    const count = await expandButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Get the third expander button (index 2)
    const thirdButton = expandButtons.nth(2);
    await expect(thirdButton).toBeVisible();

    // Click the third expander
    await thirdButton.click();

    // Wait for expanded content to appear
    await page.waitForSelector('[data-testid="expanded-section"]', { timeout: 2000 });

    // Verify expanded panel is visible
    const expandedPanel = page.locator('[data-testid="expanded-panel"]');
    await expect(expandedPanel).toBeVisible();
  });

  test('expander works on last row', async ({ page }) => {
    const expandButtons = page.locator('[data-testid="expand-button"]');
    const count = await expandButtons.count();
    expect(count).toBeGreaterThan(0);

    // Get the last expander button
    const lastButton = expandButtons.last();

    // Use JavaScript click to bypass viewport issues
    await lastButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for expanded content to appear
    await page.waitForSelector('[data-testid="expanded-section"]', { timeout: 2000 });

    // Verify expanded panel is visible
    const expandedPanel = page.locator('[data-testid="expanded-panel"]');
    await expect(expandedPanel).toBeVisible();
  });

  test('only one row can be expanded at a time', async ({ page }) => {
    const expandButtons = page.locator('[data-testid="expand-button"]');
    const count = await expandButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Expand first row
    const firstButton = expandButtons.first();
    await firstButton.evaluate((el) => (el as HTMLElement).click());
    await page.waitForSelector('[data-testid="expanded-section"]', { timeout: 2000 });

    // Count expanded sections (should be 1)
    let expandedSections = page.locator('[data-testid="expanded-section"]');
    let expandedCount = await expandedSections.count();
    expect(expandedCount).toBe(1);

    // Expand second row
    const secondButton = expandButtons.nth(1);
    await secondButton.evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(300); // Wait for collapse animation

    // Count expanded sections (should still be 1, first should collapse)
    expandedSections = page.locator('[data-testid="expanded-section"]');
    expandedCount = await expandedSections.count();
    expect(expandedCount).toBe(1);
  });

  test('clicking same expander again collapses the row', async ({ page }) => {
    const expandButtons = page.locator('[data-testid="expand-button"]');
    const firstButton = expandButtons.first();
    await expect(firstButton).toBeVisible();

    // Expand first row
    await firstButton.evaluate((el) => (el as HTMLElement).click());
    await page.waitForSelector('[data-testid="expanded-section"]', { timeout: 2000 });

    // Verify expanded
    let expandedPanel = page.locator('[data-testid="expanded-panel"]');
    await expect(expandedPanel).toBeVisible();

    // Click again to collapse
    await firstButton.evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(300); // Wait for collapse animation

    // Verify collapsed (expanded section should not be visible)
    const expandedSections = page.locator('[data-testid="expanded-section"]');
    const expandedCount = await expandedSections.count();
    expect(expandedCount).toBe(0);
  });

  test('expanded panel shows tabs', async ({ page }) => {
    const expandButtons = page.locator('[data-testid="expand-button"]');
    const firstButton = expandButtons.first();
    await firstButton.click();

    // Wait for expanded content
    await page.waitForSelector('[data-testid="expanded-panel"]', { timeout: 2000 });

    // Verify tabs list is visible
    const tabsList = page.locator('[data-testid="expanded-tabs-list"]');
    await expect(tabsList).toBeVisible();

    // Verify tab buttons are present (should have at least Timing, Response, Headers tabs)
    const tabButtons = tabsList.locator('button[role="tab"]');
    const tabCount = await tabButtons.count();
    expect(tabCount).toBeGreaterThanOrEqual(3);
  });

  test('can expand different rows sequentially', async ({ page }) => {
    const expandButtons = page.locator('[data-testid="expand-button"]');
    const count = await expandButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Expand first row
    const firstBtn = expandButtons.first();
    await firstBtn.evaluate((el) => (el as HTMLElement).click());
    await page.waitForSelector('[data-testid="expanded-section"]', { timeout: 2000 });
    let expandedPanel = page.locator('[data-testid="expanded-panel"]');
    await expect(expandedPanel).toBeVisible();

    // Expand second row (first should collapse)
    const secondBtn = expandButtons.nth(1);
    await secondBtn.evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(300);
    expandedPanel = page.locator('[data-testid="expanded-panel"]');
    await expect(expandedPanel).toBeVisible();

    // Expand third row (second should collapse)
    const thirdBtn = expandButtons.nth(2);
    await thirdBtn.evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(300);
    expandedPanel = page.locator('[data-testid="expanded-panel"]');
    await expect(expandedPanel).toBeVisible();
  });
});
