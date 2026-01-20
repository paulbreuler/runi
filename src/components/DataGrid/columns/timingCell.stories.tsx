/**
 * @file TimingCell Storybook stories
 * @description Visual documentation for request timing cell component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { TimingCell } from './timingCell';

const meta: Meta<typeof TimingCell> = {
  title: 'DataGrid/TimingCell',
  component: TimingCell,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof TimingCell>;

/**
 * Fast, normal, and slow request timings.
 */
export const TimingVariations: Story = {
  render: () => (
    <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Fast Requests</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <TimingCell totalMs={45} />
            <p className="text-xs text-text-muted mt-1">45ms</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={120} />
            <p className="text-xs text-text-muted mt-1">120ms</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={250} />
            <p className="text-xs text-text-muted mt-1">250ms</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Normal Requests</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <TimingCell totalMs={500} />
            <p className="text-xs text-text-muted mt-1">500ms</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={750} />
            <p className="text-xs text-text-muted mt-1">750ms</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={999} />
            <p className="text-xs text-text-muted mt-1">999ms</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Slow Requests (&gt;1000ms)</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <TimingCell totalMs={1000} />
            <p className="text-xs text-text-muted mt-1">1000ms</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={1500} />
            <p className="text-xs text-text-muted mt-1">1500ms</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={3000} />
            <p className="text-xs text-text-muted mt-1">3000ms</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={5000} />
            <p className="text-xs text-text-muted mt-1">5000ms</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Streaming request indicator.
 */
export const Streaming: Story = {
  render: () => (
    <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Streaming Requests</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <TimingCell totalMs={-1} />
            <p className="text-xs text-text-muted mt-1">Using -1 value</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={150} isStreaming />
            <p className="text-xs text-text-muted mt-1">Using isStreaming prop</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Blocked request indicator.
 */
export const Blocked: Story = {
  render: () => (
    <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Blocked Requests</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <TimingCell totalMs={0} />
            <p className="text-xs text-text-muted mt-1">Using 0 value</p>
          </div>
          <div className="text-center">
            <TimingCell totalMs={150} isBlocked />
            <p className="text-xs text-text-muted mt-1">Using isBlocked prop</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * All states together for comparison.
 */
export const AllStates: Story = {
  render: () => (
    <div className="bg-bg-surface p-4 rounded-lg">
      <div className="flex gap-8 items-center">
        <div className="text-center">
          <TimingCell totalMs={150} />
          <p className="text-xs text-text-muted mt-1">Fast</p>
        </div>
        <div className="text-center">
          <TimingCell totalMs={500} />
          <p className="text-xs text-text-muted mt-1">Normal</p>
        </div>
        <div className="text-center">
          <TimingCell totalMs={1500} />
          <p className="text-xs text-text-muted mt-1">Slow (red)</p>
        </div>
        <div className="text-center">
          <TimingCell totalMs={-1} />
          <p className="text-xs text-text-muted mt-1">Streaming</p>
        </div>
        <div className="text-center">
          <TimingCell totalMs={0} />
          <p className="text-xs text-text-muted mt-1">Blocked</p>
        </div>
      </div>
    </div>
  ),
};
