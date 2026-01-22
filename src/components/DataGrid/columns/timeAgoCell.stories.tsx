/**
 * @file TimeAgoCell Storybook stories
 * @description Visual documentation for relative time cell component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimeAgoCell } from './timeAgoCell';

const meta: Meta<typeof TimeAgoCell> = {
  title: 'DataGrid/TimeAgoCell',
  component: TimeAgoCell,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof TimeAgoCell>;

/**
 * All relative time formats with proper styling.
 */
export const TimeFormats: Story = {
  render: () => {
    const now = Date.now();
    return (
      <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Recent</h3>
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now).toISOString()} />
              <p className="text-xs text-text-muted mt-1">just now</p>
            </div>
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now - 2 * 60 * 1000).toISOString()} />
              <p className="text-xs text-text-muted mt-1">2m ago</p>
            </div>
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now - 30 * 60 * 1000).toISOString()} />
              <p className="text-xs text-text-muted mt-1">30m ago</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Hours</h3>
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now - 1 * 60 * 60 * 1000).toISOString()} />
              <p className="text-xs text-text-muted mt-1">1h ago</p>
            </div>
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now - 3 * 60 * 60 * 1000).toISOString()} />
              <p className="text-xs text-text-muted mt-1">3h ago</p>
            </div>
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now - 12 * 60 * 60 * 1000).toISOString()} />
              <p className="text-xs text-text-muted mt-1">12h ago</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Days</h3>
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now - 24 * 60 * 60 * 1000).toISOString()} />
              <p className="text-xs text-text-muted mt-1">yesterday</p>
            </div>
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()} />
              <p className="text-xs text-text-muted mt-1">2d ago</p>
            </div>
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString()} />
              <p className="text-xs text-text-muted mt-1">6d ago</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-2">Older</h3>
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <TimeAgoCell timestamp={new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString()} />
              <p className="text-xs text-text-muted mt-1">Formatted date</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Note: The component updates every 30 seconds automatically.
 */
export const AutoUpdate: Story = {
  render: () => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return (
      <div className="bg-bg-surface p-4 rounded-lg">
        <div className="text-center">
          <TimeAgoCell timestamp={twoMinutesAgo.toISOString()} />
          <p className="text-xs text-text-muted mt-2">
            This will update every 30 seconds automatically
          </p>
        </div>
      </div>
    );
  },
};
