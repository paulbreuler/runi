/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file MemoryWarningListener Storybook stories
 * @description Consolidated story using Storybook 10 controls
 *
 * MemoryWarningListener listens for memory threshold exceeded events and shows warnings.
 * Use controls to explore different warning states and thresholds.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { MemoryWarningListener, type MemoryWarningListenerProps } from './MemoryWarningListener';
import { ToastProvider } from '@/components/ui/Toast';

const meta = {
  title: 'Memory/MemoryWarningListener',
  component: MemoryWarningListener,
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `Component that listens for memory threshold exceeded events and shows warnings.

**Features:**
- Listens to Tauri memory:threshold-exceeded events
- Shows warning toast when memory threshold is exceeded (first time)
- After toast dismissal, switches to console logging
- Hidden component (no visual rendering, only event handling)

**Note**: This component is hidden (display: none) and only handles events. In Storybook, you won't see visual output unless a memory threshold event is emitted. The component is typically used at the app root level.
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<MemoryWarningListenerProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Playground story for MemoryWarningListener.
 * Component is hidden but listens for memory threshold events.
 */
export const Playground: Story = {
  render: () => {
    return <MemoryWarningListener />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify MemoryWarningListener renders (hidden)', async () => {
      const listener = await canvas.findByTestId('memory-warning-listener', {}, { timeout: 3000 });
      await expect(listener).toBeInTheDocument();
      // Verify it's hidden
      const styles = window.getComputedStyle(listener);
      await expect(styles.display).toBe('none');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'MemoryWarningListener is a hidden component that listens for memory threshold events. It shows a toast on first threshold exceed, then logs to console after dismissal. The component itself is not visible.',
      },
    },
  },
};

/**
 * Demonstrates the component structure.
 * Since the component is hidden and event-driven, this story mainly verifies it renders correctly.
 */
export const Default: Story = {
  render: () => {
    return <MemoryWarningListener />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify component structure', async () => {
      const listener = await canvas.findByTestId('memory-warning-listener', {}, { timeout: 3000 });
      await expect(listener).toBeInTheDocument();
      // Component should be hidden
      const styles = window.getComputedStyle(listener);
      await expect(styles.display).toBe('none');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state of MemoryWarningListener. The component is hidden and ready to listen for memory threshold events.',
      },
    },
  },
};
