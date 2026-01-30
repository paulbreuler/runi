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

    // Wait for the panel to render and React to fully hydrate
    await page.waitForSelector('[data-testid="dockable-panel"]', { timeout: 15000 });
    // Wait for panel to be interactive (buttons are rendered)
    await page.waitForSelector('[role="button"][aria-label*="dock"]', { timeout: 2000 });
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

    // Tab multiple times to reach the left button using waitForFunction
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('dock left')
        );
      },
      { timeout: 5000 }
    );

    // Press Space on the left button to change position
    await page.keyboard.press('Space');

    // Wait for position change using Playwright's built-in retry logic
    await expect(leftButton).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });

    // Verify focus is still on the left button
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('left')
        );
      },
      { timeout: 2000 }
    );
  });

  test('focus remains on button after changing position from left to right', async ({ page }) => {
    // First set position to left using keyboard
    const leftButton = page.getByRole('button', { name: /dock left/i });
    const rightButton = page.getByRole('button', { name: /dock right/i });

    // Navigate to left button with keyboard
    const panelHeader = page.getByTestId('panel-header');
    await panelHeader.click();

    // Tab to left button using waitForFunction
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('dock left')
        );
      },
      { timeout: 5000 }
    );

    // Activate left button
    await page.keyboard.press('Space');

    // Wait for position change
    await expect(leftButton).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });

    // Tab to right button (should be next)
    await page.keyboard.press('Tab');

    // Verify we're on right button using waitForFunction
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('dock right')
        );
      },
      { timeout: 1000 }
    );

    // Press Space to change to right
    await page.keyboard.press('Space');

    // Wait for position change
    await expect(rightButton).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });

    // Verify focus is still on the right button
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('right')
        );
      },
      { timeout: 2000 }
    );
  });

  test('focus restoration works for multiple sequential position changes', async ({ page }) => {
    const bottomButton = page.getByRole('button', { name: /dock bottom/i });
    const leftButton = page.getByRole('button', { name: /dock left/i });
    const rightButton = page.getByRole('button', { name: /dock right/i });

    // Start from bottom
    await expect(bottomButton).toHaveAttribute('aria-pressed', 'true');

    // Helper function to tab to a specific button using waitForFunction
    const tabToButton = async (targetLabel: string): Promise<boolean> => {
      try {
        await page.waitForFunction(
          () => {
            const active = document.activeElement;
            return (
              active instanceof HTMLElement &&
              active.getAttribute('aria-label')?.toLowerCase().includes(targetLabel.toLowerCase())
            );
          },
          { timeout: 5000 }
        );
        return true;
      } catch {
        return false;
      }
    };

    // Start from a neutral position
    const panelHeader = page.getByTestId('panel-header');
    await panelHeader.click();

    // Test 1: Navigate to left button and activate
    const foundLeft = await tabToButton('dock left');
    expect(foundLeft).toBe(true);
    await page.keyboard.press('Space');

    // Wait for position change using Playwright's built-in retry logic
    await expect(leftButton).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });

    // Verify focus on left after position change
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('left')
        );
      },
      { timeout: 2000 }
    );

    // Test 2: Navigate to right button and activate
    await page.keyboard.press('Tab');
    // Wait for focus to move using waitForFunction
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('right')
        );
      },
      { timeout: 1000 }
    );
    await page.keyboard.press('Space');

    // Wait for position change
    await expect(rightButton).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });

    // Verify focus on right after position change
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('right')
        );
      },
      { timeout: 2000 }
    );

    // Test 3: Navigate back to left and verify focus restoration still works
    await page.keyboard.press('Shift+Tab'); // Go back to left button
    // Wait for focus to move back
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('left')
        );
      },
      { timeout: 1000 }
    );
    await page.keyboard.press('Space');

    // Wait for position change
    await expect(leftButton).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });

    // Verify focus on left after position change
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active.getAttribute('aria-label')?.toLowerCase().includes('left')
        );
      },
      { timeout: 2000 }
    );
  });
});
