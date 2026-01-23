/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimingWaterfall } from './TimingWaterfall';

const meta = {
  title: 'Components/History/TimingWaterfall',
  component: TimingWaterfall,
  parameters: {
    layout: 'centered',
    test: {
      skip: true, // Display-only component, no interactive elements to test
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TimingWaterfall>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Typical request with all timing phases.
 */
export const Default: Story = {
  args: {
    segments: {
      dns: 15,
      connect: 25,
      tls: 35,
      wait: 80,
      download: 45,
    },
    totalMs: 200,
  },
  render: (args) => (
    <div className="w-80 bg-bg-surface p-4 rounded">
      <TimingWaterfall {...args} />
    </div>
  ),
};

/**
 * With legend showing all segment values.
 */
export const WithLegend: Story = {
  args: {
    segments: {
      dns: 15,
      connect: 25,
      tls: 35,
      wait: 80,
      download: 45,
    },
    totalMs: 200,
    showLegend: true,
  },
  render: (args) => (
    <div className="w-96 bg-bg-surface p-4 rounded">
      <TimingWaterfall {...args} />
    </div>
  ),
};

/**
 * Compact mode showing just the bar and total time.
 */
export const Compact: Story = {
  args: {
    segments: {
      dns: 10,
      connect: 20,
      tls: 30,
      wait: 50,
      download: 40,
    },
    totalMs: 150,
    compact: true,
  },
  render: (args) => (
    <div className="w-48 bg-bg-surface p-4 rounded">
      <TimingWaterfall {...args} />
    </div>
  ),
};

/**
 * Fast request - mostly wait time.
 */
export const FastRequest: Story = {
  args: {
    segments: {
      dns: 1,
      connect: 3,
      tls: 5,
      wait: 15,
      download: 6,
    },
    totalMs: 30,
    showLegend: true,
  },
  render: (args) => (
    <div className="w-96 bg-bg-surface p-4 rounded">
      <TimingWaterfall {...args} />
    </div>
  ),
};

/**
 * Slow request - dominated by wait time (server processing).
 */
export const SlowServer: Story = {
  args: {
    segments: {
      dns: 10,
      connect: 20,
      tls: 30,
      wait: 1500,
      download: 40,
    },
    totalMs: 1600,
    showLegend: true,
  },
  render: (args) => (
    <div className="w-96 bg-bg-surface p-4 rounded">
      <TimingWaterfall {...args} />
    </div>
  ),
};

/**
 * HTTP only (no TLS).
 */
export const HttpNoTls: Story = {
  args: {
    segments: {
      dns: 10,
      connect: 20,
      tls: 0,
      wait: 100,
      download: 50,
    },
    totalMs: 180,
    showLegend: true,
  },
  render: (args) => (
    <div className="w-96 bg-bg-surface p-4 rounded">
      <TimingWaterfall {...args} />
    </div>
  ),
};

/**
 * Empty state when no timing data is available.
 */
export const Empty: Story = {
  args: {
    segments: undefined,
    totalMs: 150,
  },
  render: (args) => (
    <div className="w-80 bg-bg-surface p-4 rounded">
      <TimingWaterfall {...args} />
    </div>
  ),
};

/**
 * Different heights for table vs expanded view.
 */
export const DifferentHeights: Story = {
  args: {
    segments: {
      dns: 15,
      connect: 25,
      tls: 35,
      wait: 80,
      download: 45,
    },
    totalMs: 200,
  },
  render: () => (
    <div className="w-80 bg-bg-surface p-4 rounded flex flex-col gap-4">
      <div>
        <p className="text-xs text-text-muted mb-1">h-1 (table row)</p>
        <TimingWaterfall
          segments={{ dns: 15, connect: 25, tls: 35, wait: 80, download: 45 }}
          totalMs={200}
          height="h-1"
        />
      </div>
      <div>
        <p className="text-xs text-text-muted mb-1">h-2 (default)</p>
        <TimingWaterfall
          segments={{ dns: 15, connect: 25, tls: 35, wait: 80, download: 45 }}
          totalMs={200}
          height="h-2"
        />
      </div>
      <div>
        <p className="text-xs text-text-muted mb-1">h-3 (expanded)</p>
        <TimingWaterfall
          segments={{ dns: 15, connect: 25, tls: 35, wait: 80, download: 45 }}
          totalMs={200}
          height="h-3"
        />
      </div>
    </div>
  ),
};
