// TODO: Fix generic component type issues - stories use different row types
/**
 * @file VirtualDataGrid Storybook stories
 * @description Visual documentation for the VirtualDataGrid component
 *
 * STORY CHANGES (Features #1, #35, #38-40):
 * =========================================
 *
 * NEW STORIES ADDED (9 total):
 * - NetworkDefault (Feature #1)
 * - NetworkEmptyState (Feature #1)
 * - NetworkManyRows (Feature #1)
 * - NetworkWithIntelligence (Feature #1)
 * - NetworkVirtualScrolling (Feature #35)
 * - NetworkRowMeasurement (Feature #35)
 * - NetworkFixedColumns (Feature #38)
 * - NetworkFlexibleColumns (Feature #39)
 * - NetworkContainerResize (Feature #40)
 *
 * EXISTING STORIES (unchanged):
 * - Default (generic test data)
 * - WithExpansion
 * - LargeDataset
 * - ConditionalPinning
 * - Empty
 * - WithSorting
 *
 * All new stories use NetworkHistoryEntry data and createNetworkColumns()
 * to demonstrate real-world usage with network history entries.
 */

/* eslint-disable @typescript-eslint/no-unsafe-return */
// Storybook render functions return JSX which is properly typed by StoryObj
// The unsafe return errors are false positives from Storybook's type system

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { VirtualDataGrid } from './VirtualDataGrid';
import { createSelectionColumn } from './columns/selectionColumn';
import { createExpanderColumn } from './columns/expanderColumn';
import { createNetworkColumns } from './columns/networkColumns';
import { cn } from '@/utils/cn';
import type { ColumnDef } from '@tanstack/react-table';
import type { NetworkHistoryEntry } from '@/types/history';

// Simple test data type
interface TestRow {
  id: string;
  name: string;
  status: string;
  value: number;
  description: string;
  metadata?: {
    tags: string[];
    notes: string;
  };
}

