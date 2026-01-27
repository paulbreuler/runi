/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file StatusBar Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { StatusBar } from './StatusBar';
import { showToast, clearToasts } from '@/components/ui/Toaster';

const meta = {
  title: 'Layout/StatusBar',
  component: StatusBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Status bar component that displays application status information, metrics monitoring, and notification center.

## Features

- **Environment Display**: Shows current environment name (default: "default")
- **Request Count**: Shows number of requests in history
- **Metrics Button**: Opens/closes metrics panel tray with pulsing glow indicator
- **Compact Metrics Display**: Shows live metrics inline when feature is enabled
- **Version Display**: Displays application version from build-time define
- **Notification Center**: Bell icon (rightmost) with unread badge, shows notification history

## Toast Bell

The rightmost element is a bell icon that shows active toasts:

- **Badge**: Shows count of active toasts (99+ for overflow)
- **Click**: Toggles Sonner toast stack expansion
- **Visual Indicator**: Shows when stack is expanded

## Pulsing Glow States

The Metrics button includes a pulsing glow indicator with three states:

- **init**: Strong pulse when metrics are not yet initialized
- **tracking**: Faint pulse when metrics are actively updating (live)
- **idle**: No pulse when metrics exist but not live, or feature is disabled

## State Management

- Uses \`useSettingsStore\` for \`metricsVisible\` toggle state
- Uses \`useMetricsStore\` for metrics data, timestamp, and live status
- Toast tracking managed by Toaster module (active toast count)
- Local state manages panel open/close

## Accessibility

- Full keyboard navigation support
- Focus ring styling for all interactive elements
- ARIA labels for button states
- Click outside to close panels
- Escape key closes panels

## Usage

\`\`\`tsx
import { StatusBar } from '@/components/Layout/StatusBar';

// Typically used in MainLayout at the bottom
<StatusBar />
\`\`\`

The component requires no props and manages all state internally via Zustand stores.`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground for StatusBar.
 *
 * - Click the "Metrics" button to open/close the metrics panel tray
 * - Click the bell icon (rightmost) to expand/collapse toast stack
 * - The pulsing glow indicator shows the current metrics state (init/tracking/idle)
 * - Compact metrics display appears when metrics are enabled and data exists
 */
export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Interactive example showing the StatusBar in its typical layout position. Click the Metrics button to see the tray animation and metrics panel. Click the bell icon to see the notification center.',
      },
    },
  },
  render: () => (
    <div className="fixed inset-0 flex flex-col">
      <div className="flex-1 bg-bg-app" />
      <div className="border-t border-border-default bg-bg-app">
        <StatusBar />
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify status bar elements', async () => {
      // Metrics button
      const metricsButton = canvas.getByTestId('status-bar-metrics-button');
      await expect(metricsButton).toBeInTheDocument();

      // Toast bell button (rightmost)
      const toastBell = canvas.getByTestId('toast-bell-button');
      await expect(toastBell).toBeInTheDocument();
    });
  },
};

/**
 * StatusBar with active toasts to demonstrate the toast bell.
 */
export const WithActiveToasts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'StatusBar with sample active toasts. Click the bell icon to expand/collapse the toast stack.',
      },
    },
  },
  render: () => (
    <div className="fixed inset-0 flex flex-col">
      <div className="flex-1 bg-bg-app" />
      <div className="border-t border-border-default bg-bg-app">
        <StatusBar />
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Clear any existing toasts and add sample toasts', () => {
      clearToasts();
      showToast({
        type: 'error',
        message: 'Connection timeout',
        details: 'Failed to reach api.example.com after 30s',
      });
      showToast({
        type: 'warning',
        message: 'Deprecated endpoint detected',
      });
    });

    await step('Verify toast bell shows badge with count', async () => {
      const badge = canvas.getByTestId('toast-bell-badge');
      await expect(badge).toBeInTheDocument();
      await expect(badge).toHaveTextContent('2');
    });

    await step('Verify bell button exists', async () => {
      const bellButton = canvas.getByTestId('toast-bell-button');
      await expect(bellButton).toBeInTheDocument();
    });
  },
};
