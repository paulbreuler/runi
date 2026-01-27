/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { toast } from 'sonner';
import { Toaster, showToast, clearToasts, clearDedupCache } from './Toaster';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';

// Mock sonner's toast function to verify calls and avoid portal issues in tests
vi.mock('sonner', async () => {
  const actual: Record<string, unknown> = await vi.importActual('sonner');
  const actualToast = actual.toast as Record<string, unknown>;

  // Helper to create toast entry in mock container
  const createToastEntry = (id?: string): void => {
    const container = document.getElementById('sonner-mock-container');
    if (container !== null) {
      const toastDiv = document.createElement('div');
      toastDiv.setAttribute('data-sonner-toast-id', id ?? '');
      container.appendChild(toastDiv);
    }
  };

  return {
    ...actual,
    toast: {
      ...actualToast,
      custom: vi.fn(),
      dismiss: vi.fn((id?: string) => {
        if (id !== undefined) {
          const container = document.getElementById('sonner-mock-container');
          if (container !== null) {
            const toastEl = container.querySelector(`[data-sonner-toast-id="${id}"]`);
            toastEl?.remove();
          }
        }
      }),
      success: vi.fn((_, options?: { id?: string }) => {
        createToastEntry(options?.id);
        return options?.id;
      }),
      warning: vi.fn((_, options?: { id?: string }) => {
        createToastEntry(options?.id);
        return options?.id;
      }),
      info: vi.fn((_, options?: { id?: string }) => {
        createToastEntry(options?.id);
        return options?.id;
      }),
      error: vi.fn((_, options?: { id?: string }) => {
        createToastEntry(options?.id);
        return options?.id;
      }),
    },
    Toaster: ({ children }: { children?: React.ReactNode }): React.JSX.Element => (
      <div id="sonner-mock-container">{children}</div>
    ),
  };
});

describe('Toaster', () => {
  beforeEach(() => {
    // Clear all toasts and dedup cache before each test
    clearToasts();
    clearDedupCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    clearToasts();
    clearDedupCache();
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // showToast function tests (unit tests for the logic)
  // ─────────────────────────────────────────────────────────────────────────────

  it('calls toast.success when showToast is called with success type', () => {
    showToast({
      type: 'success',
      message: 'Operation completed',
    });

    expect(toast.success).toHaveBeenCalled();
  });

  it('calls toast.error with correct options for error toasts', () => {
    showToast({
      type: 'error',
      message: 'Something went wrong',
    });

    expect(toast.error).toHaveBeenCalled();
    const call = vi.mocked(toast.error).mock.calls[0];
    expect(call?.[0]).toBe('Something went wrong');
    expect(call?.[1]).toHaveProperty('id');
    expect(call?.[1]).toHaveProperty('duration', Infinity);
    expect(call?.[1]).toHaveProperty('action');
  });

  it('calls toast.success with 5000ms duration for non-error toasts', () => {
    showToast({
      type: 'success',
      message: 'Success message',
    });

    expect(toast.success).toHaveBeenCalled();
    const call = vi.mocked(toast.success).mock.calls[0];
    expect(call?.[1]).toHaveProperty('duration', 5000);
  });

  it('uses custom duration when provided', () => {
    showToast({
      type: 'warning',
      message: 'Warning message',
      duration: 10000,
    });

    expect(toast.warning).toHaveBeenCalled();
    const call = vi.mocked(toast.warning).mock.calls[0];
    expect(call?.[1]).toHaveProperty('duration', 10000);
  });

  it('calls toast.dismiss on duplicate toasts', () => {
    // First toast
    showToast({ type: 'error', message: 'Same error' });
    expect(toast.error).toHaveBeenCalledTimes(1);

    // Duplicate toast - should dismiss old and show new
    showToast({ type: 'error', message: 'Same error' });
    expect(toast.dismiss).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledTimes(2);

    // Third duplicate
    showToast({ type: 'error', message: 'Same error' });
    expect(toast.dismiss).toHaveBeenCalledTimes(2);
    expect(toast.error).toHaveBeenCalledTimes(3);
  });

  it('does not deduplicate toasts with different messages', () => {
    showToast({ type: 'error', message: 'Error 1' });
    showToast({ type: 'error', message: 'Error 2' });

    // No dismiss calls - these are different toasts
    expect(toast.dismiss).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(2);
  });

  it('does not deduplicate toasts with same message but different type', () => {
    showToast({ type: 'error', message: 'Message' });
    showToast({ type: 'warning', message: 'Message' });

    // No dismiss calls - these are different types
    expect(toast.dismiss).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledTimes(1);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Deduplication Cache Tests
  // ─────────────────────────────────────────────────────────────────────────────

  it('clears dedup cache correctly', () => {
    // First toast
    showToast({ type: 'error', message: 'Error' });
    expect(toast.error).toHaveBeenCalledTimes(1);

    // Duplicate - will trigger dismiss
    showToast({ type: 'error', message: 'Error' });
    expect(toast.dismiss).toHaveBeenCalledTimes(1);

    // Clear cache
    clearDedupCache();

    // Reset mocks
    vi.mocked(toast.dismiss).mockClear();

    // Same error after clearing - should NOT trigger dismiss (treated as new)
    showToast({ type: 'error', message: 'Error' });
    expect(toast.dismiss).not.toHaveBeenCalled();
  });

  it('clearToasts calls toast.dismiss without id', () => {
    clearToasts();
    expect(toast.dismiss).toHaveBeenCalledWith();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Bus Integration Tests
  // ─────────────────────────────────────────────────────────────────────────────

  it('shows toast when toast.show event is emitted', () => {
    render(<Toaster />);

    act(() => {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: 'Event-driven error',
      });
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it('cleans up event subscription on unmount', () => {
    const { unmount } = render(<Toaster />);

    // Count subscriptions before unmount
    const listenerCountBefore = globalEventBus.listenerCount('toast.show');

    unmount();

    // Listener count should decrease
    const listenerCountAfter = globalEventBus.listenerCount('toast.show');
    expect(listenerCountAfter).toBeLessThan(listenerCountBefore);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // onDismiss callback tests
  // ─────────────────────────────────────────────────────────────────────────────

  it('passes onDismiss callback to toast options', () => {
    const onDismiss = vi.fn();

    showToast(
      {
        type: 'warning',
        message: 'Dismissible toast',
      },
      { onDismiss }
    );

    expect(toast.warning).toHaveBeenCalled();
    const call = vi.mocked(toast.warning).mock.calls[0];
    // Verify onDismiss is passed as a function in the options
    expect(call?.[1]).toHaveProperty('onDismiss');
    const options = call?.[1] as { onDismiss?: () => void } | undefined;
    expect(typeof options?.onDismiss).toBe('function');
  });
});
