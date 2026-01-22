/**
 * @file Tests for Storybook test helper utilities
 * @description Tests for keyboard navigation, focus management, and async wait utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tabToElement, waitForFocus, waitForRemount, waitForState } from './storybook-test-helpers';

describe('storybook-test-helpers', () => {
  let container: HTMLDivElement;
  let button1: HTMLButtonElement;
  let button2: HTMLButtonElement;
  let button3: HTMLButtonElement;

  beforeEach(() => {
    // Create a test container with multiple focusable elements
    container = document.createElement('div');
    document.body.appendChild(container);

    button1 = document.createElement('button');
    button1.textContent = 'Button 1';
    button1.setAttribute('data-test-id', 'button-1');
    container.appendChild(button1);

    button2 = document.createElement('button');
    button2.textContent = 'Button 2';
    button2.setAttribute('data-test-id', 'button-2');
    container.appendChild(button2);

    button3 = document.createElement('button');
    button3.textContent = 'Button 3';
    button3.setAttribute('data-test-id', 'button-3');
    container.appendChild(button3);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('tabToElement', () => {
    it('should tab to target element within maxTabs', async () => {
      // Start focus on button1
      button1.focus();

      const result = await tabToElement(button2, 5);

      expect(result).toBe(true);
      expect(document.activeElement).toBe(button2);
    });

    it('should return false if target not reached within maxTabs', async () => {
      // Start focus on button1
      button1.focus();

      // Try to tab to button3 with only 1 tab (not enough - need 2 tabs)
      const result = await tabToElement(button3, 1);

      expect(result).toBe(false);
      expect(document.activeElement).not.toBe(button3);
    });

    it('should handle immediate focus match', async () => {
      // Start focus on button2
      button2.focus();

      const result = await tabToElement(button2, 5);

      expect(result).toBe(true);
      expect(document.activeElement).toBe(button2);
    });

    it('should use default maxTabs of 10', async () => {
      button1.focus();

      const result = await tabToElement(button2, undefined);

      expect(result).toBe(true);
      expect(document.activeElement).toBe(button2);
    });

    it('should work when starting with no focus', async () => {
      // Clear focus
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const result = await tabToElement(button1, 5);

      expect(result).toBe(true);
      expect(document.activeElement).toBe(button1);
    });
  });

  describe('waitForFocus', () => {
    it('should resolve when element receives focus', async () => {
      const promise = waitForFocus(button1, 1000);

      // Simulate focus after a short delay
      setTimeout(() => {
        button1.focus();
      }, 50);

      await expect(promise).resolves.not.toThrow();
    });

    it('should reject if element does not receive focus within timeout', async () => {
      const promise = waitForFocus(button1, 100);

      // Never focus the element

      await expect(promise).rejects.toThrow();
    }, 200);

    it('should use default timeout of 5000ms', async () => {
      const promise = waitForFocus(button1, undefined);

      setTimeout(() => {
        button1.focus();
      }, 50);

      await expect(promise).resolves.not.toThrow();
    });
  });

  describe('waitForRemount', () => {
    it('should resolve when element is removed and re-added', async () => {
      const selector = '[data-test-id="button-1"]';
      const promise = waitForRemount(selector, 1000);

      // Remove and re-add the element
      setTimeout(() => {
        container.removeChild(button1);
        setTimeout(() => {
          container.appendChild(button1);
        }, 50);
      }, 50);

      await expect(promise).resolves.not.toThrow();
    });

    it('should reject if element does not remount within timeout', async () => {
      const selector = '[data-test-id="button-1"]';
      const promise = waitForRemount(selector, 100);

      // Remove but never re-add
      setTimeout(() => {
        container.removeChild(button1);
      }, 50);

      await expect(promise).rejects.toThrow();
    }, 200);

    it('should use default timeout of 5000ms', async () => {
      const selector = '[data-test-id="button-1"]';
      const promise = waitForRemount(selector, undefined);

      setTimeout(() => {
        container.removeChild(button1);
        setTimeout(() => {
          container.appendChild(button1);
        }, 50);
      }, 50);

      await expect(promise).resolves.not.toThrow();
    });
  });

  describe('waitForState', () => {
    it('should resolve when state matches expected value', async () => {
      let state = 0;
      const getState = (): number => state;

      const promise = waitForState(getState, 5, 1000);

      // Update state after a delay
      setTimeout(() => {
        state = 5;
      }, 50);

      await expect(promise).resolves.not.toThrow();
    });

    it('should reject if state does not match within timeout', async () => {
      const state = { value: 0 };
      const getState = (): { value: number } => state;

      const promise = waitForState(getState, { value: 5 }, 100);

      // Never update state

      await expect(promise).rejects.toThrow();
    }, 200);

    it('should work with object state', async () => {
      interface TestState {
        count: number;
        name: string;
      }

      let state: TestState = { count: 0, name: 'initial' };
      const getState = (): TestState => state;

      const expected: TestState = { count: 10, name: 'updated' };
      const promise = waitForState(getState, expected, 1000);

      setTimeout(() => {
        state = { count: 10, name: 'updated' };
      }, 50);

      await expect(promise).resolves.not.toThrow();
    });

    it('should use default timeout of 5000ms', async () => {
      let state = 0;
      const getState = (): number => state;

      const promise = waitForState(getState, 5, undefined);

      setTimeout(() => {
        state = 5;
      }, 50);

      await expect(promise).resolves.not.toThrow();
    });
  });
});
