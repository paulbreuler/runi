/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import { OpenItems } from './OpenItems';

// Mock localStorage
const localStorageMock = ((): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
} => {
  let store = {} as Record<string, string>;
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    },
    clear: (): void => {
      store = {} as Record<string, string>;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID for deterministic tests
let uuidCounter = 0;
const mockCrypto = Object.create(globalThis.crypto) as Crypto;
mockCrypto.randomUUID = (): ReturnType<Crypto['randomUUID']> =>
  `test-uuid-${String(++uuidCounter).padStart(3, '0')}` as ReturnType<Crypto['randomUUID']>;
vi.stubGlobal('crypto', mockCrypto);

function resetStore(): void {
  uuidCounter = 0;
  localStorageMock.clear();
  useCanvasStore.getState().reset();
  useRequestStoreRaw.setState({ contexts: {} });
}

interface TabConfig {
  method?: string;
  url?: string;
  label?: string;
  isDirty?: boolean;
}
type StringTuple<T extends readonly TabConfig[]> = { [K in keyof T]: string };

function openTabs<const T extends readonly TabConfig[]>(configs: T): StringTuple<T> {
  const ids: string[] = [];
  for (const config of configs) {
    ids.push(useCanvasStore.getState().openRequestTab(config));
  }
  return ids as StringTuple<T>;
}

describe('OpenItems', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('progressive disclosure', () => {
    it('returns null when no tabs exist', () => {
      const { container } = render(<OpenItems />);
      expect(container.innerHTML).toBe('');
    });

    it('returns null when only 1 tab exists', () => {
      openTabs([{ url: 'https://api.example.com' }]);
      const { container } = render(<OpenItems />);
      expect(container.innerHTML).toBe('');
    });

    it('renders list when 2+ tabs exist', () => {
      openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);
      render(<OpenItems />);
      expect(screen.getByTestId('open-items-section')).toBeInTheDocument();
      expect(screen.getByTestId('open-items-tab-request-test-uuid-001')).toBeInTheDocument();
      expect(screen.getByTestId('open-items-tab-request-test-uuid-002')).toBeInTheDocument();
    });
  });

  describe('active tab indicator', () => {
    it('marks the active tab with data-active attribute', () => {
      const [id1] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);
      useCanvasStore.getState().setActiveContext(id1);

      render(<OpenItems />);
      const activeItem = screen.getByTestId(`open-items-tab-${id1}`);
      expect(activeItem).toHaveAttribute('data-active', 'true');
    });
  });

  describe('method badges', () => {
    it('displays method badge with correct text', () => {
      openTabs([
        { method: 'GET', url: 'https://one.com', label: 'Get' },
        { method: 'POST', url: 'https://two.com', label: 'Post' },
      ]);
      render(<OpenItems />);
      expect(screen.getByTestId('open-items-method-request-test-uuid-001')).toHaveTextContent(
        'GET'
      );
      expect(screen.getByTestId('open-items-method-request-test-uuid-002')).toHaveTextContent(
        'POST'
      );
    });
  });

  describe('dirty indicator', () => {
    it('shows dirty dot when tab isDirty', () => {
      openTabs([
        { url: 'https://one.com', label: 'Clean', isDirty: false },
        { url: 'https://two.com', label: 'Dirty', isDirty: true },
      ]);
      render(<OpenItems />);
      expect(
        screen.queryByTestId('open-items-dirty-request-test-uuid-001')
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('open-items-dirty-request-test-uuid-002')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('activates tab on click', async () => {
      const [id1, id2] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);
      // id2 is active (last opened)
      expect(useCanvasStore.getState().activeContextId).toBe(id2);

      render(<OpenItems />);
      await userEvent.click(screen.getByTestId(`open-items-tab-${id1}`));
      expect(useCanvasStore.getState().activeContextId).toBe(id1);
    });

    it('closes tab on close button click without activating', async () => {
      const [id1, _id2] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
        { url: 'https://three.com', label: 'Third' },
      ]);
      // id3 is active
      const id3 = useCanvasStore.getState().activeContextId!;

      render(<OpenItems />);
      await userEvent.click(screen.getByTestId(`open-items-close-${id1}`));

      expect(useCanvasStore.getState().contexts.has(id1)).toBe(false);
      // Active tab should remain unchanged
      expect(useCanvasStore.getState().activeContextId).toBe(id3);
    });

    it('activates tab on Enter key', async () => {
      const [id1, _id2] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);

      render(<OpenItems />);
      const item = screen.getByTestId(`open-items-tab-${id1}`);
      item.focus();
      await userEvent.keyboard('{Enter}');
      expect(useCanvasStore.getState().activeContextId).toBe(id1);
    });

    it('activates tab on Space key', async () => {
      const [id1, _id2] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);

      render(<OpenItems />);
      const item = screen.getByTestId(`open-items-tab-${id1}`);
      item.focus();
      await userEvent.keyboard(' ');
      expect(useCanvasStore.getState().activeContextId).toBe(id1);
    });

    it('closes tab on Delete key', async () => {
      const [id1] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
        { url: 'https://three.com', label: 'Third' },
      ]);

      render(<OpenItems />);
      const item = screen.getByTestId(`open-items-tab-${id1}`);
      item.focus();
      await userEvent.keyboard('{Delete}');
      expect(useCanvasStore.getState().contexts.has(id1)).toBe(false);
    });

    it('closes tab on middle-click', () => {
      const [id1] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
        { url: 'https://three.com', label: 'Third' },
      ]);

      render(<OpenItems />);
      const item = screen.getByTestId(`open-items-tab-${id1}`);
      fireEvent.mouseDown(item, { button: 1 });
      expect(useCanvasStore.getState().contexts.has(id1)).toBe(false);
    });

    it('navigates between items with arrow keys', async () => {
      const [id1, id2, id3] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
        { url: 'https://three.com', label: 'Third' },
      ]);

      render(<OpenItems />);
      const firstItem = screen.getByTestId(`open-items-tab-${id1}`);
      firstItem.focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByTestId(`open-items-tab-${id2}`)).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByTestId(`open-items-tab-${id3}`)).toHaveFocus();

      await userEvent.keyboard('{ArrowUp}');
      expect(screen.getByTestId(`open-items-tab-${id2}`)).toHaveFocus();
    });

    it('wraps arrow navigation at boundaries', async () => {
      const [id1, _id2, id3] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
        { url: 'https://three.com', label: 'Third' },
      ]);

      render(<OpenItems />);
      // Focus last item, arrow down should wrap to first
      const lastItem = screen.getByTestId(`open-items-tab-${id3}`);
      lastItem.focus();
      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByTestId(`open-items-tab-${id1}`)).toHaveFocus();

      // Arrow up from first should wrap to last
      await userEvent.keyboard('{ArrowUp}');
      expect(screen.getByTestId(`open-items-tab-${id3}`)).toHaveFocus();
    });
  });

  describe('label truncation', () => {
    it('displays truncated labels', () => {
      openTabs([
        { url: 'https://one.com', label: 'Short' },
        { url: 'https://two.com', label: 'Short2' },
      ]);
      render(<OpenItems />);
      expect(screen.getByTestId('open-items-label-request-test-uuid-001')).toHaveTextContent(
        'Short'
      );
    });
  });

  describe('section header', () => {
    it('displays section title with tab count', () => {
      openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
        { url: 'https://three.com', label: 'Third' },
      ]);
      render(<OpenItems />);
      expect(screen.getByTestId('open-items-title')).toHaveTextContent('Open');
      expect(screen.getByTestId('open-items-count')).toHaveTextContent('3');
    });

    it('toggles section visibility on header click', async () => {
      openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);
      render(<OpenItems />);

      const toggle = screen.getByTestId('open-items-section-toggle');
      expect(toggle).toHaveAttribute('aria-expanded', 'true');

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA roles', () => {
      openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);
      render(<OpenItems />);

      const list = screen.getByTestId('open-items-list');
      expect(list).toHaveAttribute('role', 'listbox');
      expect(list).toHaveAttribute('aria-label', 'Open requests');
    });

    it('marks active tab with aria-selected', () => {
      const [id1, id2] = openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);
      // id2 is active
      render(<OpenItems />);

      expect(screen.getByTestId(`open-items-tab-${id1}`)).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId(`open-items-tab-${id2}`)).toHaveAttribute('aria-selected', 'true');
    });

    it('close button has descriptive aria-label', () => {
      openTabs([
        { method: 'GET', url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);
      render(<OpenItems />);

      expect(screen.getByTestId('open-items-close-request-test-uuid-001')).toHaveAttribute(
        'aria-label',
        'Close tab GET First'
      );
    });

    it('close button is keyboard focusable', async () => {
      openTabs([
        { url: 'https://one.com', label: 'First' },
        { url: 'https://two.com', label: 'Second' },
      ]);
      render(<OpenItems />);

      const closeButton = screen.getByTestId('open-items-close-request-test-uuid-001');

      // Focus the close button via keyboard (it should not have tabIndex={-1})
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      // Verify it does not have tabIndex={-1} which would prevent keyboard focus
      expect(closeButton).not.toHaveAttribute('tabIndex', '-1');
    });
  });
});
