/**
 * E2E test helpers for panel operations.
 *
 * Provides reliable methods to open/close panels that work consistently
 * in both local and CI environments.
 */

import type { Page } from '@playwright/test';

/**
 * Opens the DevTools panel using the most reliable method available.
 *
 * Uses direct keyboard event dispatch (more reliable than page.keyboard.press in CI).
 * Automatically detects platform (Mac vs Linux/Windows) and uses correct modifiers.
 * Returns true if panel was opened successfully, false if it couldn't be opened.
 */
export async function openPanel(page: Page): Promise<boolean> {
  // Helper function to try opening panel with specific modifiers
  const tryOpenPanel = async (metaKey: boolean, ctrlKey: boolean): Promise<boolean> => {
    const panelOpened = await page.evaluate(
      ({ meta, ctrl }) => {
        // Dispatch keyboard event with specified modifiers
        const event = new KeyboardEvent('keydown', {
          key: 'i',
          code: 'KeyI',
          keyCode: 73,
          which: 73,
          metaKey: meta,
          ctrlKey: ctrl,
          shiftKey: true,
          altKey: false,
          bubbles: true,
          cancelable: true,
        });

        // Dispatch to window (where the keyboard handler listens)
        window.dispatchEvent(event);

        // Wait briefly for React state update
        return new Promise<boolean>((resolve) => {
          setTimeout(() => {
            const panel = document.querySelector('[data-testid="dockable-panel"]');
            resolve(panel !== null);
          }, 150);
        });
      },
      { meta: metaKey, ctrl: ctrlKey }
    );

    if (panelOpened) {
      try {
        await page.waitForSelector('[data-testid="dockable-panel"]', { timeout: 3000 });
        return true;
      } catch {
        return false;
      }
    }

    return false;
  };

  // Detect platform and try platform-appropriate shortcut first
  // Mac: Meta+Shift+I, Linux/Windows: Ctrl+Shift+I
  const isMac = await page.evaluate(() => {
    const userAgentData = (navigator as unknown as { userAgentData?: { platform?: string } })
      .userAgentData;
    const userAgent = navigator.userAgent.toLowerCase();
    return (
      (userAgentData?.platform?.toLowerCase().includes('mac') ?? false) ||
      userAgent.includes('macintosh') ||
      userAgent.includes('mac os x')
    );
  });

  // Try platform-appropriate shortcut first
  const opened = await tryOpenPanel(isMac, !isMac);

  if (opened) {
    return true;
  }

  // Fallback: try the other platform's shortcut (handles edge cases where detection is wrong)
  return tryOpenPanel(!isMac, isMac);
}

/**
 * Checks if we're running in CI environment where keyboard shortcuts might not work reliably.
 */
export function isCI(): boolean {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}
