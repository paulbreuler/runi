/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { NetworkHistoryPanel, type NetworkHistoryPanelProps } from './NetworkHistoryPanel';
import { HeaderRow } from './HeaderRow';
import { NetworkStatusBar } from './NetworkStatusBar';
import type { NetworkHistoryEntry } from '@/types/history';

// Custom args for story controls (not part of component props)
interface NetworkHistoryPanelStoryArgs {
  entryCount?: 'empty' | 'single' | 'few' | 'many';
  hasDrift?: boolean;
}

const meta = {
  title: 'History/NetworkHistoryPanel',
  component: NetworkHistoryPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Complete Network History Panel with filter bar, virtualized data grid, and status bar.

**Components:**
- **NetworkHistoryPanel** - Main panel with filter bar, data grid, and status bar
- **HeaderRow** - Displays a single HTTP header key-value pair
- **NetworkStatusBar** - Entry counts and intelligence signals

**Features:**
- FilterBar: Search, method/status/intelligence filters, compare mode
- VirtualDataGrid: Virtualized rows with selection, expansion, sorting
- ExpandedPanel: Detailed view with tabs (Timing, Response, Headers, Code Gen)
- NetworkStatusBar: Entry counts and intelligence signals
- Intelligence signals: Verified, drift, AI-generated, bound-to-spec

This story file includes NetworkHistoryPanel, HeaderRow, and NetworkStatusBar stories. Use the Controls panel to explore different entry counts and states.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    entryCount: {
      control: 'select',
      options: ['empty', 'single', 'few', 'many'],
      description: 'Number of entries to display',
    },
    hasDrift: {
      control: 'boolean',
      description: 'Include entries with drift issues',
    },
  },
  args: {
    entryCount: 'few',
    hasDrift: false,
  },
} satisfies Meta<NetworkHistoryPanelProps & NetworkHistoryPanelStoryArgs>;

export default meta;
type Story = StoryObj<NetworkHistoryPanelProps & NetworkHistoryPanelStoryArgs>;

const noop = fn();

const defaultIntelligence = {
  boundToSpec: false,
  specOperation: null,
  drift: null,
  aiGenerated: false,
  verified: false,
};

