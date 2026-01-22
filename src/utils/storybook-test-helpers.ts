/**
 * @file Storybook test helper utilities
 * @description Reusable helpers for keyboard navigation, focus management, and async waits in play functions
 *
 * These utilities are designed to work with @storybook/test and provide common
 * patterns for testing component interactions in Storybook stories.
 *
 * Note: When used in Storybook play functions, you can use userEvent from @storybook/test
 * to tab, but these utilities work with native DOM APIs for maximum compatibility.
 */

/**
 * Tabs through focusable elements until the target element receives focus.
 *
 * This function simulates tab navigation by programmatically moving focus
 * through focusable elements. It works in both Storybook play functions
 * and unit tests without requiring userEvent.
 *
 * @param target - The target element to focus
 * @param maxTabs - Maximum number of tabs to attempt (default: 10)
 * @returns Promise that resolves to true if target was focused, false otherwise
 *
 * @example
 * ```tsx
 * // In Storybook play function:
 * const button = canvas.getByTestId('submit-button');
 * const focused = await tabToElement(button, 5);
 * expect(focused).toBe(true);
 * ```
 */
export async function tabToElement(target: HTMLElement, maxTabs = 10): Promise<boolean> {
  // Check if already focused
  if (document.activeElement === target) {
    return true;
  }

  // Get all focusable elements in document order
  const focusableSelector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const allElements = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector));

  // Filter out hidden elements
  const focusableElements = allElements.filter((el) => {
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' && style.visibility !== 'hidden' && !el.hasAttribute('disabled')
    );
  });

  // Find target in focusable elements
  const targetIndex = focusableElements.findIndex((el) => el === target);
  if (targetIndex === -1) {
    // Target is not in focusable elements
    return false;
  }

  // Find current focus index
  let currentIndex = focusableElements.findIndex((el) => el === document.activeElement);

  // If no current focus, start from beginning
  if (currentIndex === -1) {
    currentIndex = -1; // Will start at index 0
  }

  // Calculate tabs needed (handle wrapping)
  let tabsAttempted = 0;
  let currentIdx = currentIndex;

  while (tabsAttempted < maxTabs) {
    // Move to next element (with wrapping)
    currentIdx = (currentIdx + 1) % focusableElements.length;

    // Focus the element
    focusableElements[currentIdx]?.focus();

    // Small delay to allow focus to settle
    await new Promise((resolve) => setTimeout(resolve, 10));

    tabsAttempted++;

    // Check if we've reached the target
    if (document.activeElement === target) {
      return true;
    }

    // If we've wrapped around and haven't found it, give up
    if (currentIdx === currentIndex && tabsAttempted > 0) {
      break;
    }
  }

  return document.activeElement === target;
}

/**
 * Waits for an element to receive focus.
 *
 * Uses polling to check if the element has focus, resolving when it does
 * or rejecting if the timeout is exceeded.
 *
 * @param element - The element to wait for focus on
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise that resolves when element has focus, rejects on timeout
 *
 * @example
 * ```tsx
 * const button = canvas.getByTestId('submit-button');
 * button.click();
 * await waitForFocus(button, 1000);
 * expect(button).toHaveFocus();
 * ```
 */
export async function waitForFocus(element: HTMLElement, timeout = 5000): Promise<void> {
  const startTime = Date.now();

  return new Promise<void>((resolve, reject) => {
    const checkFocus = (): void => {
      if (document.activeElement === element) {
        resolve();
        return;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed >= timeout) {
        reject(new Error(`Element did not receive focus within ${String(timeout)}ms`));
        return;
      }

      // Use requestAnimationFrame for efficient polling
      requestAnimationFrame(checkFocus);
    };

    checkFocus();
  });
}

/**
 * Waits for an element to be removed from the DOM and then re-added (remount).
 *
 * Uses MutationObserver to detect when an element matching the selector is
 * removed and then re-added to the DOM.
 *
 * @param selector - CSS selector for the element to watch
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise that resolves when element remounts, rejects on timeout
 *
 * @example
 * ```tsx
 * // Component remounts after state change
 * await userEvent.click(canvas.getByTestId('reset-button'));
 * await waitForRemount('[data-test-id="form"]', 2000);
 * ```
 */
export async function waitForRemount(selector: string, timeout = 5000): Promise<void> {
  const startTime = Date.now();

  return new Promise<void>((resolve, reject) => {
    // First, verify element exists
    const initialElement = document.querySelector(selector);
    if (initialElement === null) {
      reject(new Error(`Element with selector "${selector}" not found initially`));
      return;
    }

    let wasRemoved = false;

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);

      if (element === null && !wasRemoved) {
        // Element was removed
        wasRemoved = true;
        return;
      }

      if (element !== null && wasRemoved) {
        // Element was re-added after removal
        observer.disconnect();
        resolve();
        return;
      }

      // Check timeout
      const elapsed = Date.now() - startTime;
      if (elapsed >= timeout) {
        observer.disconnect();
        reject(
          new Error(
            `Element with selector "${selector}" did not remount within ${String(timeout)}ms`
          )
        );
      }
    });

    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also set a timeout as a fallback
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      if (!wasRemoved) {
        reject(
          new Error(
            `Element with selector "${selector}" was not removed within ${String(timeout)}ms`
          )
        );
      } else {
        reject(
          new Error(
            `Element with selector "${selector}" did not remount within ${String(timeout)}ms`
          )
        );
      }
    }, timeout);

    // Clean up timeout if promise resolves
    void Promise.resolve().then(() => {
      clearTimeout(timeoutId);
    });
  });
}

/**
 * Waits for a state value to match an expected value by polling a getter function.
 *
 * Uses requestAnimationFrame for efficient polling. Compares values using
 * deep equality (JSON.stringify) for objects.
 *
 * @param getState - Function that returns the current state
 * @param expected - The expected state value
 * @param timeout - Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise that resolves when state matches, rejects on timeout
 *
 * @example
 * ```tsx
 * let count = 0;
 * const getCount = () => count;
 *
 * // Update count asynchronously
 * setTimeout(() => { count = 5; }, 100);
 *
 * await waitForState(getCount, 5, 1000);
 * expect(count).toBe(5);
 * ```
 */
export async function waitForState<T>(
  getState: () => T,
  expected: T,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();

  return new Promise<void>((resolve, reject) => {
    const checkState = (): void => {
      const current = getState();

      // Deep equality check for objects/arrays
      const currentStr = JSON.stringify(current);
      const expectedStr = JSON.stringify(expected);

      if (currentStr === expectedStr) {
        resolve();
        return;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed >= timeout) {
        reject(
          new Error(
            `State did not match expected value within ${String(timeout)}ms. Current: ${currentStr}, Expected: ${expectedStr}`
          )
        );
        return;
      }

      // Use requestAnimationFrame for efficient polling
      requestAnimationFrame(checkState);
    };

    checkState();
  });
}
