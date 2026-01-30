/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Accessibility utilities tests
 * @description Tests for focus ring classes and useFocusVisible hook
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { focusRingClasses, useFocusVisible } from './accessibility';

describe('accessibility utilities', () => {
  describe('focusRingClasses', () => {
    it('contains standard focus ring classes', () => {
      expect(focusRingClasses).toContain('outline-none');
      expect(focusRingClasses).toContain('focus-visible:ring-2');
      expect(focusRingClasses).toContain('focus-visible:ring-[color:var(--color-ring)]');
      expect(focusRingClasses).toContain('focus-visible:ring-offset-2');
      expect(focusRingClasses).toContain('focus-visible:ring-offset-bg-app');
    });

    it('uses the theme ring token for focus ring color', () => {
      expect(focusRingClasses).toContain('color-ring');
      expect(focusRingClasses).not.toContain('accent-purple');
    });

    it('contains data-focus-visible-added selectors for programmatic focus', () => {
      // These selectors ensure arrow key navigation shows the same focus ring as Tab
      expect(focusRingClasses).toContain('[&[data-focus-visible-added]:focus]:ring-2');
      expect(focusRingClasses).toContain(
        '[&[data-focus-visible-added]:focus]:ring-[color:var(--color-ring)]'
      );
      expect(focusRingClasses).toContain('[&[data-focus-visible-added]:focus]:ring-offset-2');
      expect(focusRingClasses).toContain('[&[data-focus-visible-added]:focus]:ring-offset-bg-app');
    });

    it('has matching selectors for both focus-visible and data-focus-visible-added', () => {
      // Verify both selector types have the same ring properties
      const hasFocusVisibleRing2 = focusRingClasses.includes('focus-visible:ring-2');
      const hasDataAttrRing2 = focusRingClasses.includes(
        '[&[data-focus-visible-added]:focus]:ring-2'
      );
      expect(hasFocusVisibleRing2).toBe(true);
      expect(hasDataAttrRing2).toBe(true);

      const hasFocusVisibleColor = focusRingClasses.includes(
        'focus-visible:ring-[color:var(--color-ring)]'
      );
      const hasDataAttrColor = focusRingClasses.includes(
        '[&[data-focus-visible-added]:focus]:ring-[color:var(--color-ring)]'
      );
      expect(hasFocusVisibleColor).toBe(true);
      expect(hasDataAttrColor).toBe(true);
    });
  });

  describe('useFocusVisible', () => {
    it('returns false initially when no element is focused', () => {
      const TestComponent = (): React.ReactElement => {
        const containerRef = React.useRef<HTMLDivElement>(null);
        const isVisible = useFocusVisible(containerRef);

        return (
          <div ref={containerRef} data-testid="container">
            <button data-testid="button">Click me</button>
            {isVisible && <span data-testid="visible-indicator">Visible</span>}
          </div>
        );
      };

      render(<TestComponent />);

      // Initially not visible
      expect(screen.queryByTestId('visible-indicator')).not.toBeInTheDocument();
    });

    it('returns true when a child element is focused', () => {
      const TestComponent = (): React.ReactElement => {
        const containerRef = React.useRef<HTMLDivElement>(null);
        const isVisible = useFocusVisible(containerRef);

        return (
          <div ref={containerRef} data-testid="container">
            <button data-testid="button">Click me</button>
            {isVisible && <span data-testid="visible-indicator">Visible</span>}
          </div>
        );
      };

      render(<TestComponent />);

      const button = screen.getByTestId('button');
      act(() => {
        button.focus();
      });

      // Should be visible when button is focused
      expect(screen.getByTestId('visible-indicator')).toBeInTheDocument();
    });

    it('returns false when focus moves outside the container', () => {
      const TestComponent = (): React.ReactElement => {
        const containerRef = React.useRef<HTMLDivElement>(null);
        const isVisible = useFocusVisible(containerRef);

        return (
          <>
            <div ref={containerRef} data-testid="container">
              <button data-testid="button-inside">Inside</button>
              {isVisible && <span data-testid="visible-indicator">Visible</span>}
            </div>
            <button data-testid="button-outside">Outside</button>
          </>
        );
      };

      render(<TestComponent />);

      const buttonInside = screen.getByTestId('button-inside');
      const buttonOutside = screen.getByTestId('button-outside');

      // Focus inside
      act(() => {
        buttonInside.focus();
      });
      expect(screen.getByTestId('visible-indicator')).toBeInTheDocument();

      // Focus outside
      act(() => {
        buttonOutside.focus();
      });
      expect(screen.queryByTestId('visible-indicator')).not.toBeInTheDocument();
    });

    it('returns true when focus moves between elements within the container', () => {
      const TestComponent = (): React.ReactElement => {
        const containerRef = React.useRef<HTMLDivElement>(null);
        const isVisible = useFocusVisible(containerRef);

        return (
          <div ref={containerRef} data-testid="container">
            <button data-testid="button-1">Button 1</button>
            <button data-testid="button-2">Button 2</button>
            {isVisible && <span data-testid="visible-indicator">Visible</span>}
          </div>
        );
      };

      render(<TestComponent />);

      const button1 = screen.getByTestId('button-1');
      const button2 = screen.getByTestId('button-2');

      // Focus first button
      act(() => {
        button1.focus();
      });
      expect(screen.getByTestId('visible-indicator')).toBeInTheDocument();

      // Focus second button (still within container)
      act(() => {
        button2.focus();
      });
      // Should still be visible
      expect(screen.getByTestId('visible-indicator')).toBeInTheDocument();
    });

    it('cleans up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(HTMLElement.prototype, 'removeEventListener');

      const TestComponent = (): React.ReactElement => {
        const containerRef = React.useRef<HTMLDivElement>(null);
        useFocusVisible(containerRef);

        return (
          <div ref={containerRef} data-testid="container">
            <button>Click me</button>
          </div>
        );
      };

      const { unmount } = render(<TestComponent />);

      // Should have added listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith('focusin', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('focusout', expect.any(Function));

      unmount();

      // Should have removed listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focusin', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focusout', expect.any(Function));

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});
