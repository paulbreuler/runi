import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from '@storybook/test';
import { ToastProvider, Toast } from './Toast';
import { useToastStore, clearDedupCache } from '@/stores/useToastStore';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { Button } from './button';

/**
 * Wrapper component for Storybook that provides the toast context.
 * Includes min-height container so fixed-positioned toasts are visible in docs mode.
 */
const ToastStoryWrapper = ({ children }: { children?: React.ReactNode }): React.JSX.Element => (
  <ToastProvider>
    <div className="relative min-h-[300px] w-full">{children}</div>
  </ToastProvider>
);

const meta = {
  title: 'Components/UI/Toast',
  component: Toast,
  decorators: [
    (Story): React.JSX.Element => (
      <ToastStoryWrapper>
        <Story />
      </ToastStoryWrapper>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Toast notification system with event-driven architecture. Toasts can be triggered via `useToastStore.enqueue()` or `globalEventBus.emit("toast.show", ...)`.',
      },
      story: {
        inline: false,
        iframeHeight: 400,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Helper component to trigger toasts via button click.
 */
const ToastTrigger = ({
  type,
  message,
  details,
  correlationId,
  buttonLabel,
}: {
  type: 'error' | 'warning' | 'success' | 'info';
  message: string;
  details?: string;
  correlationId?: string;
  buttonLabel?: string;
}): React.JSX.Element => {
  const { enqueue } = useToastStore();

  return (
    <div className="p-8">
      <Button
        onClick={(): void => {
          enqueue({ type, message, details, correlationId });
        }}
      >
        {buttonLabel ?? `Show ${type} toast`}
      </Button>
    </div>
  );
};

/**
 * Error toast with View Console and Copy buttons.
 * Errors require manual dismissal and don't auto-dismiss.
 */
export const ErrorToast: Story = {
  render: (): React.JSX.Element => (
    <ToastTrigger
      type="error"
      message="[TAURI_NOT_AVAILABLE] Tauri backend is not available"
      details="Correlation ID: 23b109c8-292b-4c34-8f3c-1059255261e6"
      correlationId="23b109c8-292b-4c34-8f3c-1059255261e6"
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const triggerButton = canvas.getByRole('button', { name: /show error toast/i });

    await step('Toast appears after button click', async () => {
      await userEvent.click(triggerButton);
      // Wait for toast to appear
      const toast = await canvas.findByRole('alert', { name: /tauri backend is not available/i });
      await expect(toast).toBeVisible();

      await step('Error toast has dismiss button', async () => {
        const dismissButton = canvas.getByRole('button', { name: /close/i });
        await expect(dismissButton).toBeVisible();
        await userEvent.click(dismissButton);
        // Toast should be removed
        await expect(toast).not.toBeInTheDocument();
      });
    });
  },
};

/**
 * Warning toast with amber left border accent.
 */
export const WarningToast: Story = {
  render: (): React.JSX.Element => (
    <ToastTrigger type="warning" message="Breaking change detected in API schema" />
  ),
};

/**
 * Success toast with green left border accent.
 */
export const SuccessToast: Story = {
  render: (): React.JSX.Element => (
    <ToastTrigger type="success" message="Request completed successfully" />
  ),
};

/**
 * Info toast with blue left border accent.
 */
export const InfoToast: Story = {
  render: (): React.JSX.Element => <ToastTrigger type="info" message="New feature available" />,
};

/**
 * Multiple toasts stacked vertically (up to maxNotifications: 3).
 */
export const MultipleToasts: Story = {
  render: (): React.JSX.Element => {
    const MultipleToastsDemo = (): React.JSX.Element => {
      const { enqueue, clear } = useToastStore();

      useEffect(() => {
        clear();
      }, [clear]);

      return (
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
      );
    };
    return <MultipleToastsDemo />;
  },
};

/**
 * Error toast with long message to test text wrapping.
 */
export const LongMessage: Story = {
  render: (): React.JSX.Element => (
    <ToastTrigger
      type="error"
      message="This is a very long error message that should wrap properly across multiple lines to demonstrate how the toast handles extended text content without breaking the layout"
    />
  ),
};

/**
 * Interactive demo with all toast types and clear button.
 */
export const Interactive: Story = {
  render: (): React.JSX.Element => {
    const InteractiveDemo = (): React.JSX.Element => {
      const { enqueue, clear } = useToastStore();

      useEffect(() => {
        clear();
        clearDedupCache();
      }, [clear]);

      return (
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
      );
    };
    return <InteractiveDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Can trigger multiple toast types', async () => {
      const errorButton = canvas.getByRole('button', { name: /^error$/i });
      await userEvent.click(errorButton);
      const errorToast = await canvas.findByRole('alert', { name: /error occurred/i });
      await expect(errorToast).toBeVisible();

      const successButton = canvas.getByRole('button', { name: /^success$/i });
      await userEvent.click(successButton);
      const successToast = await canvas.findByRole('alert', { name: /success message/i });
      await expect(successToast).toBeVisible();
    });

    await step('Clear all button removes all toasts', async () => {
      const clearButton = canvas.getByRole('button', { name: /clear all/i });
      await userEvent.click(clearButton);
      // Wait a bit for toasts to be removed
      await new Promise((resolve) => setTimeout(resolve, 100));
      const toasts = canvas.queryAllByRole('alert');
      await expect(toasts).toHaveLength(0);
    });
  },
};

/**
 * Event-driven toast via globalEventBus (loose coupling pattern).
 */
export const EventDriven: Story = {
  render: (): React.JSX.Element => {
    const EventDrivenDemo = (): React.JSX.Element => {
      const { clear } = useToastStore();

      useEffect(() => {
        clear();
        clearDedupCache();
      }, [clear]);

      return (
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
      );
    };
    return <EventDrivenDemo />;
  },
};

/**
 * Deduplication: identical toasts show count badge (×N) instead of stacking.
 */
export const Deduplication: Story = {
  render: (): React.JSX.Element => {
    const DeduplicationDemo = (): React.JSX.Element => {
      const { enqueue, clear } = useToastStore();

      useEffect(() => {
        clear();
        clearDedupCache();
      }, [clear]);

      return (
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
      );
    };
    return <DeduplicationDemo />;
  },
};
