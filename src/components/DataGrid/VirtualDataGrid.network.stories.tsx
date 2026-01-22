/**
 * @file VirtualDataGrid Network History Stories
 * @description Visual documentation for VirtualDataGrid with NetworkHistoryEntry data
 *
 * STORIES:
 * - NetworkDefault (basic table with sample network data)
 * - NetworkEmptyState (table with no entries)
 * - NetworkManyRows (table with 100+ entries)
 * - NetworkWithIntelligence (rows with intelligence signals)
 * - NetworkVirtualScrolling (large dataset with virtualization)
 * - NetworkRowMeasurement (height measurement demonstration)
 * - NetworkFixedColumns (fixed column width stability)
 * - NetworkFlexibleColumns (flexible column space distribution)
 * - NetworkContainerResize (column width recalculation on resize)
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { VirtualDataGrid, type VirtualDataGridProps } from './VirtualDataGrid';
import { createNetworkColumns } from './columns/networkColumns';
import type { NetworkHistoryEntry } from '@/types/history';

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Create a mock NetworkHistoryEntry for Storybook.
 */
function createMockNetworkEntry(overrides: Partial<NetworkHistoryEntry> = {}): NetworkHistoryEntry {
  return {
    id: `hist_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
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
      body: '[]',
      timing: {
        total_ms: 150,
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 100,
      },
    },
    intelligence: {
      boundToSpec: false,
      specOperation: null,
      drift: null,
      aiGenerated: false,
      verified: false,
    },
    ...overrides,
  };
}

/**
 * Generate multiple network history entries.
 */
function generateNetworkEntries(count: number): NetworkHistoryEntry[] {
  const methods: Array<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'> = [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
  ];
  const statuses = [200, 201, 404, 500];

  return Array.from({ length: count }, (_, i) => {
    const method = methods[i % methods.length] ?? 'GET';
    const status = statuses[i % statuses.length] ?? 200;
    const index = i + 1;

    return createMockNetworkEntry({
      id: `hist_${String(index)}`,
      timestamp: new Date(Date.now() - i * 60 * 1000).toISOString(),
      request: {
        url: `https://api.example.com/${i === 0 ? 'users' : `resource/${String(i)}`}`,
        method,
        headers: { 'Content-Type': 'application/json' },
        body: method === 'POST' || method === 'PUT' ? '{"data":"test"}' : null,
        timeout_ms: 30000,
      },
      response: {
        status,
        status_text: (() => {
          if (status === 200) {
            return 'OK';
          }
          if (status === 201) {
            return 'Created';
          }
          return 'Error';
        })(),
        headers: { 'Content-Type': 'application/json' },
        body: status === 204 ? '' : `{"id":${String(index)}}`,
        timing: {
          total_ms: 100 + i * 10,
          dns_ms: 5 + i,
          connect_ms: 10 + i,
          tls_ms: 15 + i,
          first_byte_ms: 50 + i * 5,
        },
      },
    });
  });
}

// ============================================================================
// Storybook Meta
// ============================================================================

const noop = fn();

const networkColumns = createNetworkColumns({
  onReplay: noop,
  onCopy: noop,
  onDelete: noop,
});

