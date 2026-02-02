/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file MetricsPanel Storybook stories
 * @description Consolidated story using Storybook 10 controls
 *
 * MetricsPanel displays app metrics in a slide-up NotificationTray panel.
 * Use controls to explore different configurations.
 */

import { useState, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { MetricsPanel, type MetricsPanelProps } from './MetricsPanel';
import { Button } from '@/components/ui/button';
import type { AppMetrics } from '@/types/metrics';

// Mock the stores for Storybook
const mockMetrics: AppMetrics = {
  memory: {
    current: 245.5,
    average: 230.0,
    peak: 300.0,
    threshold: 500.0,
    thresholdPercent: 0.5,
    samplesCount: 42,
  },
};

// No-op function for default args
const noop = (): void => {
  /* intentionally empty */
};

// Default args for stories
const defaultArgs: MetricsPanelProps = {
  isOpen: true,
  onClose: noop,
  metrics: mockMetrics,
  timestamp: Date.now(),
  isLive: true,
};

const meta = {
  title: 'Metrics/MetricsPanel',
  component: MetricsPanel,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `MetricsPanel - Container component that displays app metrics in a NotificationTray.

**Features:**
- Slides up from bottom (36px above status bar)
- Toggle switch to enable/disable metrics collection
- Grid display of memory metrics (current, average, peak, samples)
- Countdown timer showing time until next sample
- Settings button (placeholder for future)

**Architecture:**
- Uses NotificationTray for the slide-up panel UI
- Composes NotificationTrayHeader, NotificationTrayContent, NotificationTrayFooter
- Reads from useMetricsStore and useSettingsStore
- Triggers immediate stats fetch when opened

**Note:** This component requires Zustand stores to be set up. In Storybook,
we provide mock data via props.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the panel is open',
    },
    isLive: {
      control: 'boolean',
      description: 'Whether metrics are actively updating',
    },
  },
  args: defaultArgs,
} satisfies Meta<MetricsPanelProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground for MetricsPanel.
 * Click the button to open/close the panel.
 */
export const Playground: Story = {
  args: defaultArgs,
  render: function PlaygroundStory(args) {
    const [isOpen, setIsOpen] = useState(args.isOpen);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
      <div className="h-screen bg-bg-app flex flex-col">
        {/* Main content area */}
        <div className="flex-1 p-8">
          <h1 className="text-xl font-semibold text-text-primary mb-4">MetricsPanel Demo</h1>
          <p className="text-text-secondary mb-4">
            Click the Metrics button in the status bar below to open the panel.
          </p>
          <div className="bg-bg-surface p-4 rounded-lg border border-border-default">
            <h2 className="text-sm font-medium text-text-primary mb-2">Current Props:</h2>
            <pre className="text-xs text-text-muted font-mono">
              {JSON.stringify(
                {
                  isOpen,
                  isLive: args.isLive,
                  metrics: args.metrics,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        {/* Simulated status bar */}
        <div className="h-9 border-t border-border-subtle bg-bg-surface/80 flex items-center px-5">
          <Button
            ref={buttonRef}
            variant="ghost"
            size="xs"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            data-test-id="metrics-trigger-button"
            className={isOpen ? 'bg-bg-raised' : ''}
          >
            Metrics
            {args.metrics.memory !== undefined && (
              <span className="ml-2 font-mono text-text-secondary">
                {args.metrics.memory.current.toFixed(1)} MB
              </span>
            )}
          </Button>
        </div>

        {/* MetricsPanel */}
        <MetricsPanel
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
          }}
          buttonRef={buttonRef}
          metrics={args.metrics}
          timestamp={args.timestamp}
          isLive={args.isLive}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify MetricsPanel is open by default', async () => {
      await expect(canvas.getByTestId('metrics-panel')).toBeInTheDocument();
      await expect(canvas.getByTestId('notification-tray-header')).toBeInTheDocument();
    });

    await step('Verify metrics grid is displayed', async () => {
      await expect(canvas.getByTestId('metrics-grid')).toBeInTheDocument();
      await expect(canvas.getByTestId('metrics-grid-label-current')).toBeInTheDocument();
      await expect(canvas.getByTestId('metrics-grid-value-current')).toBeInTheDocument();
    });

    await step('Verify toggle switch is present', async () => {
      await expect(canvas.getByTestId('metrics-switch')).toBeInTheDocument();
    });

    await step('Close and reopen panel', async () => {
      const closeButton = canvas.getByTestId('notification-tray-close-button');
      await userEvent.click(closeButton);
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Reopen via trigger (close may still be animating in play env)
      const triggerButton = canvas.getByTestId('metrics-trigger-button');
      await userEvent.click(triggerButton);
      await expect(canvas.getByTestId('metrics-panel')).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for MetricsPanel. The panel opens by default. Use the Metrics button to toggle, or the close button/Escape key to close.',
      },
    },
  },
};

/**
 * MetricsPanel with no metrics data (initial state).
 */
export const NoMetrics: Story = {
  args: {
    ...defaultArgs,
    metrics: {},
    isLive: false,
  },
  render: function NoMetricsStory(args) {
    const [isOpen, setIsOpen] = useState(true);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
      <div className="h-screen bg-bg-app flex flex-col">
        <div className="flex-1 p-8">
          <h1 className="text-xl font-semibold text-text-primary mb-4">No Metrics State</h1>
          <p className="text-text-secondary">
            This shows the panel when metrics haven&apos;t been collected yet.
          </p>
        </div>
        <div className="h-9 border-t border-border-subtle bg-bg-surface/80 flex items-center px-5">
          <Button
            ref={buttonRef}
            variant="ghost"
            size="xs"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            Metrics
          </Button>
        </div>
        <MetricsPanel
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
          }}
          buttonRef={buttonRef}
          metrics={args.metrics}
          timestamp={args.timestamp}
          isLive={args.isLive}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'MetricsPanel when no metrics have been collected yet. Shows empty/placeholder state.',
      },
    },
  },
};

/**
 * MetricsPanel when metrics are stale (not live).
 */
export const StaleMetrics: Story = {
  args: {
    ...defaultArgs,
    timestamp: Date.now() - 60000, // 1 minute ago
    isLive: false,
  },
  render: function StaleMetricsStory(args) {
    const [isOpen, setIsOpen] = useState(true);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
      <div className="h-screen bg-bg-app flex flex-col">
        <div className="flex-1 p-8">
          <h1 className="text-xl font-semibold text-text-primary mb-4">Stale Metrics State</h1>
          <p className="text-text-secondary">
            This shows the panel when metrics exist but are no longer updating (isLive: false).
          </p>
        </div>
        <div className="h-9 border-t border-border-subtle bg-bg-surface/80 flex items-center px-5">
          <Button
            ref={buttonRef}
            variant="ghost"
            size="xs"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
          >
            Metrics
          </Button>
        </div>
        <MetricsPanel
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
          }}
          buttonRef={buttonRef}
          metrics={args.metrics}
          timestamp={args.timestamp}
          isLive={args.isLive}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'MetricsPanel when metrics exist but are stale (no longer receiving updates). The countdown shows "—" instead of a number.',
      },
    },
  },
};
