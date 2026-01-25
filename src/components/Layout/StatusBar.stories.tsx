/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file StatusBar Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBar } from './StatusBar';

const meta = {
  title: 'Layout/StatusBar',
  component: StatusBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Status bar component that displays application status information and provides access to metrics monitoring.

## Features

- **Environment Display**: Shows current environment name (default: "default")
- **Metrics Button**: Opens/closes metrics panel dialog with pulsing glow indicator
- **Compact Metrics Display**: Shows live metrics inline when feature is enabled
- **Version Display**: Displays application version from build-time define
- **Metrics Panel Dialog**: Appears 36px above status bar when opened, aligned to Metrics button

## Pulsing Glow States

The Metrics button includes a pulsing glow indicator with three states:

- **init**: Strong pulse when metrics are not yet initialized (\`metrics.memory === undefined\`)
- **tracking**: Faint pulse when metrics are actively updating (live) and feature is enabled
- **idle**: No pulse when metrics exist but not live, or feature is disabled

## State Management

- Uses \`useSettingsStore\` for \`metricsVisible\` toggle state
- Uses \`useMetricsStore\` for metrics data, timestamp, and live status
- Local state manages dialog open/close (\`isPanelOpen\`)

## Metrics Display Logic

- Compact metrics display appears on the status bar when:
  - Metrics feature is enabled (\`metricsVisible === true\`)
  - Metrics data exists (\`metrics.memory !== undefined\`)
- Metrics panel dialog shows full metrics grid with toggle controls

## Accessibility

- Full keyboard navigation support
- Focus ring styling for Metrics button
- ARIA labels for Metrics button states
- Click outside to close dialog
- Escape key closes dialog

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
 * - Click the "Metrics" button to open/close the metrics panel dialog
 * - The dialog appears 36px above the status bar, aligned to the Metrics button
 * - The pulsing glow indicator shows the current metrics state (init/tracking/idle)
 * - Compact metrics display appears when metrics are enabled and data exists
 * - Version and environment information are displayed on the right side
 */
export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Interactive example showing the StatusBar in its typical layout position. Click the Metrics button to see the dialog animation and metrics panel. The pulsing glow indicator reflects the current metrics state.',
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
};
