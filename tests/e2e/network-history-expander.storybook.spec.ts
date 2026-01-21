import { test, expect, type Page, type Locator } from '@playwright/test';

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

// Storybook URL can be configured via STORYBOOK_URL environment variable for CI/CD
const STORYBOOK_BASE_URL = process.env.STORYBOOK_URL ?? 'http://localhost:6006';

/** Test selectors for Network History Panel */
const selectors = {
  virtualDatagrid: '[data-testid="virtual-datagrid"]',
  expandButton: '[data-testid="expand-button"]',
  expandedSection: '[data-testid="expanded-section"]',
  expandedPanel: '[data-testid="expanded-panel"]',
  expandedTabsList: '[data-testid="expanded-tabs-list"]',
} as const;

/** Helper to get common locators for a page */
const getLocators = (
  page: Page
): {
  expandButtons: Locator;
  expandedSection: Locator;
  expandedPanel: Locator;
  tabsList: Locator;
} => ({
  expandButtons: page.locator(selectors.expandButton),
  expandedSection: page.locator(selectors.expandedSection),
  expandedPanel: page.locator(selectors.expandedPanel),
  tabsList: page.locator(selectors.expandedTabsList),
});

test.describe('Network History Panel Expander', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the ExpanderTest story iframe
    await page.goto(
      `${STORYBOOK_BASE_URL}/iframe.html?id=components-history-networkhistorypanel--expander-test`
    );

    // Wait for the panel to render and React to fully hydrate
    await page.waitForSelector(selectors.virtualDatagrid, { timeout: 15000 });
    // Wait for at least one expander button to exist (may not be visible due to virtualization)
    const { expandButtons } = getLocators(page);
    await expandButtons.first().waitFor({ state: 'attached', timeout: 5000 });
  });

  test('expander works on first row', async ({ page }) => {
    const { expandButtons, expandedPanel, tabsList } = getLocators(page);
    const count = await expandButtons.count();
    expect(count).toBeGreaterThan(0);

    // Get the first expander button
    const firstButton = expandButtons.first();

    // Use JavaScript click to bypass viewport issues with virtualized content
    await firstButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for expanded content to appear
    await page.waitForSelector(selectors.expandedSection, { timeout: 2000 });

    // Verify expanded panel and tabs are visible
    await expect(expandedPanel).toBeVisible();
    await expect(tabsList).toBeVisible();
  });

  test('expander works on second row', async ({ page }) => {
    const { expandButtons, expandedPanel } = getLocators(page);
    const count = await expandButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Get the second expander button (index 1)
    const secondButton = expandButtons.nth(1);

    // Use JavaScript click to bypass viewport issues
    await secondButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for expanded content to appear
    await page.waitForSelector(selectors.expandedSection, { timeout: 2000 });

    // Verify expanded panel is visible
    await expect(expandedPanel).toBeVisible();
  });

  test('expander works on third row', async ({ page }) => {
    const { expandButtons, expandedPanel } = getLocators(page);
    const count = await expandButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Get the third expander button (index 2)
    const thirdButton = expandButtons.nth(2);
    await expect(thirdButton).toBeVisible();

    // Click the third expander
    await thirdButton.click();

    // Wait for expanded content to appear
    await page.waitForSelector(selectors.expandedSection, { timeout: 2000 });

    // Verify expanded panel is visible
    await expect(expandedPanel).toBeVisible();
  });

  test('expander works on last row', async ({ page }) => {
    const { expandButtons, expandedPanel } = getLocators(page);
    const count = await expandButtons.count();
    expect(count).toBeGreaterThan(0);

    // Get the last expander button
    const lastButton = expandButtons.last();

    // Use JavaScript click to bypass viewport issues
    await lastButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for expanded content to appear
    await page.waitForSelector(selectors.expandedSection, { timeout: 2000 });

    // Verify expanded panel is visible
    await expect(expandedPanel).toBeVisible();
  });

  test('only one row can be expanded at a time', async ({ page }) => {
    const { expandButtons, expandedSection } = getLocators(page);
    const count = await expandButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Expand first row
    const firstButton = expandButtons.first();
    await firstButton.evaluate((el) => (el as HTMLElement).click());
    await page.waitForSelector(selectors.expandedSection, { timeout: 2000 });

    // Count expanded sections (should be 1)
    let expandedCount = await expandedSection.count();
    expect(expandedCount).toBe(1);

    // Expand second row
    const secondButton = expandButtons.nth(1);
    await secondButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for expanded section to stabilize (first collapses, second expands)
    await expect(expandedSection).toHaveCount(1);

    // Count expanded sections (should still be 1, first should collapse)
    expandedCount = await expandedSection.count();
    expect(expandedCount).toBe(1);
  });

  test('clicking same expander again collapses the row', async ({ page }) => {
    const { expandButtons, expandedPanel, expandedSection } = getLocators(page);
    const firstButton = expandButtons.first();
    await expect(firstButton).toBeVisible();

    // Expand first row
    await firstButton.evaluate((el) => (el as HTMLElement).click());
    await page.waitForSelector(selectors.expandedSection, { timeout: 2000 });

    // Verify expanded
    await expect(expandedPanel).toBeVisible();

    // Click again to collapse
    await firstButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for expanded section to be removed (deterministic wait)
    await expect(expandedSection).toHaveCount(0);
  });

  test('expanded panel shows tabs', async ({ page }) => {
    const { expandButtons, tabsList } = getLocators(page);
    const firstButton = expandButtons.first();
    await firstButton.click();

    // Wait for expanded content
    await page.waitForSelector(selectors.expandedPanel, { timeout: 2000 });

    // Verify tabs list is visible
    await expect(tabsList).toBeVisible();

    // Verify tab buttons are present (should have at least Timing, Response, Headers tabs)
    const tabButtons = tabsList.locator('button[role="tab"]');
    const tabCount = await tabButtons.count();
    expect(tabCount).toBeGreaterThanOrEqual(3);
  });

  test('can expand different rows sequentially', async ({ page }) => {
    const { expandButtons, expandedPanel, expandedSection } = getLocators(page);
    const count = await expandButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Expand first row
    const firstBtn = expandButtons.first();
    await firstBtn.evaluate((el) => (el as HTMLElement).click());
    await page.waitForSelector(selectors.expandedSection, { timeout: 2000 });
    await expect(expandedPanel).toBeVisible();

    // Expand second row (first should collapse)
    const secondBtn = expandButtons.nth(1);
    await secondBtn.evaluate((el) => (el as HTMLElement).click());
    // Wait for transition to stabilize - only one expanded section should exist
    await expect(expandedSection).toHaveCount(1);
    await expect(expandedPanel).toBeVisible();

    // Expand third row (second should collapse)
    const thirdBtn = expandButtons.nth(2);
    await thirdBtn.evaluate((el) => (el as HTMLElement).click());
    // Wait for transition to stabilize - only one expanded section should exist
    await expect(expandedSection).toHaveCount(1);
    await expect(expandedPanel).toBeVisible();
  });
});
