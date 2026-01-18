import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider } from './Toast';
import { useToastStore, clearDedupCache } from '@/stores/useToastStore';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { Button } from './button';

const meta = {
  title: 'Components/UI/Toast',
  component: ToastProvider,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component to trigger toasts
const ToastTrigger = ({
  type,
  message,
  details,
  correlationId,
}: {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  details?: string;
  correlationId?: string;
}): React.JSX.Element => {
  const { enqueue } = useToastStore();

  return (
    <div className="p-8">
      <Button
        onClick={(): void => {
          enqueue({ type, message, details, correlationId });
        }}
      >
        Show {type} toast
      </Button>
    </div>
  );
};

/**
 * Default error toast with action buttons (View Console + Copy).
 */
export const ErrorToast: Story = {
  render: () => (
    <ToastProvider>
      <ToastTrigger
        type="error"
        message="[TAURI_NOT_AVAILABLE] Tauri backend is not available"
        details="Correlation ID: 23b109c8-292b-4c34-8f3c-1059255261e6"
        correlationId="23b109c8-292b-4c34-8f3c-1059255261e6"
      />
    </ToastProvider>
  ),
};

/**
 * Warning toast with yellow/amber left border accent.
 */
export const WarningToast: Story = {
  render: () => (
    <ToastProvider>
      <ToastTrigger type="warning" message="Breaking change detected" />
    </ToastProvider>
  ),
};

/**
 * Success toast with green left border accent.
 */
export const SuccessToast: Story = {
  render: () => (
    <ToastProvider>
      <ToastTrigger type="success" message="Request completed successfully" />
    </ToastProvider>
  ),
};

/**
 * Info toast with blue left border accent.
 */
export const InfoToast: Story = {
  render: () => (
    <ToastProvider>
      <ToastTrigger type="info" message="New feature available" />
    </ToastProvider>
  ),
};

/**
 * Multiple toasts stacked vertically (up to maxNotifications: 3).
 */
export const MultipleToasts: Story = {
  render: () => {
    const { enqueue } = useToastStore();

    useEffect(() => {
      // Clear toasts on mount
      useToastStore.setState({ toasts: [] });
    }, []);

    return (
      <ToastProvider>
        <div className="p-8 space-y-3">
          <Button
            onClick={(): void => {
              enqueue({ type: 'error', message: 'Error toast 1' });
              enqueue({ type: 'warning', message: 'Warning toast 2' });
              enqueue({ type: 'success', message: 'Success toast 3' });
            }}
          >
            Show 3 toasts
          </Button>
        </div>
      </ToastProvider>
    );
  },
};

/**
 * Error toast with long message to test wrapping and layout.
 */
export const LongMessage: Story = {
  render: () => (
    <ToastProvider>
      <ToastTrigger
        type="error"
        message="This is a very long error message that should wrap properly across multiple lines to demonstrate how the toast handles extended text content without breaking the layout"
      />
    </ToastProvider>
  ),
};

/**
 * Interactive demo: Clear toasts before each interaction.
 */
export const Interactive: Story = {
  render: () => {
    const { enqueue, clear } = useToastStore();

    useEffect(() => {
      // Clear toasts on mount
      clear();
    }, [clear]);

    return (
      <ToastProvider>
        <div className="p-8 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={(): void => {
                enqueue({ type: 'error', message: 'Error occurred' });
              }}
            >
              Error
            </Button>
            <Button
              onClick={(): void => {
                enqueue({ type: 'warning', message: 'Warning message' });
              }}
            >
              Warning
            </Button>
            <Button
              onClick={(): void => {
                enqueue({ type: 'success', message: 'Success message' });
              }}
            >
              Success
            </Button>
            <Button
              onClick={(): void => {
                enqueue({ type: 'info', message: 'Info message' });
              }}
            >
              Info
            </Button>
          </div>
          <Button
            onClick={(): void => {
              clear();
            }}
            variant="outline"
          >
            Clear All
          </Button>
        </div>
      </ToastProvider>
    );
  },
};

/**
 * Event-driven toast: Click to emit toast.show event (loose coupling).
 */
export const EventDriven: Story = {
  render: () => {
    useEffect(() => {
      useToastStore.setState({ toasts: [] });
      clearDedupCache();
    }, []);

    return (
      <ToastProvider>
        <div className="p-8 space-y-3">
          <p className="text-text-muted text-sm mb-4">
            Toasts triggered via globalEventBus.emit(&apos;toast.show&apos;, ...) for loose
            coupling.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={(): void => {
                globalEventBus.emit<ToastEventPayload>('toast.show', {
                  type: 'error',
                  message: '[HTTP_ERROR] Request failed with status 500',
                  correlationId: 'abc-123',
                });
              }}
            >
              Emit Error Event
            </Button>
            <Button
              onClick={(): void => {
                globalEventBus.emit<ToastEventPayload>('toast.show', {
                  type: 'success',
                  message: 'Request completed successfully',
                });
              }}
            >
              Emit Success Event
            </Button>
          </div>
        </div>
      </ToastProvider>
    );
  },
};

/**
 * Deduplication demo: Click multiple times to see count badge (×N).
 */
export const Deduplication: Story = {
  render: () => {
    const { enqueue } = useToastStore();

    useEffect(() => {
      useToastStore.setState({ toasts: [] });
      clearDedupCache();
    }, []);

    return (
      <ToastProvider>
        <div className="p-8 space-y-3">
          <p className="text-text-muted text-sm mb-4">
            Click multiple times to see deduplication badge (×N).
          </p>
          <Button
            onClick={(): void => {
              enqueue({
                type: 'error',
                message: '[TAURI_NOT_AVAILABLE] Tauri backend not available',
              });
            }}
          >
            Trigger Same Error
          </Button>
        </div>
      </ToastProvider>
    );
  },
};
