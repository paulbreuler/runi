/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file StatusCell Storybook stories
 * @description Visual documentation for HTTP status code cell component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusCell } from './statusCell';

const meta: Meta<typeof StatusCell> = {
  title: 'DataGrid/Columns/StatusCell',
  component: StatusCell,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof StatusCell>;

/**
 * All status code ranges with semantic colors.
 */
export const StatusColors: Story = {
  render: () => (
    <div className="space-y-4 bg-bg-surface p-4 rounded-lg">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">2xx Success</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <StatusCell status={200} />
            <p className="text-xs text-text-muted mt-1">200 OK</p>
          </div>
          <div className="text-center">
            <StatusCell status={201} />
            <p className="text-xs text-text-muted mt-1">201 Created</p>
          </div>
          <div className="text-center">
            <StatusCell status={204} />
            <p className="text-xs text-text-muted mt-1">204 No Content</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">3xx Redirect</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <StatusCell status={301} />
            <p className="text-xs text-text-muted mt-1">301 Moved</p>
          </div>
          <div className="text-center">
            <StatusCell status={302} />
            <p className="text-xs text-text-muted mt-1">302 Found</p>
          </div>
          <div className="text-center">
            <StatusCell status={307} />
            <p className="text-xs text-text-muted mt-1">307 Temporary</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">4xx Client Error</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <StatusCell status={400} />
            <p className="text-xs text-text-muted mt-1">400 Bad Request</p>
          </div>
          <div className="text-center">
            <StatusCell status={401} />
            <p className="text-xs text-text-muted mt-1">401 Unauthorized</p>
          </div>
          <div className="text-center">
            <StatusCell status={404} />
            <p className="text-xs text-text-muted mt-1">404 Not Found</p>
          </div>
          <div className="text-center">
            <StatusCell status={429} />
            <p className="text-xs text-text-muted mt-1">429 Too Many</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">5xx Server Error</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <StatusCell status={500} />
            <p className="text-xs text-text-muted mt-1">500 Internal</p>
          </div>
          <div className="text-center">
            <StatusCell status={502} />
            <p className="text-xs text-text-muted mt-1">502 Bad Gateway</p>
          </div>
          <div className="text-center">
            <StatusCell status={503} />
            <p className="text-xs text-text-muted mt-1">503 Service Unavailable</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Other</h3>
        <div className="flex gap-4 items-center">
          <div className="text-center">
            <StatusCell status={199} />
            <p className="text-xs text-text-muted mt-1">199 Unknown</p>
          </div>
        </div>
      </div>
    </div>
  ),
};
