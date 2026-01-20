import { test, expect } from '@playwright/test';

/**
 * Test focus restoration when changing dock panel positions via keyboard.
 *
 * This test verifies that when using Tab + Space to change dock positions,
 * focus remains on the button that was activated.
 */
test.describe('DockControls Focus Restoration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the FocusRestorationTest story iframe
    // Storybook URL structure: /iframe.html?id=layout-dockablepanel--focus-restoration-test
    await page.goto(
      'http://localhost:6006/iframe.html?id=layout-dockablepanel--focus-restoration-test'
    );

    // Wait for the panel to render
    await page.waitForSelector('[data-testid="dockable-panel"]', { timeout: 15000 });

    // Wait a bit more for React to fully hydrate
    await page.waitForTimeout(500);
  });

  test('focus remains on button after changing position from bottom to left', async ({ page }) => {
    // Find the dock control buttons
    const bottomButton = page.getByRole('button', { name: /dock bottom/i });
    const leftButton = page.getByRole('button', { name: /dock left/i });

    // Verify buttons exist
    await expect(bottomButton).toBeVisible();
    await expect(leftButton).toBeVisible();

    // Start from bottom position (should be active by default)
    await expect(bottomButton).toHaveAttribute('aria-pressed', 'true');

    // Use keyboard navigation: Tab to navigate to the dock controls
    // First, focus somewhere neutral (the panel header)
    const panelHeader = page.getByTestId('panel-header');
    await panelHeader.click();

    // Tab multiple times to reach the left button (may need to pass through other controls)
    // We'll tab until we find a button with "dock" in the label
    let foundLeftButton = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const activeLabel = await page.evaluate(() => {
        const active = document.activeElement;
        return active instanceof HTMLElement ? active.getAttribute('aria-label') : null;
      });

      if (activeLabel?.toLowerCase().includes('dock left')) {
        foundLeftButton = true;
        break;
      }
    }

    expect(foundLeftButton).toBe(true);

    // Press Space on the left button to change position
    await page.keyboard.press('Space');

    // Wait for position change (panel remounts)
    await page.waitForTimeout(800); // Give more time for remount

    // Verify position changed to left
    await expect(leftButton).toHaveAttribute('aria-pressed', 'true');

    // Verify focus is still on the left button
    const activeElementAfter = await page.evaluate(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        return {
          ariaLabel: active.getAttribute('aria-label'),
          tagName: active.tagName,
        };
      }
      return null;
    });

    expect(activeElementAfter).not.toBeNull();
    expect(activeElementAfter?.ariaLabel?.toLowerCase()).toContain('left');
  });

  test('focus remains on button after changing position from left to right', async ({ page }) => {
    // First set position to left using keyboard
    const leftButton = page.getByRole('button', { name: /dock left/i });
    const rightButton = page.getByRole('button', { name: /dock right/i });

    // Navigate to left button with keyboard
    const panelHeader = page.getByTestId('panel-header');
    await panelHeader.click();

    // Tab to left button
    let foundLeftButton = false;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const activeLabel = await page.evaluate(() => {
        const active = document.activeElement;
        return active instanceof HTMLElement ? active.getAttribute('aria-label') : null;
      });

      if (activeLabel?.toLowerCase().includes('dock left')) {
        foundLeftButton = true;
        break;
      }
    }

    expect(foundLeftButton).toBe(true);

    // Activate left button
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);

    // Verify left is active
    await expect(leftButton).toHaveAttribute('aria-pressed', 'true');

    // Tab to right button (should be next)
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Verify we're on right button
    const activeLabelBefore = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLElement ? active.getAttribute('aria-label') : null;
    });
    expect(activeLabelBefore?.toLowerCase()).toContain('right');

    // Press Space to change to right
    await page.keyboard.press('Space');

    // Wait for position change
    await page.waitForTimeout(800);

    // Verify position changed to right
    await expect(rightButton).toHaveAttribute('aria-pressed', 'true');

    // Verify focus is still on the right button
    const activeElement = await page.evaluate(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        return active.getAttribute('aria-label');
      }
      return null;
    });

    expect(activeElement?.toLowerCase()).toContain('right');
  });

  test('focus restoration works for multiple sequential position changes', async ({ page }) => {
    const bottomButton = page.getByRole('button', { name: /dock bottom/i });
    const leftButton = page.getByRole('button', { name: /dock left/i });
    const rightButton = page.getByRole('button', { name: /dock right/i });

    // Start from bottom
    await expect(bottomButton).toHaveAttribute('aria-pressed', 'true');

    // Helper function to tab to a specific button
    const tabToButton = async (targetLabel: string): Promise<boolean> => {
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const activeLabel = await page.evaluate(() => {
          const active = document.activeElement;
          return active instanceof HTMLElement ? active.getAttribute('aria-label') : null;
        });

        if (activeLabel?.toLowerCase().includes(targetLabel.toLowerCase())) {
          return true;
        }
      }
      return false;
    };

    // Start from a neutral position
    const panelHeader = page.getByTestId('panel-header');
    await panelHeader.click();

    // Test 1: Navigate to left button and activate
    const foundLeft = await tabToButton('dock left');
    expect(foundLeft).toBe(true);
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);

    // Verify focus on left after position change
    let activeLabel = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLElement ? active.getAttribute('aria-label') : null;
    });
    expect(activeLabel?.toLowerCase()).toContain('left');
    await expect(leftButton).toHaveAttribute('aria-pressed', 'true');

    // Test 2: Navigate to right button and activate
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);

    // Verify focus on right after position change
    activeLabel = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLElement ? active.getAttribute('aria-label') : null;
    });
    expect(activeLabel?.toLowerCase()).toContain('right');
    await expect(rightButton).toHaveAttribute('aria-pressed', 'true');

    // Test 3: Navigate back to left and verify focus restoration still works
    await page.keyboard.press('Shift+Tab'); // Go back to left button
    await page.waitForTimeout(200);
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);

    // Verify focus on left after position change
    activeLabel = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLElement ? active.getAttribute('aria-label') : null;
    });
    expect(activeLabel?.toLowerCase()).toContain('left');
    await expect(leftButton).toHaveAttribute('aria-pressed', 'true');
  });
});
