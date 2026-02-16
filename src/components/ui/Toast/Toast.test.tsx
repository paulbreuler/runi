/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, renderHook } from '@testing-library/react';
import type { RenderHookResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast as BaseUIToast } from '@base-ui/react/toast';
import { ToastProvider } from './ToastProvider';
import { ToastBell } from './ToastBell';
import {
  toast,
  setupToastEventBridge,
  __resetEventBridgeForTesting,
  type ToastManagerData,
} from './useToast';
import { globalEventBus } from '@/events/bus';

/** Shape of custom data stored on toast instances in our system */
type ToastData = Partial<ToastManagerData>;

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

const ToastProviderWrapper = ({ children }: { children: React.ReactNode }): React.JSX.Element => {
  return <ToastProvider>{children}</ToastProvider>;
};

// Helper to render with provider
const renderWithProvider = (ui: React.ReactElement): ReturnType<typeof render> => {
  return render(<ToastProviderWrapper>{ui}</ToastProviderWrapper>);
};

type ToastManagerHook = ReturnType<typeof BaseUIToast.useToastManager>;

const renderToastManager = (): RenderHookResult<ToastManagerHook, unknown> =>
  renderHook(() => BaseUIToast.useToastManager(), { wrapper: ToastProviderWrapper });

describe('Toast Store', () => {
  beforeEach(() => {
    act(() => {
      toast.dismissAll();
    });
  });

  afterEach(() => {
    act(() => {
      toast.dismissAll();
    });
    vi.clearAllMocks();
  });

  describe('toast API', () => {
    it('toast.success() creates a success toast', async () => {
      const { result } = renderToastManager();
      let id = '';
      act(() => {
        id = toast.success({ message: 'Success message' });
      });

      expect(id).toBeDefined();
      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(1);
      });
      expect(result.current.toasts[0]?.type).toBe('success');
      expect(result.current.toasts[0]?.title).toBe('Success message');
    });

    it('toast.error() creates an error toast', async () => {
      const { result } = renderToastManager();
      let id = '';
      act(() => {
        id = toast.error({ message: 'Error message', details: 'Error details' });
      });

      expect(id).toBeDefined();
      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(1);
      });
      expect(result.current.toasts[0]?.type).toBe('error');
      expect(result.current.toasts[0]?.title).toBe('Error message');
      expect(result.current.toasts[0]?.description).toBe('Error details');
    });

    it('toast.warning() creates a warning toast', async () => {
      const { result } = renderToastManager();
      let id = '';
      act(() => {
        id = toast.warning({ message: 'Warning message' });
      });

      expect(id).toBeDefined();
      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(1);
      });
      expect(result.current.toasts[0]?.type).toBe('warning');
    });

    it('toast.info() creates an info toast', async () => {
      const { result } = renderToastManager();
      let id = '';
      act(() => {
        id = toast.info({ message: 'Info message' });
      });

      expect(id).toBeDefined();
      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(1);
      });
      expect(result.current.toasts[0]?.type).toBe('info');
    });

    it('toast.dismiss() removes a specific toast', async () => {
      const { result } = renderToastManager();
      let id = '';
      act(() => {
        id = toast.success({ message: 'Test' });
      });
      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(1);
      });

      act(() => {
        toast.dismiss(id);
      });
      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(0);
      });
    });

    it('toast.dismissAll() removes all toasts', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.success({ message: 'Test 1' });
        toast.error({ message: 'Test 2' });
        toast.warning({ message: 'Test 3' });
      });
      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(3);
      });

      act(() => {
        toast.dismissAll();
      });
      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(0);
      });
    });
  });

  describe('default durations', () => {
    it('success toast has 3000ms duration', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.success({ message: 'Test' });
      });
      await waitFor(() => {
        expect(result.current.toasts[0]?.timeout).toBe(3000);
      });
    });

    it('info toast has 4000ms duration', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.info({ message: 'Test' });
      });
      await waitFor(() => {
        expect(result.current.toasts[0]?.timeout).toBe(4000);
      });
    });

    it('warning toast has 5000ms duration', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.warning({ message: 'Test' });
      });
      await waitFor(() => {
        expect(result.current.toasts[0]?.timeout).toBe(5000);
      });
    });

    it('error toast has 0ms timeout (no auto-dismiss)', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.error({ message: 'Test' });
      });
      await waitFor(() => {
        expect(result.current.toasts[0]?.timeout).toBe(0);
      });
    });

    it('custom duration overrides default', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.success({ message: 'Test', duration: 10000 });
      });
      await waitFor(() => {
        expect(result.current.toasts[0]?.timeout).toBe(10000);
      });
    });
  });

  describe('deduplication', () => {
    it('same message increments count instead of creating new toast', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.success({ message: 'Duplicate message' });
        toast.success({ message: 'Duplicate message' });
        toast.success({ message: 'Duplicate message' });
      });

      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(1);
      });
      expect((result.current.toasts[0]?.data as ToastData | undefined)?.count).toBe(3);
    });

    it('different messages create separate toasts', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.success({ message: 'Message 1' });
        toast.success({ message: 'Message 2' });
      });

      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(2);
      });
    });

    it('same message with different variant creates separate toasts', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.success({ message: 'Same message' });
        toast.error({ message: 'Same message' });
      });

      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(2);
      });
    });

    it('same message with different details creates separate toasts', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.error({ message: 'Error', details: 'Details 1' });
        toast.error({ message: 'Error', details: 'Details 2' });
      });

      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(2);
      });
    });

    it('deduplication key includes variant, message, and details', async () => {
      const { result } = renderToastManager();
      // First toast
      act(() => {
        toast.error({ message: 'Error', details: 'Network failure' });
      });
      // Duplicate
      act(() => {
        toast.error({ message: 'Error', details: 'Network failure' });
      });

      await waitFor(() => {
        expect(result.current.toasts).toHaveLength(1);
      });
      expect((result.current.toasts[0]?.data as ToastData | undefined)?.count).toBe(2);
    });
  });

  describe('correlation ID', () => {
    it('stores correlation ID on toast', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.error({
          message: 'Error',
          correlationId: 'test-correlation-123',
        });
      });

      await waitFor(() => {
        expect((result.current.toasts[0]?.data as ToastData | undefined)?.correlationId).toBe(
          'test-correlation-123'
        );
      });
    });
  });

  describe('test ID', () => {
    it('stores test ID on toast', async () => {
      const { result } = renderToastManager();
      act(() => {
        toast.success({
          message: 'Test',
          testId: 'custom-test-id',
        });
      });

      await waitFor(() => {
        expect((result.current.toasts[0]?.data as ToastData | undefined)?.testId).toBe(
          'custom-test-id'
        );
      });
    });
  });
});

