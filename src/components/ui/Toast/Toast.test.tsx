/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from './ToastProvider';
import { ToastBell } from './ToastBell';
import {
  toast,
  useToastStore,
  setupToastEventBridge,
  __resetEventBridgeForTesting,
} from './useToast';
import { globalEventBus } from '@/events/bus';

// Mock Motion to avoid animation timing issues in tests
vi.mock('motion/react', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('motion/react')>();
  return {
    ...actual,
    useReducedMotion: (): boolean => false,
    AnimatePresence: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
    motion: {
      ...(actual.motion as object),
      li: ({ children, ...props }: React.ComponentPropsWithoutRef<'li'>): React.JSX.Element => (
        <li {...props}>{children}</li>
      ),
      span: ({ children, ...props }: React.ComponentPropsWithoutRef<'span'>): React.JSX.Element => (
        <span {...props}>{children}</span>
      ),
      button: ({
        children,
        ...props
      }: React.ComponentPropsWithoutRef<'button'>): React.JSX.Element => (
        <button {...props}>{children}</button>
      ),
    },
  };
});

// Helper to render with provider
const renderWithProvider = (ui: React.ReactElement): ReturnType<typeof render> => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('Toast Store', () => {
  beforeEach(() => {
    useToastStore.getState().clearAll();
  });

  afterEach(() => {
    useToastStore.getState().clearAll();
    vi.clearAllMocks();
  });

  describe('toast API', () => {
    it('toast.success() creates a success toast', () => {
      const id = toast.success({ message: 'Success message' });

      expect(id).toBeDefined();
      const toasts = useToastStore.getState().getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.variant).toBe('success');
      expect(toasts[0]?.message).toBe('Success message');
    });

    it('toast.error() creates an error toast', () => {
      const id = toast.error({ message: 'Error message', details: 'Error details' });

      expect(id).toBeDefined();
      const toasts = useToastStore.getState().getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.variant).toBe('error');
      expect(toasts[0]?.message).toBe('Error message');
      expect(toasts[0]?.details).toBe('Error details');
    });

    it('toast.warning() creates a warning toast', () => {
      const id = toast.warning({ message: 'Warning message' });

      expect(id).toBeDefined();
      const toasts = useToastStore.getState().getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.variant).toBe('warning');
    });

    it('toast.info() creates an info toast', () => {
      const id = toast.info({ message: 'Info message' });

      expect(id).toBeDefined();
      const toasts = useToastStore.getState().getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.variant).toBe('info');
    });

    it('toast.dismiss() removes a specific toast', () => {
      const id = toast.success({ message: 'Test' });
      expect(useToastStore.getState().getToasts()).toHaveLength(1);

      toast.dismiss(id);
      expect(useToastStore.getState().getToasts()).toHaveLength(0);
    });

    it('toast.dismissAll() removes all toasts', () => {
      toast.success({ message: 'Test 1' });
      toast.error({ message: 'Test 2' });
      toast.warning({ message: 'Test 3' });
      expect(useToastStore.getState().getToasts()).toHaveLength(3);

      toast.dismissAll();
      expect(useToastStore.getState().getToasts()).toHaveLength(0);
    });
  });

  describe('default durations', () => {
    it('success toast has 3000ms duration', () => {
      toast.success({ message: 'Test' });
      const toasts = useToastStore.getState().getToasts();
      expect(toasts[0]?.duration).toBe(3000);
    });

    it('info toast has 4000ms duration', () => {
      toast.info({ message: 'Test' });
      const toasts = useToastStore.getState().getToasts();
      expect(toasts[0]?.duration).toBe(4000);
    });

    it('warning toast has 5000ms duration', () => {
      toast.warning({ message: 'Test' });
      const toasts = useToastStore.getState().getToasts();
      expect(toasts[0]?.duration).toBe(5000);
    });

    it('error toast has Infinity duration (no auto-dismiss)', () => {
      toast.error({ message: 'Test' });
      const toasts = useToastStore.getState().getToasts();
      expect(toasts[0]?.duration).toBe(Infinity);
    });

    it('custom duration overrides default', () => {
      toast.success({ message: 'Test', duration: 10000 });
      const toasts = useToastStore.getState().getToasts();
      expect(toasts[0]?.duration).toBe(10000);
    });
  });

  describe('deduplication', () => {
    it('same message increments count instead of creating new toast', () => {
      toast.success({ message: 'Duplicate message' });
      toast.success({ message: 'Duplicate message' });
      toast.success({ message: 'Duplicate message' });

      const toasts = useToastStore.getState().getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.count).toBe(3);
    });

    it('different messages create separate toasts', () => {
      toast.success({ message: 'Message 1' });
      toast.success({ message: 'Message 2' });

      const toasts = useToastStore.getState().getToasts();
      expect(toasts).toHaveLength(2);
    });

    it('same message with different variant creates separate toasts', () => {
      toast.success({ message: 'Same message' });
      toast.error({ message: 'Same message' });

      const toasts = useToastStore.getState().getToasts();
      expect(toasts).toHaveLength(2);
    });

    it('same message with different details creates separate toasts', () => {
      toast.error({ message: 'Error', details: 'Details 1' });
      toast.error({ message: 'Error', details: 'Details 2' });

      const toasts = useToastStore.getState().getToasts();
      expect(toasts).toHaveLength(2);
    });

    it('deduplication key includes variant, message, and details', () => {
      // First toast
      toast.error({ message: 'Error', details: 'Network failure' });
      // Duplicate
      toast.error({ message: 'Error', details: 'Network failure' });

      const toasts = useToastStore.getState().getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.count).toBe(2);
    });
  });

  describe('correlation ID', () => {
    it('stores correlation ID on toast', () => {
      toast.error({
        message: 'Error',
        correlationId: 'test-correlation-123',
      });

      const toasts = useToastStore.getState().getToasts();
      expect(toasts[0]?.correlationId).toBe('test-correlation-123');
    });
  });

  describe('test ID', () => {
    it('stores test ID on toast', () => {
      toast.success({
        message: 'Test',
        testId: 'custom-test-id',
      });

      const toasts = useToastStore.getState().getToasts();
      expect(toasts[0]?.testId).toBe('custom-test-id');
    });
  });
});

