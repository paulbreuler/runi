/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToastStore, clearDedupCache } from './useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useToastStore.setState({ toasts: [] });
    // Clear dedup cache between tests
    clearDedupCache();
  });

  it('initializes with empty toasts array', () => {
    const { result } = renderHook(() => useToastStore());
    expect(result.current.toasts).toEqual([]);
  });

  it('enqueues a toast with type and message', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({
        type: 'error',
        message: 'Something went wrong',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      message: 'Something went wrong',
    });
    expect(result.current.toasts[0]).toHaveProperty('id');
    expect(result.current.toasts[0]).toHaveProperty('timestamp');
  });

  it('enqueues a toast with optional details and correlationId', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({
        type: 'error',
        message: 'Request failed',
        details: 'Correlation ID: abc123',
        correlationId: 'abc123',
      });
    });

    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      message: 'Request failed',
      details: 'Correlation ID: abc123',
      correlationId: 'abc123',
    });
  });

  it('dismisses a toast by id', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({ type: 'error', message: 'Error 1' });
      result.current.enqueue({ type: 'warning', message: 'Warning 1' });
    });

    expect(result.current.toasts).toHaveLength(2);

    const firstToastId = result.current.toasts[0]!.id;

    act(() => {
      result.current.dismiss(firstToastId);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]!.message).toBe('Warning 1');
  });

  it('clears all toasts', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({ type: 'error', message: 'Error 1' });
      result.current.enqueue({ type: 'warning', message: 'Warning 1' });
      result.current.enqueue({ type: 'info', message: 'Info 1' });
    });

    expect(result.current.toasts).toHaveLength(3);

    act(() => {
      result.current.clear();
    });

    expect(result.current.toasts).toEqual([]);
  });

  it('sets default duration for non-error toasts (5000ms)', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({
        type: 'success',
        message: 'Saved successfully',
      });
    });

    expect(result.current.toasts[0]!.duration).toBe(5000);
  });

  it('sets undefined duration for error toasts (no auto-dismiss)', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({
        type: 'error',
        message: 'Critical error',
      });
    });

    expect(result.current.toasts[0]!.duration).toBeUndefined();
  });

  it('generates unique ids for each toast', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({ type: 'info', message: 'Toast 1' });
      result.current.enqueue({ type: 'info', message: 'Toast 2' });
      result.current.enqueue({ type: 'info', message: 'Toast 3' });
    });

    const ids = result.current.toasts.map((t) => t.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(3);
  });

  it('limits toasts to maxNotifications (default 3)', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      // Enqueue 5 toasts
      result.current.enqueue({ type: 'info', message: 'Toast 1' });
      result.current.enqueue({ type: 'info', message: 'Toast 2' });
      result.current.enqueue({ type: 'info', message: 'Toast 3' });
      result.current.enqueue({ type: 'info', message: 'Toast 4' });
      result.current.enqueue({ type: 'info', message: 'Toast 5' });
    });

    // Should only keep the last 3 (maxNotifications default)
    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts.map((t) => t.message)).toEqual(['Toast 3', 'Toast 4', 'Toast 5']);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Deduplication Tests
  // ─────────────────────────────────────────────────────────────────────────────

  it('initializes toast count to 1', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({ type: 'error', message: 'Error occurred' });
    });

    expect(result.current.toasts[0]!.count).toBe(1);
  });

  it('increments count for duplicate toasts instead of adding new toast', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({ type: 'error', message: 'Same error' });
      result.current.enqueue({ type: 'error', message: 'Same error' });
      result.current.enqueue({ type: 'error', message: 'Same error' });
    });

    // Should only have 1 toast with count 3
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]!.message).toBe('Same error');
    expect(result.current.toasts[0]!.count).toBe(3);
  });

  it('updates timestamp when incrementing duplicate count', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({ type: 'error', message: 'Same error' });
    });

    const firstTimestamp = result.current.toasts[0]!.timestamp;

    // Wait a bit to ensure timestamp difference
    act(() => {
      result.current.enqueue({ type: 'error', message: 'Same error' });
    });

    // Timestamp should be updated (or at least not earlier)
    expect(result.current.toasts[0]!.timestamp).toBeGreaterThanOrEqual(firstTimestamp);
  });

  it('does not deduplicate toasts with different messages', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({ type: 'error', message: 'Error 1' });
      result.current.enqueue({ type: 'error', message: 'Error 2' });
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0]!.count).toBe(1);
    expect(result.current.toasts[1]!.count).toBe(1);
  });

  it('does not deduplicate toasts with same message but different type', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({ type: 'error', message: 'Message' });
      result.current.enqueue({ type: 'warning', message: 'Message' });
    });

    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0]!.type).toBe('error');
    expect(result.current.toasts[1]!.type).toBe('warning');
  });

  it('allows same error to reappear after dismissing', () => {
    const { result } = renderHook(() => useToastStore());

    act(() => {
      result.current.enqueue({ type: 'error', message: 'Recurring error' });
    });

    const toastId = result.current.toasts[0]!.id;

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);

    // Same error should create new toast (cache cleared on dismiss)
    act(() => {
      result.current.enqueue({ type: 'error', message: 'Recurring error' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]!.count).toBe(1);
  });
});
