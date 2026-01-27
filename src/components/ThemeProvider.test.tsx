/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeProvider';

describe('ThemeProvider', () => {
  // Clean up document.documentElement after each test
  beforeEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-accent-color');
    document.documentElement.removeAttribute('data-gray-color');
    document.documentElement.removeAttribute('data-has-background');
  });

  afterEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-accent-color');
    document.documentElement.removeAttribute('data-gray-color');
    document.documentElement.removeAttribute('data-has-background');
  });

  describe('theme class on document root', () => {
    it('applies dark class to document.documentElement by default', () => {
      render(
        <ThemeProvider>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('applies light class to document.documentElement when appearance is light', () => {
      render(
        <ThemeProvider appearance="light">
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('light')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('applies no theme class when appearance is inherit', () => {
      render(
        <ThemeProvider appearance="inherit">
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('cleans up theme class on unmount', () => {
      const { unmount } = render(
        <ThemeProvider appearance="dark">
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      unmount();

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('data attributes on document root', () => {
    it('sets data-accent-color on document.documentElement', () => {
      render(
        <ThemeProvider accentColor="blue">
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.getAttribute('data-accent-color')).toBe('blue');
    });

    it('sets data-gray-color on document.documentElement', () => {
      render(
        <ThemeProvider grayColor="gray">
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.getAttribute('data-gray-color')).toBe('gray');
    });

    it('sets data-has-background on document.documentElement', () => {
      render(
        <ThemeProvider hasBackground={true}>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.getAttribute('data-has-background')).toBe('true');
    });

    it('sets data-has-background to false when disabled', () => {
      render(
        <ThemeProvider hasBackground={false}>
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.getAttribute('data-has-background')).toBe('false');
    });

    it('cleans up data attributes on unmount', () => {
      const { unmount } = render(
        <ThemeProvider accentColor="blue" grayColor="gray">
          <div>Test</div>
        </ThemeProvider>
      );

      expect(document.documentElement.getAttribute('data-accent-color')).toBe('blue');

      unmount();

      expect(document.documentElement.getAttribute('data-accent-color')).toBeNull();
      expect(document.documentElement.getAttribute('data-gray-color')).toBeNull();
    });
  });

  describe('renders children', () => {
    it('renders children without wrapper div', () => {
      render(
        <ThemeProvider>
          <div data-testid="child">Child Content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
  });

  describe('useTheme hook', () => {
    it('returns theme context values', () => {
      const wrapper = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
        <ThemeProvider appearance="dark" accentColor="blue" grayColor="gray">
          {children}
        </ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.appearance).toBe('dark');
      expect(result.current.accentColor).toBe('blue');
      expect(result.current.grayColor).toBe('gray');
    });

    it('throws error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = (): void => {};

      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within ThemeProvider');

      console.error = originalError;
    });

    it('returns light appearance when set', () => {
      const wrapper = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
        <ThemeProvider appearance="light">{children}</ThemeProvider>
      );

      const { result } = renderHook(() => useTheme(), { wrapper });

      expect(result.current.appearance).toBe('light');
    });
  });
});