// Generate sample data
function generateTestData(count: number): TestRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${String(i + 1)}`,
    name: `Item ${String(i + 1)}`,
    status: (() => {
      const remainder = i % 3;
      if (remainder === 0) {
        return 'active';
      }
      if (remainder === 1) {
        return 'pending';
      }
      return 'inactive';
    })(),
    value: Math.floor(Math.random() * 1000),
    description: `This is a description for item ${String(i + 1)}. It contains some text to demonstrate how the grid handles longer content.`,
    metadata: {
      tags: ['tag1', 'tag2'],
      notes: `Additional notes for item ${String(i + 1)}`,
    },
  }));
}

// Column definitions
const createColumns = (): Array<ColumnDef<TestRow>> => [
  createSelectionColumn<TestRow>(),
  createExpanderColumn<TestRow>(),
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    size: 150,
    minSize: 100,
    maxSize: 300,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    minSize: 80,
    maxSize: 150,
    cell: ({ getValue }) => {
      const status = getValue<string>();
      const colorClass = (() => {
        if (status === 'active') {
          return 'text-accent-green';
        }
        if (status === 'pending') {
          return 'text-accent-amber';
        }
        return 'text-text-secondary';
      })();
      return <span className={colorClass}>{status}</span>;
    },
  },
  {
    id: 'value',
    accessorKey: 'value',
    header: 'Value',
    size: 100,
    minSize: 80,
    maxSize: 150,
    cell: ({ getValue }) => {
      const value = getValue<number>();
      return <span className="font-mono">{value.toLocaleString()}</span>;
    },
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    size: 300,
    minSize: 200,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <div className="flex gap-1">
        <button className="px-2 py-1 text-xs bg-bg-raised hover:bg-bg-elevated rounded">
          Edit
        </button>
        <button className="px-2 py-1 text-xs bg-bg-raised hover:bg-bg-elevated rounded">
          Delete
        </button>
      </div>
    ),
    size: 120,
    minSize: 120,
    maxSize: 120,
    enableResizing: false,
    enableSorting: false,
    enablePinning: true,
  },
];

const meta = {
  title: 'Components/DataGrid/VirtualDataGrid',
  component: VirtualDataGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VirtualDataGrid<TestRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

// Storybook render functions return JSX which is properly typed by StoryObj

const noop = fn();

/**
 * Basic grid with a small dataset.
 */
export const Default: Story = {
  args: {
    data: generateTestData(10),
    columns: createColumns(),
    getRowId: (row) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
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
 * Grid with row expansion enabled. Double-click rows to expand and see metadata.
 */
export const WithExpansion: Story = {
  args: {
    data: generateTestData(10),
    columns: createColumns(),
    getRowId: (row) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: noop,
    onExpandedChange: noop,
    renderRow: (row, cells): React.ReactNode => {
      const isExpanded = row.getIsExpanded();
      const metadata = row.original.metadata;

      return (
        <>
          <tr
            key={row.id}
            className={cn(
              'border-b border-border-default hover:bg-bg-raised/50 transition-colors cursor-pointer',
              row.getIsSelected() && 'bg-accent-blue/10'
            )}
            onClick={() => {
              row.toggleSelected();
            }}
            onDoubleClick={() => {
              row.toggleExpanded();
            }}
          >
            {cells}
          </tr>
          {isExpanded && metadata !== undefined && (
            <tr key={`${row.id}-expanded`} data-testid="expanded-section">
              <td colSpan={createColumns().length} className="px-4 py-3 bg-bg-raised">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-text-secondary">Tags:</span>
                    <div className="flex gap-1 mt-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-unsafe-call */}
                      {metadata.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs bg-bg-elevated rounded border border-border-default"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-secondary">Notes:</span>
                    <p className="mt-1 text-sm text-text-primary">{metadata.notes}</p>
                  </div>
                </div>
              </td>
            </tr>
          )}
        </>
      );
    },
  },

  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Large dataset demonstrating virtualization. Only visible rows are rendered.
 */
export const LargeDataset: Story = {
  args: {
    data: generateTestData(1000),
    columns: createColumns(),
    getRowId: (row) => row.id,
    height: 600,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
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
 * Narrow container to demonstrate conditional actions column pinning.
 * When the table overflows horizontally, the actions column becomes sticky.
 */
export const ConditionalPinning: Story = {
  args: {
    data: generateTestData(20),
    columns: createColumns(),
    getRowId: (row) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: noop,
    onExpandedChange: noop,
  },
  render: (args) => (
    <div className="w-[600px] h-[500px] bg-bg-app border border-border-default rounded">
      <div className="p-2 text-xs text-text-secondary mb-2">
        Resize this container to see actions column pinning when table overflows
      </div>
      <VirtualDataGrid {...args} />
    </div>
  ),
};

/**
 * Empty state when no data is available.
 */
export const Empty: Story = {
  args: {
    data: [],
    columns: createColumns(),
    getRowId: (row) => row.id,
    height: 400,
    emptyMessage: 'No items found',
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
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
 * Grid with sorting enabled. Click column headers to sort.
 */
export const WithSorting: Story = {
  args: {
    data: generateTestData(20),
    columns: createColumns().map((col) => {
      if (col.id === 'name' || col.id === 'status' || col.id === 'value') {
        return {
          ...col,
          enableSorting: true,
        };
      }
      return col;
    }),
    getRowId: (row) => row.id,
    height: 400,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: () => true,
    enableSorting: true,
    initialColumnPinning: { right: ['actions'] },
    onRowSelectionChange: noop,
    onExpandedChange: noop,
    onSortingChange: noop,
  },

  render: (args) => (
    <div className="h-[500px] bg-bg-app">
      <VirtualDataGrid {...args} />
    </div>
  ),
};

// ============================================================================
// Feature #1: Basic Table Rendering - Network History Stories
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

const networkColumns = createNetworkColumns({
  onReplay: noop,
  onCopy: noop,
  onDelete: noop,
});

/**
 * Feature #1: Default - Basic table with sample network data.
 * Shows all required columns: Method, URL, Status, Time, Size, When, Actions.
 */
export const NetworkDefault: Story = {
  args: {
    data: generateNetworkEntries(10),
    columns: networkColumns,
    getRowId: (row) => row.id,
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
    getRowId: (row) => row.id,
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
    getRowId: (row) => row.id,
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
 * Feature #35: VirtualScrolling - Large dataset (1000+ rows).
 * Demonstrates virtualization with a large dataset. Only visible rows are rendered in the DOM.
 */
export const NetworkVirtualScrolling: Story = {
  args: {
    data: generateNetworkEntries(1000),
    columns: networkColumns,
    getRowId: (row) => row.id,
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
    getRowId: (row) => row.id,
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
    getRowId: (row) => row.id,
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
    getRowId: (row) => row.id,
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
    getRowId: (row) => row.id,
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
    getRowId: (row) => row.id,
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
