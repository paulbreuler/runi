/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Toaster, showToast, clearToasts, clearDedupCache } from './Toaster';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { Button } from './button';

/**
 * Wrapper component for Storybook that provides the toast context.
 * Includes min-height container so fixed-positioned toasts are visible in docs mode.
 */
const ToasterStoryWrapper = ({ children }: { children?: React.ReactNode }): React.JSX.Element => (
  <>
    <Toaster />
    <div className="relative min-h-[300px] w-full">{children}</div>
  </>
);

const meta = {
  title: 'UI/Toaster',
  decorators: [
    (Story): React.JSX.Element => (
      <ToasterStoryWrapper>
        <Story />
      </ToasterStoryWrapper>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Toast notification system powered by Sonner. Toasts can be triggered via `showToast()` or `globalEventBus.emit("toast.show", ...)`.',
      },
      story: {
        inline: false,
        iframeHeight: 400,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story showing the Toaster component.
 * The Toaster itself is invisible until toasts are triggered.
 */
export const Default: Story = {
  render: (): React.JSX.Element => (
    <div className="p-8">
      <p className="text-text-muted text-sm mb-4">
        The Toaster component renders the toast container. Toasts appear in the bottom-right corner
        when triggered via <code className="text-xs">showToast()</code> or{' '}
        <code className="text-xs">globalEventBus.emit(&apos;toast.show&apos;, ...)</code>.
      </p>
      <Button
        onClick={(): void => {
          showToast({ type: 'info', message: 'Toaster is working!' });
        }}
      >
        Show Test Toast
      </Button>
    </div>
  ),
};

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
  return (
    <div className="p-8">
      <Button
        onClick={(): void => {
          showToast({ type, message, details, correlationId });
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const toast = await within(document.body).findByText(
        /tauri backend is not available/i,
        {},
        { timeout: 10000 }
      );
      await expect(toast).toBeVisible();
    });

    await step('Error toast has dismiss button', async () => {
      const toast = await within(document.body).findByText(
        /tauri backend is not available/i,
        {},
        { timeout: 5000 }
      );
      const dismissButton = within(toast.closest('[role="status"]') ?? toast).getByRole('button', {
        name: /dismiss notification/i,
      });
      await expect(dismissButton).toBeVisible();
      await userEvent.click(dismissButton);
      // Wait for toast to be removed
      await new Promise((resolve) => setTimeout(resolve, 500));
      await expect(toast).not.toBeInTheDocument();
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
 * Multiple toasts stacked vertically (up to 3 visible).
 */
export const MultipleToasts: Story = {
  render: (): React.JSX.Element => {
    const MultipleToastsDemo = (): React.JSX.Element => {
      useEffect(() => {
        clearToasts();
        clearDedupCache();
      }, []);

      return (
        <div className="p-8 space-y-3">
          <Button
            onClick={(): void => {
              showToast({ type: 'error', message: 'Error toast 1' });
              showToast({ type: 'warning', message: 'Warning toast 2' });
              showToast({ type: 'success', message: 'Success toast 3' });
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
      useEffect(() => {
        clearToasts();
        clearDedupCache();
      }, []);

      return (
        <div className="p-8 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={(): void => {
                showToast({ type: 'error', message: 'Error occurred' });
              }}
            >
              Error
            </Button>
            <Button
              onClick={(): void => {
                showToast({ type: 'warning', message: 'Warning message' });
              }}
            >
              Warning
            </Button>
            <Button
              onClick={(): void => {
                showToast({ type: 'success', message: 'Success message' });
              }}
            >
              Success
            </Button>
            <Button
              onClick={(): void => {
                showToast({ type: 'info', message: 'Info message' });
              }}
            >
              Info
            </Button>
          </div>
          <Button
            onClick={(): void => {
              clearToasts();
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const errorToast = await within(document.body).findByText(
        /error occurred/i,
        {},
        { timeout: 10000 }
      );
      await expect(errorToast).toBeVisible();

      const successButton = canvas.getByRole('button', { name: /^success$/i });
      await userEvent.click(successButton);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const successToast = await within(document.body).findByText(
        /success message/i,
        {},
        { timeout: 10000 }
      );
      await expect(successToast).toBeVisible();
    });

    await step('Clear all button removes all toasts', async () => {
      const clearButton = canvas.getByRole('button', { name: /clear all/i });
      await userEvent.click(clearButton);
      await new Promise((resolve) => setTimeout(resolve, 600));
      const toasts = within(document.body).queryAllByRole('status');
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
      useEffect(() => {
        clearToasts();
        clearDedupCache();
      }, []);

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
 * Deduplication: identical toasts show count badge (xN) instead of stacking.
 */
export const Deduplication: Story = {
  render: (): React.JSX.Element => {
    const DeduplicationDemo = (): React.JSX.Element => {
      useEffect(() => {
        clearToasts();
        clearDedupCache();
      }, []);

      return (
        <div className="p-8 space-y-3">
          <p className="text-text-muted text-sm mb-4">
            Click multiple times to see deduplication badge (xN).
          </p>
          <Button
            onClick={(): void => {
              showToast({
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