const meta = {
  title: 'Components/DataGrid/VirtualDataGrid/Network',
  component: VirtualDataGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VirtualDataGrid>;

export default meta;

type Story = StoryObj<VirtualDataGridProps<NetworkHistoryEntry>>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Feature #1: Default - Basic table with sample network data.
 * Shows all required columns: Method, URL, Status, Time, Size, When, Actions.
 */
export const NetworkDefault: Story = {
  args: {
    data: generateNetworkEntries(10),
    columns: networkColumns,
    getRowId: (row: NetworkHistoryEntry) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },

  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Feature #1: EmptyState - Table with no entries.
 * Displays the empty state message when there are no network requests.
 */
export const NetworkEmptyState: Story = {
  args: {
    data: [],
    columns: networkColumns,
    getRowId: (row: NetworkHistoryEntry) => row.id,
    height: 400,
    emptyMessage: 'No network requests',
    enableRowSelection: true,
    enableExpanding: true,
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },

  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Feature #1: ManyRows - Table with 100+ entries.
 * Demonstrates the table handling a large dataset with virtualization.
 */
export const NetworkManyRows: Story = {
  args: {
    data: generateNetworkEntries(150),
    columns: networkColumns,
    getRowId: (row: NetworkHistoryEntry) => row.id,
    height: 600,
    enableRowSelection: true,
    enableExpanding: true,
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },
  render: (args) => (
    <div className="h-[700px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Feature #1: WithIntelligence - Rows with intelligence signals.
 * Shows entries with various intelligence states: verified, drift, AI-generated, bound to spec.
 */
export const NetworkWithIntelligence: Story = {
  args: {
    data: [
      createMockNetworkEntry({
        id: '1',
        request: { ...createMockNetworkEntry().request, url: 'https://api.example.com/verified' },
        intelligence: {
          boundToSpec: true,
          specOperation: 'getUsers',
          drift: null,
          aiGenerated: false,
          verified: true,
        },
      }),
      createMockNetworkEntry({
        id: '2',
        request: { ...createMockNetworkEntry().request, url: 'https://api.example.com/drift' },
        intelligence: {
          boundToSpec: true,
          specOperation: 'createUser',
          drift: {
            type: 'response',
            fields: ['email'],
            message: 'Missing email field in response',
          },
          aiGenerated: false,
          verified: false,
        },
      }),
      createMockNetworkEntry({
        id: '3',
        request: { ...createMockNetworkEntry().request, url: 'https://api.example.com/ai' },
        intelligence: {
          boundToSpec: false,
          specOperation: null,
          drift: null,
          aiGenerated: true,
          verified: false,
        },
      }),
      createMockNetworkEntry({
        id: '4',
        request: { ...createMockNetworkEntry().request, url: 'https://api.example.com/bound' },
        intelligence: {
          boundToSpec: true,
          specOperation: 'updateUser',
          drift: null,
          aiGenerated: false,
          verified: false,
        },
      }),
    ],
    columns: networkColumns,
    getRowId: (row: NetworkHistoryEntry) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },

  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Feature #35: VirtualScrolling - Large dataset (1000+ rows).
 * Demonstrates virtualization with a large dataset. Only visible rows are rendered in the DOM.
 */
export const NetworkVirtualScrolling: Story = {
  args: {
    data: generateNetworkEntries(1000),
    columns: networkColumns,
    getRowId: (row: NetworkHistoryEntry) => row.id,
    height: 600,
    enableRowSelection: true,
    enableExpanding: true,
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },
  render: (args) => (
    <div className="h-[700px] bg-bg-app">
      <div className="mb-2 text-xs text-text-secondary">
        Scroll to see virtualization in action. Only visible rows are rendered.
      </div>
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Feature #35: RowMeasurement - Height measurement visualization.
 * Demonstrates how the virtualizer measures row heights, including expanded rows.
 */
export const NetworkRowMeasurement: Story = {
  args: {
    data: generateNetworkEntries(20),
    columns: networkColumns,
    getRowId: (row: NetworkHistoryEntry) => row.id,
    height: 400,
    estimateRowHeight: 48,
    enableRowSelection: true,
    enableExpanding: true,
    initialExpanded: { hist_1: true, hist_5: true },
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },
  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <div className="mb-2 text-xs text-text-secondary">
        Some rows are expanded to demonstrate height measurement. The virtualizer measures both
        collapsed and expanded row heights accurately.
      </div>
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Feature #38: FixedColumns - Width stability demonstration.
 * Shows that fixed columns (selection, expander, method, actions) maintain their widths
 * regardless of content in flexible columns.
 */
export const NetworkFixedColumns: Story = {
  args: {
    data: [
      createMockNetworkEntry({
        id: '1',
        request: {
          url: 'https://api.example.com/very/long/url/path/that/should/not/affect/fixed/column/widths',
          method: 'GET',
          headers: {},
          body: null,
          timeout_ms: 30000,
        },
      }),
      createMockNetworkEntry({
        id: '2',
        request: {
          url: 'https://short.url',
          method: 'POST',
          headers: {},
          body: null,
          timeout_ms: 30000,
        },
      }),
    ],
    columns: networkColumns,
    getRowId: (row: NetworkHistoryEntry) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },
  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <div className="mb-2 text-xs text-text-secondary">
        Fixed columns (Selection, Method, Actions) maintain their widths regardless of URL length.
      </div>
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Feature #39: FlexibleColumns - Space distribution demonstration.
 * Shows how flexible columns (URL) distribute remaining space based on weights.
 */
export const NetworkFlexibleColumns: Story = {
  args: {
    data: generateNetworkEntries(10),
    columns: networkColumns,
    getRowId: (row: NetworkHistoryEntry) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },
  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <div className="mb-2 text-xs text-text-secondary">
        Flexible columns (URL) distribute remaining space after fixed columns take their width.
        Resize the container to see flexible columns adjust.
      </div>
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Feature #40: ContainerResize - Width recalculation on resize.
 * Demonstrates that column widths recalculate when the container is resized,
 * with fixed columns remaining fixed and flexible columns adjusting.
 */
export const NetworkContainerResize: Story = {
  args: {
    data: generateNetworkEntries(10),
    columns: networkColumns,
    getRowId: (row: NetworkHistoryEntry) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },
  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <div className="mb-2 text-xs text-text-secondary">
        Resize this container to see column widths recalculate. Fixed columns stay fixed, flexible
        columns adjust to new available space.
      </div>
      <div className="w-full border border-border-default rounded p-2">
        <VirtualDataGrid {...args} />
      </div>
    </div>
  ),
};
