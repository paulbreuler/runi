/**
 * @file SizeCell Storybook stories
 * @description Visual documentation for response size cell component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { SizeCell } from './sizeCell';

const meta: Meta<typeof SizeCell> = {
  title: 'Components/DataGrid/SizeCell',
  component: SizeCell,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof SizeCell>;

/**
 * All size formats: bytes, kilobytes, and megabytes.
 */
export const SizeFormats: Story = {
  render: () => (
    <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Bytes</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <SizeCell bytes={0} />
            <p className="text-xs text-text-muted mt-1">0 B</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={256} />
            <p className="text-xs text-text-muted mt-1">256 B</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={512} />
            <p className="text-xs text-text-muted mt-1">512 B</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={1023} />
            <p className="text-xs text-text-muted mt-1">1023 B</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Kilobytes</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <SizeCell bytes={1024} />
            <p className="text-xs text-text-muted mt-1">1.0 KB</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={2048} />
            <p className="text-xs text-text-muted mt-1">2.0 KB</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={4096} />
            <p className="text-xs text-text-muted mt-1">4.0 KB</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={102400} />
            <p className="text-xs text-text-muted mt-1">100.0 KB</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={1048575} />
            <p className="text-xs text-text-muted mt-1">1024.0 KB</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Megabytes</h3>
        <div className="flex gap-6 items-center">
          <div className="text-center">
            <SizeCell bytes={1048576} />
            <p className="text-xs text-text-muted mt-1">1.0 MB</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={2097152} />
            <p className="text-xs text-text-muted mt-1">2.0 MB</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={5242880} />
            <p className="text-xs text-text-muted mt-1">5.0 MB</p>
          </div>
          <div className="text-center">
            <SizeCell bytes={1500000} />
            <p className="text-xs text-text-muted mt-1">1.4 MB</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

/**
 * Common response sizes for comparison.
 */
export const CommonSizes: Story = {
  render: () => (
    <div className="bg-bg-surface p-4 rounded-lg">
      <div className="flex gap-8 items-center">
        <div className="text-center">
          <SizeCell bytes={256} />
          <p className="text-xs text-text-muted mt-1">Tiny</p>
        </div>
        <div className="text-center">
          <SizeCell bytes={4096} />
          <p className="text-xs text-text-muted mt-1">Small</p>
        </div>
        <div className="text-center">
          <SizeCell bytes={102400} />
          <p className="text-xs text-text-muted mt-1">Medium</p>
        </div>
        <div className="text-center">
          <SizeCell bytes={1048576} />
          <p className="text-xs text-text-muted mt-1">Large</p>
        </div>
        <div className="text-center">
          <SizeCell bytes={5242880} />
          <p className="text-xs text-text-muted mt-1">Very Large</p>
        </div>
      </div>
    </div>
  ),
};
