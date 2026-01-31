/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Configure Testing Library to use data-test-id instead of data-testid
configure({ testIdAttribute: 'data-test-id' });

// Mock Base UI ScrollArea to pass through children in tests
// ScrollArea.Viewport uses refs that don't work well in JSDOM
vi.mock('@base-ui/react/scroll-area', () => ({
  ScrollArea: {
    Root: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className="scroll-area-root" {...props}>
        {children}
      </div>
    ),
    Viewport: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className="scroll-area-viewport" {...props}>
        {children}
      </div>
    ),
    Content: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className="scroll-area-content" {...props}>
        {children}
      </div>
    ),
    Scrollbar: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div className="scroll-area-scrollbar" {...props}>
        {children}
      </div>
    ),
    Thumb: (props: Record<string, unknown>) => <div className="scroll-area-thumb" {...props} />,
    Corner: (props: Record<string, unknown>) => <div className="scroll-area-corner" {...props} />,
  },
}));

// Only setup window mocks if we're in jsdom environment (not node)
if (typeof window !== 'undefined') {
  // Mock localStorage for Zustand persist middleware
  const localStorageMock = ((): Storage => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string): string | null => store[key] ?? null,
      setItem: (key: string, value: string): void => {
        store[key] = value;
      },
      removeItem: (key: string): void => {
        // Use Object.prototype approach to avoid dynamic delete lint error
        store = Object.fromEntries(Object.entries(store).filter(([k]) => k !== key));
      },
      clear: (): void => {
        store = {};
      },
      get length(): number {
        return Object.keys(store).length;
      },
      key: (index: number): string | null => Object.keys(store)[index] ?? null,
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

// Polyfill for PointerEvent APIs used by Radix UI
if (typeof window !== 'undefined' && typeof Element !== 'undefined') {
  // These need to be assigned dynamically only if not present
  // Using ??= to satisfy ESLint prefer-nullish-coalescing
  interface PointerCaptureMethods {
    hasPointerCapture?: (_pointerId: number) => boolean;
    setPointerCapture?: (_pointerId: number) => void;
    releasePointerCapture?: (_pointerId: number) => void;
  }
  const proto = Element.prototype as unknown as PointerCaptureMethods;

  proto.hasPointerCapture ??= function (_pointerId: number): boolean {
    return false;
  };
  proto.setPointerCapture ??= function (_pointerId: number): void {
    // No-op for tests
  };
  proto.releasePointerCapture ??= function (_pointerId: number): void {
    // No-op for tests
  };
}

// Mock window.matchMedia for jsdom (not implemented by default)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  // Mock ResizeObserver for Motion layout measurements in jsdom
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver,
  });
}
