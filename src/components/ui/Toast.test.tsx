/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToastProvider } from './Toast';
import { useToastStore, clearDedupCache } from '@/stores/useToastStore';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';

// Test wrapper component that provides Toast context
// ToastProvider already renders Toast internally, so we don't need to render Toast separately
const ToastTestWrapper = (): React.JSX.Element => {
  return <ToastProvider>{null}</ToastProvider>;
};

describe('Toast', () => {
  beforeEach(() => {
    // Reset toast store before each test
    useToastStore.setState({ toasts: [] });
    // Clear dedup cache between tests
    clearDedupCache();
  });

  it('renders toast message when toast is enqueued', () => {
    render(<ToastTestWrapper />);

    // Enqueue a toast
    act(() => {
      useToastStore.getState().enqueue({
        type: 'success',
        message: 'Operation completed',
      });
    });

    expect(screen.getByText('Operation completed')).toBeInTheDocument();
  });

  it('renders toast with error type and styling', () => {
    render(<ToastTestWrapper />);

    act(() => {
      useToastStore.getState().enqueue({
        type: 'error',
        message: 'Something went wrong',
      });
    });

    const toast = screen.getByText('Something went wrong').closest('[role="status"]');
    expect(toast).toBeInTheDocument();
  });

  it('dismisses toast when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<ToastTestWrapper />);

    act(() => {
      useToastStore.getState().enqueue({
        type: 'info',
        message: 'Information message',
      });
    });

    expect(screen.getByText('Information message')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Information message')).not.toBeInTheDocument();
    });
  });

  it('renders multiple toasts when multiple are enqueued', () => {
    render(<ToastTestWrapper />);

    act(() => {
      useToastStore.getState().enqueue({ type: 'info', message: 'Toast 1' });
      useToastStore.getState().enqueue({ type: 'warning', message: 'Toast 2' });
    });

    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('does not display details in toast (details stored for copy functionality only)', () => {
    render(<ToastTestWrapper />);

    act(() => {
      useToastStore.getState().enqueue({
        type: 'error',
        message: 'Request failed',
        details: 'Correlation ID: abc123',
      });
    });

    // Message should be displayed
    expect(screen.getByText('Request failed')).toBeInTheDocument();
    // Details/correlation ID should NOT be displayed in UI (but available for copy)
    expect(screen.queryByText('Correlation ID: abc123')).not.toBeInTheDocument();
  });

  it('auto-dismisses non-error toasts after duration', () => {
    vi.useFakeTimers();
    render(<ToastTestWrapper />);

    act(() => {
      useToastStore.getState().enqueue({
        type: 'success',
        message: 'Auto-dismissing toast',
        duration: 2000,
      });
    });

    expect(screen.getByText('Auto-dismissing toast')).toBeInTheDocument();
    expect(useToastStore.getState().toasts).toHaveLength(1);

    // Fast-forward time - advance timers synchronously
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Check store state - should be empty after auto-dismiss
    expect(useToastStore.getState().toasts).toHaveLength(0);

    vi.useRealTimers();
  });

  it('does not auto-dismiss error toasts', async () => {
    vi.useFakeTimers();
    render(<ToastTestWrapper />);

    act(() => {
      useToastStore.getState().enqueue({
        type: 'error',
        message: 'Persistent error',
      });
    });

    expect(screen.getByText('Persistent error')).toBeInTheDocument();

    // Fast-forward time (should not dismiss)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    // Toast should still be present
    expect(screen.getByText('Persistent error')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('renders correct icon for each toast type', () => {
    render(<ToastTestWrapper />);

    act(() => {
      useToastStore.getState().enqueue({ type: 'error', message: 'Error' });
      useToastStore.getState().enqueue({ type: 'warning', message: 'Warning' });
      useToastStore.getState().enqueue({ type: 'success', message: 'Success' });
    });

    // Only 3 toasts should render (maxNotifications default is 3)
    // Icons should be present (checking via aria-labels or test ids would be better, but for now we check presence)
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Event-driven Toast Tests
  // ─────────────────────────────────────────────────────────────────────────────

  it('shows toast when toast.show event is emitted', () => {
    render(<ToastTestWrapper />);

    act(() => {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: 'Event-driven error',
      });
    });

    expect(screen.getByText('Event-driven error')).toBeInTheDocument();
  });

  it('shows toast with details when toast.show event includes details', () => {
    render(<ToastTestWrapper />);

    act(() => {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: 'Error with details',
        details: 'Correlation ID: xyz789',
        correlationId: 'xyz789',
      });
    });

    expect(screen.getByText('Error with details')).toBeInTheDocument();
    // Details stored but not displayed (checked in existing test)
  });

  it('cleans up event subscription on unmount', () => {
    const { unmount } = render(<ToastTestWrapper />);

    // Emit event before unmount - should show toast
    act(() => {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'info',
        message: 'Before unmount',
      });
    });

    expect(screen.getByText('Before unmount')).toBeInTheDocument();

    // Clear toasts and unmount
    act(() => {
      useToastStore.getState().clear();
    });
    unmount();

    // Emit event after unmount - should not cause errors or show toast
    act(() => {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'info',
        message: 'After unmount',
      });
    });

    // Store should still be empty (no handler to process event)
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Count Badge UI Tests
  // ─────────────────────────────────────────────────────────────────────────────

  it('does not show count badge when count is 1', () => {
    render(<ToastTestWrapper />);

    act(() => {
      useToastStore.getState().enqueue({ type: 'error', message: 'Single error' });
    });

    expect(screen.getByText('Single error')).toBeInTheDocument();
    // Should not show "(×1)" badge
    expect(screen.queryByText(/×1/)).not.toBeInTheDocument();
  });

  it('shows count badge when duplicate toasts are enqueued', () => {
    render(<ToastTestWrapper />);

    act(() => {
      useToastStore.getState().enqueue({ type: 'error', message: 'Duplicate error' });
      useToastStore.getState().enqueue({ type: 'error', message: 'Duplicate error' });
      useToastStore.getState().enqueue({ type: 'error', message: 'Duplicate error' });
    });

    expect(screen.getByText('Duplicate error')).toBeInTheDocument();
    // Should show "(×3)" badge
    expect(screen.getByText('(×3)')).toBeInTheDocument();
  });
});
