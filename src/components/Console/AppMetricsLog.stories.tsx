/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file AppMetricsLog Storybook stories
 * @description Consolidated story using Storybook 10 controls
 *
 * AppMetricsLog displays application metrics (memory, CPU, etc.) in a formatted log.
 * Use controls to explore different metric values and states.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { AppMetricsLog, type AppMetricsLogProps } from './AppMetricsLog';
import type { AppMetrics } from '@/types/metrics';

// Custom args for story controls (not part of component props)
interface AppMetricsLogStoryArgs {
  currentMemory?: number;
  averageMemory?: number;
  peakMemory?: number;
  threshold?: number;
  thresholdPercent?: number;
  samplesCount?: number;
  isLive?: boolean;
}

const meta = {
  title: 'Console/AppMetricsLog',
  component: AppMetricsLog,
  parameters: {
    layout: 'padded',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `Presentational component for displaying application metrics in the console.

**Features:**
- Memory Metrics Display: Shows current, average, peak, and threshold values
- Updating Indicator: Visual indicator when metrics are updating in real-time
- Formatted Values: Human-readable memory values (MB/GB)
- Extensible: Designed to support future metric types (CPU, network, etc.)

Use the Controls panel to explore different metric values and states.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    currentMemory: {
      control: { type: 'number', min: 0, max: 10000, step: 10 },
      description: 'Current memory usage in MB',
    },
    averageMemory: {
      control: { type: 'number', min: 0, max: 10000, step: 10 },
      description: 'Average memory usage in MB',
    },
    peakMemory: {
      control: { type: 'number', min: 0, max: 10000, step: 10 },
      description: 'Peak memory usage in MB',
    },
    threshold: {
      control: { type: 'number', min: 0, max: 10000, step: 100 },
      description: 'Memory threshold in MB',
    },
    thresholdPercent: {
      control: { type: 'number', min: 0, max: 1, step: 0.01 },
      description: 'Threshold as percentage of total RAM (0-1)',
    },
    samplesCount: {
      control: { type: 'number', min: 0, max: 1000, step: 1 },
      description: 'Number of samples collected',
    },
    isLive: {
      control: 'boolean',
      description: 'Whether metrics are actively updating (live)',
    },
  },
  args: {
    currentMemory: 245.5,
    averageMemory: 220.3,
    peakMemory: 300.0,
    threshold: 1536.0,
    thresholdPercent: 0.4,
    samplesCount: 10,
    isLive: false,
  },
} satisfies Meta<AppMetricsLogProps & AppMetricsLogStoryArgs>;

export default meta;
type Story = StoryObj<AppMetricsLogProps & AppMetricsLogStoryArgs>;

/**
 * Playground with controls for all AppMetricsLog features.
 * Use controls to explore different memory values and updating states.
 */
export const Playground: Story = {
  render: (args) => {
    const metrics: AppMetrics = {
      memory:
        args.currentMemory !== undefined ||
        args.averageMemory !== undefined ||
        args.peakMemory !== undefined ||
        args.threshold !== undefined ||
        args.thresholdPercent !== undefined ||
        args.samplesCount !== undefined
          ? {
              current: args.currentMemory ?? 245.5,
              average: args.averageMemory ?? 220.3,
              peak: args.peakMemory ?? 300.0,
              threshold: args.threshold ?? 1536.0,
              thresholdPercent: args.thresholdPercent ?? 0.4,
              samplesCount: args.samplesCount ?? 10,
            }
          : undefined,
    };

    return <AppMetricsLog metrics={metrics} timestamp={Date.now()} isLive={args.isLive} />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify AppMetricsLog renders', async () => {
      const log = await canvas.findByTestId('app-metrics-log', {}, { timeout: 3000 });
      await expect(log).toBeInTheDocument();
    });

    await step('Verify memory metrics display is visible', async () => {
      const display = await canvas.findByTestId('memory-metrics-display', {}, { timeout: 3000 });
      await expect(display).toBeInTheDocument();
      // Verify it contains formatted memory values
      await expect(display).toHaveTextContent('Current:');
      await expect(display).toHaveTextContent('Average:');
      await expect(display).toHaveTextContent('Peak:');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for AppMetricsLog. Use the Controls panel to configure memory values, threshold, and updating state. The component displays formatted memory metrics with human-readable values.',
      },
    },
  },
};

/**
 * Demonstrates the live indicator when metrics are actively updating.
 * Shows the "(updating)" text indicator and data-live attribute.
 */
export const Updating: Story = {
  render: (args) => {
    const metrics: AppMetrics = {
      memory: {
        current: args.currentMemory ?? 245.5,
        average: args.averageMemory ?? 220.3,
        peak: args.peakMemory ?? 300.0,
        threshold: args.threshold ?? 1536.0,
        thresholdPercent: args.thresholdPercent ?? 0.4,
        samplesCount: args.samplesCount ?? 10,
      },
    };

    return <AppMetricsLog metrics={metrics} timestamp={Date.now()} isLive={true} />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify updating indicator is visible', async () => {
      const log = await canvas.findByTestId('app-metrics-log', {}, { timeout: 3000 });
      await expect(log).toHaveAttribute('data-live', 'true');

      const indicator = await canvas.findByTestId('updating-indicator', {}, { timeout: 3000 });
      await expect(indicator).toBeInTheDocument();
      await expect(indicator).toHaveTextContent('(updating)');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the updating indicator when metrics are updating in real-time. The component shows "(updating)" text and sets the data-updating attribute to "true".',
      },
    },
  },
};

/**
 * Demonstrates the component when no memory metrics are available.
 * Shows that the component still renders but without the memory display.
 */
export const NoMemoryMetrics: Story = {
  render: () => {
    const metrics: AppMetrics = {};

    return <AppMetricsLog metrics={metrics} timestamp={Date.now()} />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify component renders without memory metrics', async () => {
      const log = await canvas.findByTestId('app-metrics-log', {}, { timeout: 3000 });
      await expect(log).toBeInTheDocument();
      // Memory display should not be present
      const display = canvas.queryByTestId('memory-metrics-display');
      await expect(display).not.toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates the component behavior when no memory metrics are available. The component still renders but does not display memory metrics.',
      },
    },
  },
};