describe('Event Bus Bridge', () => {
  beforeEach(() => {
    useToastStore.getState().clearAll();
    // Reset event bridge to clean state for each test
    __resetEventBridgeForTesting();
  });

  afterEach(() => {
    useToastStore.getState().clearAll();
    // Reset event bridge to clean state
    __resetEventBridgeForTesting();
    vi.clearAllMocks();
  });

  it('toast.show event creates a toast', () => {
    // Set up the event bridge for this test
    setupToastEventBridge();

    act(() => {
      globalEventBus.emit('toast.show', {
        type: 'success',
        message: 'Event bus message',
      });
    });

    const toasts = useToastStore.getState().getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.variant).toBe('success');
    expect(toasts[0]?.message).toBe('Event bus message');
  });

  it('toast.show with all fields', () => {
    // Set up the event bridge for this test
    setupToastEventBridge();

    act(() => {
      globalEventBus.emit('toast.show', {
        type: 'error',
        message: 'Full error',
        details: 'Error details',
        correlationId: 'corr-123',
        duration: 10000,
        testId: 'test-123',
      });
    });

    const toasts = useToastStore.getState().getToasts();
    expect(toasts[0]).toMatchObject({
      variant: 'error',
      message: 'Full error',
      details: 'Error details',
      correlationId: 'corr-123',
      duration: 10000,
      testId: 'test-123',
    });
  });

  it('event bridge is initialized at module load', async () => {
    // Re-initialize the event bridge (simulates module load)
    setupToastEventBridge();

    render(
      <ToastProvider>
        <div>Content</div>
      </ToastProvider>
    );

    act(() => {
      globalEventBus.emit('toast.show', {
        type: 'info',
        message: 'Provider test',
      });
    });

    const toasts = useToastStore.getState().getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.message).toBe('Provider test');
  });
});