describe('Event Bus Bridge', () => {
  beforeEach(() => {
    act(() => {
      toast.dismissAll();
    });
    // Reset event bridge to clean state for each test
    __resetEventBridgeForTesting();
  });

  afterEach(() => {
    act(() => {
      toast.dismissAll();
    });
    // Reset event bridge to clean state
    __resetEventBridgeForTesting();
    vi.clearAllMocks();
  });

  it('toast.show event creates a toast', async () => {
    const { result } = renderToastManager();
    // Set up the event bridge for this test
    setupToastEventBridge();

    act(() => {
      globalEventBus.emit('toast.show', {
        type: 'success',
        message: 'Event bus message',
      });
    });

    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(1);
    });
    expect(result.current.toasts[0]?.type).toBe('success');
    expect(result.current.toasts[0]?.title).toBe('Event bus message');
  });

  it('toast.show with all fields', async () => {
    const { result } = renderToastManager();
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

    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(1);
    });
    expect(result.current.toasts[0]).toMatchObject({
      type: 'error',
      title: 'Full error',
      description: 'Error details',
      timeout: 10000,
      data: {
        correlationId: 'corr-123',
        testId: 'test-123',
      },
    });
  });

  it('event bridge is initialized at module load', async () => {
    // Re-initialize the event bridge (simulates module load)
    setupToastEventBridge();

    const { result } = renderToastManager();

    act(() => {
      globalEventBus.emit('toast.show', {
        type: 'info',
        message: 'Provider test',
      });
    });

    await waitFor(() => {
      expect(result.current.toasts).toHaveLength(1);
    });
    expect(result.current.toasts[0]?.title).toBe('Provider test');
  });
});

describe('Toast Component', () => {
  beforeEach(() => {
    act(() => {
      toast.dismissAll();
    });
  });

  afterEach(() => {
    act(() => {
      toast.dismissAll();
    });
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

    const closeButton = document.querySelector('[data-test-id^="toast-close-"]')!;
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
    act(() => {
      toast.dismissAll();
    });
  });

  afterEach(() => {
    act(() => {
      toast.dismissAll();
    });
    vi.clearAllMocks();
  });

  it('renders bell icon', () => {
    renderWithProvider(<ToastBell />);
    expect(screen.getByTestId('toast-bell')).toBeInTheDocument();
  });

  it('shows no badge when count is 0', () => {
    renderWithProvider(<ToastBell />);
    expect(screen.queryByTestId('toast-bell-badge')).not.toBeInTheDocument();
  });

  it('shows badge when count > 0', () => {
    renderWithProvider(<ToastBell />);
    act(() => {
      toast.success({ message: 'Test' });
    });
    expect(screen.getByTestId('toast-bell-badge')).toBeInTheDocument();
    expect(screen.getByTestId('toast-bell-badge')).toHaveTextContent('1');
  });

  it('updates badge count dynamically', async () => {
    renderWithProvider(<ToastBell />);

    act(() => {
      toast.success({ message: 'Test 1' });
      toast.error({ message: 'Test 2' });
      toast.warning({ message: 'Test 3' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('toast-bell-badge')).toHaveTextContent('3');
    });
  });

  it('shows 99+ for counts above 99', () => {
    renderWithProvider(<ToastBell />);
    // Add 100 unique toasts
    act(() => {
      for (let i = 0; i < 100; i++) {
        toast.success({ message: `Message ${String(i)}` });
      }
    });

    expect(screen.getByTestId('toast-bell-badge')).toHaveTextContent('99+');
  });

  it('has correct aria-label for count', () => {
    renderWithProvider(<ToastBell />);
    act(() => {
      toast.success({ message: 'Test' });
    });
    expect(screen.getByTestId('toast-bell')).toHaveAttribute('aria-label', '1 notification');
  });

  it('has correct aria-label for no notifications', () => {
    renderWithProvider(<ToastBell />);
    expect(screen.getByTestId('toast-bell')).toHaveAttribute('aria-label', 'No notifications');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    renderWithProvider(<ToastBell onClick={handleClick} />);
    await user.click(screen.getByTestId('toast-bell'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('Accessibility', () => {
  beforeEach(() => {
    act(() => {
      toast.dismissAll();
    });
  });

  afterEach(() => {
    act(() => {
      toast.dismissAll();
    });
    vi.clearAllMocks();
  });

  it('close button has aria-label', async () => {
    renderWithProvider(<div>Content</div>);

    act(() => {
      toast.success({ message: 'Test' });
    });

    await waitFor(() => {
      const closeButton = document.querySelector('[data-test-id^="toast-close-"]');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Dismiss notification');
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
