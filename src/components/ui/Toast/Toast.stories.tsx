/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Toast Storybook stories
 * @description Stories for the Toast notification system
 *
 * Toast provides non-blocking notifications with:
 * - Multiple variants (success, error, warning, info)
 * - Deduplication with counter display
 * - Event bus integration
 * - View Console action for errors
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within, waitFor } from 'storybook/test';
import { ToastProvider } from './ToastProvider';
import { ToastBell } from './ToastBell';
import { toast, useToastStore } from './useToast';
import { Button } from '@/components/ui/button';

/**
 * Wrapper component for stories that manages toast state.
 */
const ToastDemo = ({ showBell = false }: { showBell?: boolean }): React.JSX.Element => {
  // Clear toasts when component mounts (for story isolation)
  useToastStore.getState().clearAll();

  return (
    <ToastProvider>
      <div className="min-h-[400px] p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={(): void => {
              toast.success({ message: 'Request sent successfully!' });
            }}
            data-testid="trigger-success"
          >
            Success Toast
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(): void => {
              toast.error({
                message: 'Request failed',
                details: 'Network connection timeout after 30s',
                correlationId: 'error-123',
              });
            }}
            data-testid="trigger-error"
          >
            Error Toast
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(): void => {
              toast.warning({ message: 'Rate limit approaching (90%)' });
            }}
            data-testid="trigger-warning"
          >
            Warning Toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(): void => {
              toast.info({ message: 'New version available', details: 'Version 0.3.0 is ready' });
            }}
            data-testid="trigger-info"
          >
            Info Toast
          </Button>
        </div>

        {showBell && (
          <div className="flex items-center gap-2 p-2 bg-bg-surface rounded border border-border-subtle">
            <span className="text-sm text-text-muted">Notification Bell:</span>
            <ToastBell />
          </div>
        )}

        <div className="text-xs text-text-muted">
          <p>• Success toasts auto-dismiss after 3s</p>
          <p>• Error toasts persist until dismissed</p>
          <p>• Duplicate messages show a counter (xN)</p>
        </div>
      </div>
    </ToastProvider>
  );
};

const meta = {
  title: 'UI/Toast',
  component: ToastDemo,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Toast notification system using Radix UI primitives and Motion animations.

**Features:**
- Four variants: success, error, warning, info
- Deduplication with "(xN)" counter for repeated messages
- Event bus integration for loose coupling
- "View Console" action on error toasts with correlationId
- Swipe-to-dismiss support
- Spring animations with reduced motion support

**Usage:**
\`\`\`tsx
import { toast } from '@/components/ui/Toast';

toast.success({ message: 'Request sent!' });
toast.error({ message: 'Failed', details: 'Network error' });
\`\`\`

**Event Bus:**
\`\`\`tsx
globalEventBus.emit('toast.show', {
  type: 'success',
  message: 'Request sent!',
});
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  // Clear toasts before each story
  beforeEach: () => {
    useToastStore.getState().clearAll();
  },
} satisfies Meta<typeof ToastDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground to test all toast variants.
 * Click the buttons to trigger different toast types.
 */
export const Playground: Story = {
  render: () => <ToastDemo />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger success toast', async () => {
      const successBtn = canvas.getByTestId('trigger-success');
      await userEvent.click(successBtn);

      await waitFor(
        async () => {
          const toastViewport = document.querySelector('[data-testid="toast-viewport"]');
          await expect(toastViewport).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    await step('Trigger error toast', async () => {
      const errorBtn = canvas.getByTestId('trigger-error');
      await userEvent.click(errorBtn);

      await waitFor(
        async () => {
          const errorMessage = document.body.querySelector('[data-variant="error"]');
          await expect(errorMessage).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    await step('Verify View Console button on error toast', async () => {
      await waitFor(
        async () => {
          const viewConsole = document.body.querySelector('button[data-testid*="view-console"]');
          await expect(viewConsole).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    await step('Dismiss error toast', async () => {
      const closeBtn = await waitFor(
        async () => {
          const btn = document.body.querySelector('button[data-testid*="toast-close"]');
          await expect(btn).toBeInTheDocument();
          return btn;
        },
        { timeout: 3000 }
      );

      if (closeBtn !== null) {
        await userEvent.click(closeBtn);
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo of all toast variants. Click buttons to trigger toasts. Error toasts show View Console action and persist until manually dismissed.',
      },
    },
  },
};

/**
 * Demonstrates the deduplication feature.
 * Multiple clicks on the same button increment the counter instead of creating new toasts.
 */
export const Deduplication: Story = {
  render: () => (
    <ToastProvider>
      <div className="min-h-[300px] p-4 space-y-4">
        <Button
          variant="default"
          size="sm"
          onClick={(): void => {
            toast.success({ message: 'Duplicate message' });
          }}
          data-testid="trigger-duplicate"
        >
          Click Multiple Times
        </Button>

        <p className="text-xs text-text-muted">
          Click the button multiple times to see the (xN) counter
        </p>
      </div>
    </ToastProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click button 3 times to trigger deduplication', async () => {
      const btn = canvas.getByTestId('trigger-duplicate');

      // Click 3 times
      await userEvent.click(btn);
      await userEvent.click(btn);
      await userEvent.click(btn);

      // Verify counter shows (x3)
      await waitFor(
        async () => {
          const counter = document.body.querySelector('[data-testid*="toast-count"]');
          await expect(counter).toBeInTheDocument();
          await expect(counter?.textContent).toBe('(x3)');
        },
        { timeout: 3000 }
      );
    });

    await step('Verify only one toast element exists', async () => {
      const toasts = document.body.querySelectorAll('[data-variant="success"]');
      await expect(toasts.length).toBe(1);
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates deduplication: clicking the button multiple times increments the counter (xN) instead of creating separate toasts.',
      },
    },
  },
};

/**
 * Shows the ToastBell component that displays notification count.
 */
export const NotificationBell: Story = {
  render: () => <ToastDemo showBell />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify bell is visible', async () => {
      const bell = canvas.getByTestId('toast-bell');
      await expect(bell).toBeInTheDocument();
    });

    await step('Bell has no badge initially', async () => {
      const badge = canvas.queryByTestId('toast-bell-badge');
      await expect(badge).not.toBeInTheDocument();
    });

    await step('Trigger toast and verify badge appears', async () => {
      const successBtn = canvas.getByTestId('trigger-success');
      await userEvent.click(successBtn);

      await waitFor(
        async () => {
          const badge = canvas.getByTestId('toast-bell-badge');
          await expect(badge).toBeInTheDocument();
          await expect(badge.textContent).toBe('1');
        },
        { timeout: 3000 }
      );
    });

    await step('Add more toasts and verify badge count updates', async () => {
      const errorBtn = canvas.getByTestId('trigger-error');
      const warningBtn = canvas.getByTestId('trigger-warning');

      await userEvent.click(errorBtn);
      await userEvent.click(warningBtn);

      await waitFor(
        async () => {
          const badge = canvas.getByTestId('toast-bell-badge');
          await expect(badge.textContent).toBe('3');
        },
        { timeout: 3000 }
      );
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the ToastBell component with animated badge count. The badge appears when notifications exist and updates dynamically.',
      },
    },
  },
};
