/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useAnchorColumnWidths hook tests
 * @description Unit tests for the useAnchorColumnWidths hook
 *
 * Tests the column width calculation logic in isolation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAnchorColumnWidths, type AnchorColumnDef } from './useAnchorColumnWidths';

describe('useAnchorColumnWidths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Feature #38: Fixed Column Widths', () => {
    it('maintains fixed column widths', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '1000px';
      // Set clientWidth to simulate actual measurement
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 1000,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
        { id: 'url', sizing: 'flex', width: 1 },
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      // Fixed columns should have their exact widths
      expect(result.current.getWidth('select')).toBe(32);
      expect(result.current.getWidth('method')).toBe(100);
    });

    it('fixed columns do not resize with content', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '1000px';
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 1000,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
        { id: 'url', sizing: 'flex', width: 1 },
      ];

      const { result, rerender } = renderHook(
        ({ cols }) => useAnchorColumnWidths(containerRef, cols),
        { initialProps: { cols: columns } }
      );

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      const initialMethodWidth = result.current.getWidth('method');

      // Change flexible column weight (simulating content change)
      const newColumns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
        { id: 'url', sizing: 'flex', width: 2 }, // Changed weight
      ];

      rerender({ cols: newColumns });

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      // Fixed columns should remain the same
      expect(result.current.getWidth('method')).toBe(initialMethodWidth);
      expect(result.current.getWidth('method')).toBe(100);
    });
  });

  describe('Feature #39: Flexible Column Widths', () => {
    it('distributes space to flexible columns', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '1000px';
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 1000,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
        { id: 'url', sizing: 'flex', width: 1 },
        { id: 'status', sizing: 'flex', width: 1 },
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      // Flexible columns should have calculated widths
      const urlWidth = result.current.getWidth('url');
      const statusWidth = result.current.getWidth('status');

      expect(urlWidth).toBeGreaterThan(0);
      expect(statusWidth).toBeGreaterThan(0);

      // Total should equal container width minus fixed columns
      const totalWidth = 32 + 100 + urlWidth + statusWidth;
      expect(totalWidth).toBeCloseTo(1000, 0);
    });

    it('respects column weights', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '1000px';
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 1000,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
        { id: 'url', sizing: 'flex', width: 2 }, // Weight 2
        { id: 'status', sizing: 'flex', width: 1 }, // Weight 1
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      const urlWidth = result.current.getWidth('url');
      const statusWidth = result.current.getWidth('status');

      // URL should get approximately 2x the space of status
      expect(urlWidth).toBeGreaterThan(statusWidth);
    });

    it('respects minimum widths', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '1000px';
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 1000,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
        { id: 'url', sizing: 'flex', width: 1, minWidth: 150 },
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      const urlWidth = result.current.getWidth('url');
      expect(urlWidth).toBeGreaterThanOrEqual(150);
    });
  });

  describe('Feature #40: Container Width Changes', () => {
    it('sets up ResizeObserver for container resize', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '800px';
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 800,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
        { id: 'url', sizing: 'flex', width: 1 },
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      // Verify ResizeObserver is set up (hook should be ready)
      expect(result.current.ready).toBe(true);
      expect(result.current.containerWidth).toBeGreaterThan(0);

      // Verify widths are calculated
      expect(result.current.getWidth('select')).toBe(32);
      expect(result.current.getWidth('method')).toBe(100);
      expect(result.current.getWidth('url')).toBeGreaterThan(0);
    });

    it('fixed columns remain fixed on resize', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '800px';
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 800,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
        { id: 'url', sizing: 'flex', width: 1 },
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      const methodWidth = result.current.getWidth('method');

      // Fixed column should always be the same regardless of container size
      // (tested by creating a new hook with different container size)
      const containerRef2 = { current: document.createElement('div') };
      containerRef2.current.style.width = '1200px';
      Object.defineProperty(containerRef2.current, 'clientWidth', {
        value: 1200,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef2.current);

      const { result: result2 } = renderHook(() => useAnchorColumnWidths(containerRef2, columns));

      await waitFor(() => {
        expect(result2.current.ready).toBe(true);
      });

      // Fixed column should remain the same
      expect(result2.current.getWidth('method')).toBe(methodWidth);
      expect(result2.current.getWidth('method')).toBe(100);
    });

    it('flexible columns adjust on resize', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '800px';
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 800,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
        { id: 'url', sizing: 'flex', width: 1 },
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      const initialUrlWidth = result.current.getWidth('url');

      // Create a larger container to simulate resize
      const containerRef2 = { current: document.createElement('div') };
      containerRef2.current.style.width = '1200px';
      Object.defineProperty(containerRef2.current, 'clientWidth', {
        value: 1200,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef2.current);

      const { result: result2 } = renderHook(() => useAnchorColumnWidths(containerRef2, columns));

      await waitFor(() => {
        expect(result2.current.ready).toBe(true);
      });

      // Flexible column should get more space in larger container
      const newUrlWidth = result2.current.getWidth('url');
      expect(newUrlWidth).toBeGreaterThan(initialUrlWidth);
    });
  });

  describe('edge cases', () => {
    it('handles zero container width', () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '0px';
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'select', sizing: 'fixed', width: 32 },
        { id: 'method', sizing: 'fixed', width: 100 },
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      // Should return default widths before measurement
      expect(result.current.getWidth('select')).toBe(32);
      expect(result.current.getWidth('method')).toBe(100);
    });

    it('handles all fixed columns', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '1000px';
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 1000,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'col1', sizing: 'fixed', width: 100 },
        { id: 'col2', sizing: 'fixed', width: 200 },
        { id: 'col3', sizing: 'fixed', width: 300 },
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      expect(result.current.getWidth('col1')).toBe(100);
      expect(result.current.getWidth('col2')).toBe(200);
      expect(result.current.getWidth('col3')).toBe(300);
    });

    it('handles all flexible columns', async () => {
      const containerRef = { current: document.createElement('div') };
      containerRef.current.style.width = '1000px';
      Object.defineProperty(containerRef.current, 'clientWidth', {
        value: 1000,
        writable: true,
        configurable: true,
      });
      document.body.appendChild(containerRef.current);

      const columns: AnchorColumnDef[] = [
        { id: 'col1', sizing: 'flex', width: 1 },
        { id: 'col2', sizing: 'flex', width: 2 },
        { id: 'col3', sizing: 'flex', width: 1 },
      ];

      const { result } = renderHook(() => useAnchorColumnWidths(containerRef, columns));

      await waitFor(
        () => {
          expect(result.current.ready).toBe(true);
        },
        { timeout: 2000 }
      );

      const col1Width = result.current.getWidth('col1');
      const col2Width = result.current.getWidth('col2');
      const col3Width = result.current.getWidth('col3');

      // col2 should get 2x the space of col1 and col3
      expect(col2Width).toBeGreaterThan(col1Width);
      expect(col2Width).toBeGreaterThan(col3Width);

      // Total should equal container width
      const total = col1Width + col2Width + col3Width;
      expect(total).toBeCloseTo(1000, 0);
    });
  });
});