describe('Toast Component', () => {
  beforeEach(() => {
    useToastStore.getState().clearAll();
  });

  afterEach(() => {
    useToastStore.getState().clearAll();
    vi.clearAllMocks();
  });

  it('renders toast with message', async () => {
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.success({ message: 'Test message' });
    });

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });
  });

  it('renders toast with details', async () => {
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.error({ message: 'Error title', details: 'Error description' });
    });

    await waitFor(() => {
      expect(screen.getByText('Error title')).toBeInTheDocument();
      expect(screen.getByText('Error description')).toBeInTheDocument();
    });
  });

  it('renders deduplication counter when count > 1', async () => {
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.success({ message: 'Duplicate' });
      toast.success({ message: 'Duplicate' });
      toast.success({ message: 'Duplicate' });
    });

    await waitFor(() => {
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
      expect(screen.getByText('(x3)')).toBeInTheDocument();
    });
  });

  it('close button dismisses toast', async () => {
    const user = userEvent.setup();
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.error({ message: 'Dismissable', testId: 'dismiss-test' });
    });

    await waitFor(() => {
      expect(screen.getByText('Dismissable')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /dismiss notification/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Dismissable')).not.toBeInTheDocument();
    });
  });

  it('shows Console action for error toasts with correlationId', async () => {
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.error({
        message: 'Error with correlation',
        correlationId: 'test-corr',
      });
    });

    await waitFor(() => {
      const consoleBtn = document.querySelector('[data-test-id^="toast-view-console"]');
      expect(consoleBtn).toBeInTheDocument();
    });
  });

  it('does not show Console action for non-error toasts', async () => {
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.success({
        message: 'Success message',
        correlationId: 'test-corr',
      });
    });

    await waitFor(() => {
      const toastElement = document.querySelector('[data-test-id^="toast-"]');
      expect(toastElement).toBeInTheDocument();
    });

    const consoleBtn = document.querySelector('[data-test-id^="toast-view-console"]');
    expect(consoleBtn).not.toBeInTheDocument();
  });

  it('Console action emits panel.console-requested event', async () => {
    const user = userEvent.setup();
    const eventHandler = vi.fn();
    const unsubscribe = globalEventBus.on('panel.console-requested', eventHandler);

    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.error({
        message: 'Error',
        correlationId: 'test-correlation',
      });
    });

    await waitFor(() => {
      const consoleBtn = document.querySelector('[data-test-id^="toast-view-console"]');
      expect(consoleBtn).toBeInTheDocument();
    });

    const consoleBtn = document.querySelector('[data-test-id^="toast-view-console"]')!;
    await user.click(consoleBtn);

    expect(eventHandler).toHaveBeenCalledTimes(1);
    expect(eventHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { correlationId: 'test-correlation' },
      })
    );

    unsubscribe();
  });

  it('renders correct variant styling', async () => {
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.success({ message: 'Success', testId: 'success-toast' });
    });

    await waitFor(() => {
      const toastEl = screen.getByTestId('success-toast');
      expect(toastEl).toHaveAttribute('data-variant', 'success');
    });
  });
});

describe('ToastBell', () => {
  beforeEach(() => {
    useToastStore.getState().clearAll();
  });

  afterEach(() => {
    useToastStore.getState().clearAll();
    vi.clearAllMocks();
  });

  it('renders bell icon', () => {
    render(<ToastBell />);
    expect(screen.getByTestId('toast-bell')).toBeInTheDocument();
  });

  it('shows no badge when count is 0', () => {
    render(<ToastBell />);
    expect(screen.queryByTestId('toast-bell-badge')).not.toBeInTheDocument();
  });

  it('shows badge when count > 0', () => {
    act(() => {
      toast.success({ message: 'Test' });
    });

    render(<ToastBell />);
    expect(screen.getByTestId('toast-bell-badge')).toBeInTheDocument();
    expect(screen.getByTestId('toast-bell-badge')).toHaveTextContent('1');
  });

  it('updates badge count dynamically', async () => {
    const { rerender } = render(<ToastBell />);

    act(() => {
      toast.success({ message: 'Test 1' });
      toast.error({ message: 'Test 2' });
      toast.warning({ message: 'Test 3' });
    });

    rerender(<ToastBell />);

    await waitFor(() => {
      expect(screen.getByTestId('toast-bell-badge')).toHaveTextContent('3');
    });
  });

  it('shows 99+ for counts above 99', () => {
    // Add 100 unique toasts
    act(() => {
      for (let i = 0; i < 100; i++) {
        toast.success({ message: `Message ${String(i)}` });
      }
    });

    render(<ToastBell />);

    expect(screen.getByTestId('toast-bell-badge')).toHaveTextContent('99+');
  });

  it('has correct aria-label for count', () => {
    act(() => {
      toast.success({ message: 'Test' });
    });

    render(<ToastBell />);
    expect(screen.getByTestId('toast-bell')).toHaveAttribute('aria-label', '1 notification');
  });

  it('has correct aria-label for no notifications', () => {
    render(<ToastBell />);
    expect(screen.getByTestId('toast-bell')).toHaveAttribute('aria-label', 'No notifications');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<ToastBell onClick={handleClick} />);
    await user.click(screen.getByTestId('toast-bell'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('Accessibility', () => {
  beforeEach(() => {
    useToastStore.getState().clearAll();
  });

  afterEach(() => {
    useToastStore.getState().clearAll();
    vi.clearAllMocks();
  });

  it('close button has aria-label', async () => {
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.success({ message: 'Test' });
    });

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /dismiss notification/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('toast viewport has data-test-id', async () => {
    renderWithProvider(<div>Content</div>);

    await waitFor(() => {
      expect(screen.getByTestId('toast-viewport')).toBeInTheDocument();
    });
  });

  it('toast has data-test-id', async () => {
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.success({ message: 'Test', testId: 'a11y-test-toast' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('a11y-test-toast')).toBeInTheDocument();
    });
  });
});