const mockEntries: NetworkHistoryEntry[] = [
  {
    id: 'hist_1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '[{"id":1,"name":"John"},{"id":2,"name":"Jane"}]',
      timing: { total_ms: 156, dns_ms: 12, connect_ms: 23, tls_ms: 34, first_byte_ms: 98 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'getUsers',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
  {
    id: 'hist_2',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Alice","email":"alice@example.com"}',
      timeout_ms: 30000,
    },
    response: {
      status: 201,
      status_text: 'Created',
      headers: { 'Content-Type': 'application/json' },
      body: '{"id":3,"name":"Alice"}',
      timing: { total_ms: 234, dns_ms: null, connect_ms: null, tls_ms: null, first_byte_ms: null },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'createUser',
      drift: { type: 'response', fields: ['email'], message: 'Missing email field in response' },
      aiGenerated: true,
      verified: false,
    },
  },
  {
    id: 'hist_3',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users/1',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"John Updated"}',
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '{"id":1,"name":"John Updated"}',
      timing: { total_ms: 189, dns_ms: 8, connect_ms: 18, tls_ms: 28, first_byte_ms: 120 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'updateUser',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
  {
    id: 'hist_4',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users/999',
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 404,
      status_text: 'Not Found',
      headers: {},
      body: '{"error":"User not found"}',
      timing: { total_ms: 67, dns_ms: 5, connect_ms: 10, tls_ms: 15, first_byte_ms: 50 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'getUserById',
      drift: null,
      aiGenerated: false,
      verified: false,
    },
  },
  {
    id: 'hist_5',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users/2',
      method: 'DELETE',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 204,
      status_text: 'No Content',
      headers: {},
      body: '',
      timing: { total_ms: 145, dns_ms: 6, connect_ms: 12, tls_ms: 20, first_byte_ms: 100 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'deleteUser',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
];

/**
 * Playground with controls for all NetworkHistoryPanel features.
 * Use the Controls panel to explore different entry counts and states.
 */
export const Playground: Story = {
  render: (args: NetworkHistoryPanelProps & NetworkHistoryPanelStoryArgs) => {
    const entryCountMap = {
      empty: 0,
      single: 1,
      few: 5,
      many: 20,
    };

    const count = entryCountMap[args.entryCount ?? 'few'];
    let entries = mockEntries.slice(0, count);

    if (args.hasDrift === true && entries.length > 0) {
      entries = entries.map((entry, index) =>
        index === 0
          ? {
              ...entry,
              intelligence: {
                ...(entry.intelligence ?? defaultIntelligence),
                drift: {
                  type: 'response' as const,
                  fields: ['status'],
                  message: 'Unexpected field',
                },
                verified: false,
              },
            }
          : entry
      );
    }

    return (
      <div className="h-[600px] bg-bg-app">
        <NetworkHistoryPanel entries={entries} onReplay={noop} onCopyCurl={noop} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for NetworkHistoryPanel. Use the Controls panel to configure entry count (empty, single, few, many) and drift state.',
      },
    },
  },
};

/**
 * Tests filter interactions through the panel.
 */
export const FilterInteractionsTest: Story = {
  args: {
    entryCount: 'few',
    hasDrift: false,
  },
  render: () => {
    const entries = mockEntries.slice(0, 5);
    return (
      <div className="h-[600px] bg-bg-app">
        <NetworkHistoryPanel entries={entries} onReplay={noop} onCopyCurl={noop} />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Filter by search term', async () => {
      const searchInput = canvas.getByLabelText(/filter history by url/i);
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'users');
      await expect(searchInput).toHaveValue('users');
      const rows = canvas.getAllByTestId('history-row');
      await expect(rows.length).toBeGreaterThan(0);
    });

    await step('Filter by method', async () => {
      const methodFilter = canvas.getByTestId('method-filter');
      await userEvent.click(methodFilter);
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Radix Select renders options in a portal (document.body), search there
      const postOption = await within(document.body).findByRole(
        'option',
        { name: /^post$/i },
        { timeout: 3000 }
      );
      await userEvent.click(postOption);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const rows = canvas.getAllByTestId('history-row');
      await expect(rows.length).toBeGreaterThan(0);
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests filter interactions: search by URL and filter by HTTP method.',
      },
    },
  },
};

/**
 * Tests double-click behavior: expands row without toggling selection.
 */
export const DoubleClickBehaviorTest: Story = {
  args: {
    entryCount: 'few',
    hasDrift: false,
  },
  render: () => {
    const entries = mockEntries.slice(0, 3);
    return (
      <div className="h-[700px] bg-bg-app">
        <div className="p-4 space-y-2">
          <div className="text-sm text-text-muted">
            <p className="font-medium mb-1">Expected Behavior:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Single click on row → selects row (subtle gray highlight)</li>
              <li>Double-click on row → expands row (selection should remain, NOT toggle)</li>
              <li>Row highlight should stay visible when double-clicking a selected row</li>
            </ul>
          </div>
          <NetworkHistoryPanel entries={entries} onReplay={noop} onCopyCurl={noop} />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click once to select row', async () => {
      const rows = canvas.getAllByTestId('history-row');
      const firstRow = rows[0];
      if (firstRow !== undefined) {
        await userEvent.click(firstRow);
        // NetworkHistoryPanel uses a timeout for selection, wait longer for state update
        await new Promise((resolve) => setTimeout(resolve, 400));
        // Wait for the class to be applied (React state update + re-render)
        await expect(firstRow).toHaveClass('bg-bg-raised/30');
      }
    });

    await step('Double-click to expand (selection should remain)', async () => {
      const rows = canvas.getAllByTestId('history-row');
      const firstRow = rows[0];
      if (firstRow !== undefined) {
        await userEvent.dblClick(firstRow);
        await new Promise((resolve) => setTimeout(resolve, 200));
        const expandedSection = canvas.queryByTestId('expanded-section');
        await expect(expandedSection).toBeInTheDocument();
        await expect(firstRow).toHaveClass('bg-bg-raised/30');
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests double-click behavior: verifies that double-clicking a row expands it without toggling selection.',
      },
    },
  },
};

// ============================================================================
// HeaderRow Stories
// ============================================================================

/**
 * HeaderRow - standard header with typical key-value pair.
 */
export const HeaderRowDefault: Story = {
  render: () => (
    <div className="p-4 bg-bg-app">
      <HeaderRow name="Content-Type" value="application/json" />
    </div>
  ),
};

/**
 * HeaderRow - authorization header with bearer token.
 */
export const HeaderRowAuthorization: Story = {
  render: () => (
    <div className="p-4 bg-bg-app">
      <HeaderRow
        name="Authorization"
        value="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ"
      />
    </div>
  ),
};

/**
 * HeaderRow - long value that wraps.
 */
export const HeaderRowLongValue: Story = {
  render: () => (
    <div className="p-4 bg-bg-app w-64">
      <HeaderRow
        name="X-Custom-Header"
        value="This is a very long header value that will wrap to multiple lines when the container width is constrained"
      />
    </div>
  ),
};

/**
 * HeaderRow - URL as value.
 */
export const HeaderRowUrlValue: Story = {
  render: () => (
    <div className="p-4 bg-bg-app">
      <HeaderRow
        name="Referer"
        value="https://example.com/api/v1/users?page=1&limit=10&sort=name"
      />
    </div>
  ),
};

// ============================================================================
// NetworkStatusBar Stories
// ============================================================================

/**
 * NetworkStatusBar - with all intelligence counts.
 */
export const NetworkStatusBarWithAllCounts: Story = {
  render: () => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkStatusBar driftCount={5} aiCount={12} boundCount={78} />
    </div>
  ),
};

/**
 * NetworkStatusBar - with drift issues detected.
 */
export const NetworkStatusBarWithDrift: Story = {
  render: () => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkStatusBar driftCount={8} aiCount={0} boundCount={42} />
    </div>
  ),
};

/**
 * NetworkStatusBar - with only spec-bound count.
 */
export const NetworkStatusBarSpecBoundOnly: Story = {
  render: () => (
    <div className="bg-bg-surface border border-border-subtle rounded">
      <NetworkStatusBar driftCount={0} aiCount={0} boundCount={15} />
    </div>
  ),
};
