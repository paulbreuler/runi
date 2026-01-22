/**
 * @file ProtocolCell Storybook stories
 * @description Visual documentation for HTTP protocol version cell component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProtocolCell } from './protocolCell';

const meta: Meta<typeof ProtocolCell> = {
  title: 'DataGrid/ProtocolCell',
  component: ProtocolCell,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ProtocolCell>;

/**
 * All protocol versions with color coding.
 */
export const ProtocolVersions: Story = {
  render: () => (
    <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">HTTP/2 (Blue)</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <ProtocolCell protocol="HTTP/2" />
            <p className="text-xs text-text-muted mt-1">HTTP/2</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">HTTP/1.x (Gray)</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <ProtocolCell protocol="HTTP/1.1" />
            <p className="text-xs text-text-muted mt-1">HTTP/1.1</p>
          </div>
          <div className="text-center">
            <ProtocolCell protocol="HTTP/1.0" />
            <p className="text-xs text-text-muted mt-1">HTTP/1.0</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Other</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <ProtocolCell protocol="HTTP/3" />
            <p className="text-xs text-text-muted mt-1">HTTP/3 (unknown)</p>
          </div>
          <div className="text-center">
            <ProtocolCell protocol={null} />
            <p className="text-xs text-text-muted mt-1">No protocol</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * All protocol states for comparison.
 */
export const AllProtocols: Story = {
  render: () => (
    <div className="bg-bg-surface p-4 rounded-lg">
      <div className="flex gap-8 items-center">
        <div className="text-center">
          <ProtocolCell protocol="HTTP/2" />
          <p className="text-xs text-text-muted mt-1">HTTP/2</p>
        </div>
        <div className="text-center">
          <ProtocolCell protocol="HTTP/1.1" />
          <p className="text-xs text-text-muted mt-1">HTTP/1.1</p>
        </div>
        <div className="text-center">
          <ProtocolCell protocol="HTTP/1.0" />
          <p className="text-xs text-text-muted mt-1">HTTP/1.0</p>
        </div>
        <div className="text-center">
          <ProtocolCell protocol={null} />
          <p className="text-xs text-text-muted mt-1">No protocol</p>
        </div>
      </div>
    </div>
  ),
};
