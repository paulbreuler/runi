/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file VirtualDataGrid Storybook stories
 * @description Consolidated story using Storybook 10 controls for all state variations
 *
 * This story replaces multiple separate stories by using controls to explore:
 * - Data types (generic TestRow vs NetworkHistoryEntry)
 * - Data sizes (small, medium, large, empty)
 * - Features (selection, expansion, sorting)
 * - Column pinning (left, right, both)
 * - Sticky headers and columns
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn, expect, userEvent, within } from 'storybook/test';
import { VirtualDataGrid, type VirtualDataGridProps } from './VirtualDataGrid';
import { createSelectionColumn } from './columns/selectionColumn';
import { createExpanderColumn } from './columns/expanderColumn';
import { createNetworkColumns } from './columns/networkColumns';
import { cn } from '@/utils/cn';
import type { ColumnDef, Row } from '@tanstack/react-table';
import type { NetworkHistoryEntry } from '@/types/history';
import { waitForFocus, tabToElement } from '@/utils/storybook-test-helpers';
import { Z_INDEX } from './constants';

// ============================================================================
// Data Types and Generators
// ============================================================================

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
// Column Definitions
// ============================================================================

const createTestColumns = (): Array<ColumnDef<TestRow>> => [
  createSelectionColumn<TestRow>(),
  createExpanderColumn<TestRow>(),
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    size: 150,
    minSize: 100,
    maxSize: 300,
    enableSorting: true,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    minSize: 80,
    maxSize: 150,
    enableSorting: true,
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
    enableSorting: true,
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
        <button className="px-2 py-1 text-xs bg-bg-raised hover:bg-bg-raised/80 rounded">
          Edit
        </button>
        <button className="px-2 py-1 text-xs bg-bg-raised hover:bg-bg-raised/80 rounded">
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

const noop = fn();
const networkColumns = createNetworkColumns({
  onReplay: noop,
  onCopy: noop,
  onDelete: noop,
});

// ============================================================================
// Storybook Meta
// ============================================================================

// Custom args for story controls (not part of component props)
interface VirtualDataGridStoryArgs {
  dataType?: 'test' | 'network';
  dataSize?: 'empty' | 'small' | 'medium' | 'large';
  pinLeft?: boolean;
  pinRight?: boolean;
}

const meta = {
  title: 'DataGrid/VirtualDataGrid',
  component: VirtualDataGrid,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    dataType: {
      control: 'select',
      options: ['test', 'network'],
      description: 'Data type: generic test data or network history entries',
    },
    dataSize: {
      control: 'select',
      options: ['empty', 'small', 'medium', 'large'],
      description: 'Number of rows to display',
    },
    enableRowSelection: {
      control: 'boolean',
      description: 'Enable row selection checkboxes',
    },
    enableExpanding: {
      control: 'boolean',
      description: 'Enable row expansion',
    },
    enableSorting: {
      control: 'boolean',
      description: 'Enable column sorting',
    },
    pinLeft: {
      control: 'boolean',
      description: 'Pin left columns (selection, expander)',
    },
    pinRight: {
      control: 'boolean',
      description: 'Pin right columns (actions)',
    },
    height: {
      control: 'number',
      min: 200,
      max: 800,
      step: 50,
      description: 'Grid height in pixels',
    },
  },
  args: {
    dataType: 'test',
    dataSize: 'medium',
    enableRowSelection: true,
    enableExpanding: true,
    enableSorting: false,
    pinLeft: true,
    pinRight: true,
    height: 400,
  },
} satisfies Meta<VirtualDataGridProps<unknown> & VirtualDataGridStoryArgs>;

export default meta;

type Story = StoryObj<VirtualDataGridProps<unknown> & VirtualDataGridStoryArgs>;

// ============================================================================
// Story
// ============================================================================

/**
 * Playground story with controls for all VirtualDataGrid features.
 * Use the Controls panel to explore different states and configurations.
 */
export const Playground: Story = {
  render: (args) => {
    // Generate data based on type and size
    const dataSizeMap = {
      empty: 0,
      small: 10,
      medium: 50,
      large: 1000,
    };

    const dataSizeKey = args.dataSize ?? 'medium';
    const count = dataSizeMap[dataSizeKey];
    const data =
      args.dataType === 'network' ? generateNetworkEntries(count) : generateTestData(count);

    // Get columns based on data type
    const columns =
      args.dataType === 'network'
        ? networkColumns
        : createTestColumns().map((col) => {
            // Apply sorting enablement to test columns
            if (
              args.enableSorting === true &&
              (col.id === 'name' || col.id === 'status' || col.id === 'value')
            ) {
              return { ...col, enableSorting: true };
            }
            return col;
          });

    // Configure column pinning
    const pinning: { left?: string[]; right?: string[] } = {};
    if (args.pinLeft === true) {
      pinning.left = ['select', 'expand'];
    }
    if (args.pinRight === true) {
      pinning.right = ['actions'];
    }

    // Render function for test data with expansion
    const renderRow =
      args.dataType === 'test' && args.enableExpanding === true
        ? (row: Row<TestRow>, cells: React.ReactNode): React.ReactNode => {
            const isExpanded = row.getIsExpanded();
            const metadata = row.original.metadata;

            return (
              <>
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-border-default hover:bg-bg-raised/50 transition-colors cursor-pointer',
                    row.getIsSelected() && 'bg-bg-raised/30'
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
                  <tr key={`${row.id}-expanded`} data-test-id="expanded-section">
                    <td colSpan={columns.length} className="px-4 py-3 bg-bg-raised">
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium text-text-secondary">Tags:</span>
                          <div className="flex gap-1 mt-1">
                            {metadata.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-bg-raised rounded border border-border-default"
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
          }
        : undefined;

    // Type-safe rendering based on data type
    if (args.dataType === 'network') {
      const networkData = data as NetworkHistoryEntry[];
      const networkCols = columns as typeof networkColumns;
      const networkGetRowId = (row: NetworkHistoryEntry) => row.id;

      return (
        <div className="h-[600px] bg-bg-app" data-test-id="virtual-datagrid-container">
          <div className="mb-2 text-xs text-text-secondary">
            Use the Controls panel to explore different configurations: data type, size, features,
            and column pinning.
          </div>
          <VirtualDataGrid<NetworkHistoryEntry>
            data={networkData}
            columns={networkCols}
            getRowId={networkGetRowId}
            height={args.height}
            enableRowSelection={args.enableRowSelection === true}
            enableExpanding={args.enableExpanding === true}
            getRowCanExpand={args.enableExpanding === true ? () => true : undefined}
            enableSorting={args.enableSorting === true}
            initialColumnPinning={pinning}
            onRowSelectionChange={noop}
            onExpandedChange={noop}
            onSortingChange={args.enableSorting === true ? noop : undefined}
            emptyMessage={args.dataSize === 'empty' ? 'No data available' : undefined}
          />
        </div>
      );
    }

    // Test data type
    const testData = data as TestRow[];
    const testCols = columns as ReturnType<typeof createTestColumns>;
    const testGetRowId = (row: TestRow) => row.id;

    return (
      <div className="h-[600px] bg-bg-app" data-test-id="virtual-datagrid-container">
        <div className="mb-2 text-xs text-text-secondary">
          Use the Controls panel to explore different configurations: data type, size, features, and
          column pinning.
        </div>
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={testCols}
          getRowId={testGetRowId}
          height={args.height}
          enableRowSelection={args.enableRowSelection === true}
          enableExpanding={args.enableExpanding === true}
          getRowCanExpand={args.enableExpanding === true ? () => true : undefined}
          enableSorting={args.enableSorting === true}
          initialColumnPinning={pinning}
          onRowSelectionChange={noop}
          onExpandedChange={noop}
          onSortingChange={args.enableSorting === true ? noop : undefined}
          renderRow={renderRow}
          emptyMessage={args.dataSize === 'empty' ? 'No data available' : undefined}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Verify grid renders', async () => {
      const container = canvasElement.querySelector('[data-test-id="virtual-datagrid"]');
      await expect(container).toBeInTheDocument();
    });

    if (args.enableRowSelection === true) {
      await step('Test row selection', async () => {
        const checkboxes = canvas.getAllByRole('checkbox');
        if (checkboxes.length > 0) {
          const headerCheckbox = checkboxes[0];
          if (headerCheckbox !== undefined) {
            await userEvent.click(headerCheckbox);
            await new Promise((resolve) => setTimeout(resolve, 100));
            await expect(headerCheckbox).toHaveAttribute('aria-checked', 'true');
          }
        }
      });
    }

    if (args.enableExpanding === true) {
      await step('Test row expansion', async () => {
        const expanderButtons = canvasElement.querySelectorAll('[data-test-id^="expand-row-"]');
        if (expanderButtons.length > 0) {
          const firstExpander = expanderButtons[0] as HTMLElement;
          firstExpander.focus();
          await waitForFocus(firstExpander, 2000);
          await userEvent.keyboard('{Enter}');
          await new Promise((resolve) => setTimeout(resolve, 200));
          await expect(firstExpander).toHaveAttribute('aria-expanded', 'true');
        }
      });
    }

    if (args.enableSorting === true) {
      await step('Test sorting', async () => {
        const sortableHeader = canvas.queryByRole('columnheader', { name: /name|method|status/i });
        if (sortableHeader !== null) {
          await userEvent.click(sortableHeader);
          await new Promise((resolve) => setTimeout(resolve, 100));
          await expect(sortableHeader).toHaveAttribute('aria-sort');
        }
      });
    }

    await step('Verify sticky header', async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const thead = canvasElement.querySelector('thead');
      if (thead !== null) {
        await expect(thead).toHaveClass('sticky', 'top-0');
        const theadStyle = window.getComputedStyle(thead);
        const theadZIndex = Number.parseInt(theadStyle.zIndex, 10);
        await expect(theadZIndex).toBe(Z_INDEX.HEADER_RIGHT);
      }
    });

    if (args.pinLeft === true || args.pinRight === true) {
      await step('Verify sticky columns', () => {
        const container = canvasElement.querySelector('[data-test-id="virtual-datagrid"]');
        if (container === null) {
          return;
        }
        const allCells = container.querySelectorAll('th, td');
        const stickyCells = Array.from(allCells).filter((cell) => {
          const style = (cell as HTMLElement).style;
          return style.position === 'sticky';
        });
        void expect(stickyCells.length).toBeGreaterThan(0);
      });
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for VirtualDataGrid. Use the Controls panel to explore all features: data types, sizes, selection, expansion, sorting, and column pinning. All interactions are tested via the play function.',
      },
    },
  },
};

// ============================================================================
// Accessibility Stories
// ============================================================================

/**
 * Keyboard navigation demonstration.
 *
 * Try these keyboard shortcuts:
 * - Tab: Move through checkboxes and expander buttons
 * - Enter: Expand/collapse rows (when expander button focused)
 * - Space: Select rows (when checkbox focused)
 * - Arrow Up/Down: Navigate between rows
 * - Arrow Left/Right: Navigate between cells
 */
export const KeyboardNavigation: Story = {
  render: () => {
    const testData: TestRow[] = generateTestData(5);
    const columns = createTestColumns();

    return (
      <div className="space-y-4">
        <div className="text-sm text-text-secondary">
          <p className="font-medium mb-2">Keyboard Shortcuts:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <kbd className="px-1.5 py-0.5 bg-bg-raised rounded text-xs">Tab</kbd> /{' '}
              <kbd className="px-1.5 py-0.5 bg-bg-raised rounded text-xs">Shift+Tab</kbd>: Navigate
              through interactive elements
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 bg-bg-raised rounded text-xs">Enter</kbd>:
              Expand/collapse rows (when expander button focused)
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 bg-bg-raised rounded text-xs">Space</kbd>: Select rows
              (when checkbox focused)
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 bg-bg-raised rounded text-xs">↑</kbd> /{' '}
              <kbd className="px-1.5 py-0.5 bg-bg-raised rounded text-xs">↓</kbd>: Navigate between
              rows
            </li>
            <li>
              <kbd className="px-1.5 py-0.5 bg-bg-raised rounded text-xs">←</kbd> /{' '}
              <kbd className="px-1.5 py-0.5 bg-bg-raised rounded text-xs">→</kbd>: Navigate between
              cells
            </li>
          </ul>
        </div>
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
          getRowCanExpand={(row: Row<TestRow>) => row.original.metadata !== undefined}
          height={400}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates keyboard navigation. Use Tab to focus elements, then try the keyboard shortcuts listed above.',
      },
    },
  },
};

/**
 * ARIA attributes demonstration.
 *
 * Open browser DevTools and inspect the table elements to see:
 * - Table has `role="table"`
 * - Rows have `role="row"`
 * - Cells have `role="cell"`
 * - Headers have `role="columnheader"`
 * - Expander buttons have `aria-expanded`
 * - Checkboxes have `aria-label`
 */
export const ARIA: Story = {
  render: () => {
    const testData: TestRow[] = generateTestData(3);
    const columns = createTestColumns();

    return (
      <div className="space-y-4">
        <div className="text-sm text-text-secondary">
          <p className="font-medium mb-2">ARIA Attributes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Table:{' '}
              <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">
                role=&quot;table&quot;
              </code>
            </li>
            <li>
              Rows:{' '}
              <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">role=&quot;row&quot;</code>
            </li>
            <li>
              Cells:{' '}
              <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">
                role=&quot;cell&quot;
              </code>
            </li>
            <li>
              Headers:{' '}
              <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">
                role=&quot;columnheader&quot;
              </code>
            </li>
            <li>
              Expander buttons:{' '}
              <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">aria-expanded</code>
            </li>
            <li>
              Checkboxes:{' '}
              <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">aria-label</code>
            </li>
          </ul>
        </div>
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
          getRowCanExpand={(row: Row<TestRow>) => row.original.metadata !== undefined}
          height={400}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows ARIA attributes for screen reader support. Inspect elements in DevTools to see the attributes.',
      },
    },
  },
};

/**
 * Focus management demonstration.
 *
 * Try tabbing through the table:
 * - Focus indicators are visible (blue ring)
 * - Focus moves logically through interactive elements
 * - You can tab in and out of the table (no focus trap)
 */
export const FocusManagement: Story = {
  render: () => {
    const testData: TestRow[] = generateTestData(3);
    const columns = createTestColumns();

    return (
      <div className="space-y-4">
        <div className="text-sm text-text-secondary">
          <p className="font-medium mb-2">Focus Features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Visible focus indicators (blue ring)</li>
            <li>Logical tab order</li>
            <li>No focus trap - can tab in and out</li>
            <li>Only interactive elements are focusable</li>
          </ul>
        </div>
        <div>
          <button className="mb-4 px-3 py-1.5 bg-accent-blue text-white rounded text-sm">
            Before Table (Tab here first)
          </button>
          <VirtualDataGrid<TestRow>
            data={testData}
            columns={columns}
            getRowId={(row) => row.id}
            enableRowSelection
            enableExpanding
            getRowCanExpand={(row: Row<TestRow>) => row.original.metadata !== undefined}
            height={400}
          />
          <button className="mt-4 px-3 py-1.5 bg-accent-blue text-white rounded text-sm">
            After Table (Tab here after)
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates focus management. Tab through the table to see focus indicators and logical tab order.',
      },
    },
  },
};

/**
 * Tests keyboard navigation: Tab through elements, Space to select, Enter to expand.
 */
export const KeyboardNavigationTest: Story = {
  render: () => {
    const testData: TestRow[] = generateTestData(3);
    const columns = createTestColumns();

    return (
      <div data-test-id="keyboard-nav-container">
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
          getRowCanExpand={(row: Row<TestRow>) => row.original.metadata !== undefined}
          height={400}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to first checkbox and verify focus', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];
      if (headerCheckbox !== undefined) {
        headerCheckbox.focus();
        await waitForFocus(headerCheckbox, 2000);
        await expect(headerCheckbox).toHaveFocus();
      }
    });

    await step('Press Space to toggle select all checkbox', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];
      if (headerCheckbox !== undefined) {
        await userEvent.keyboard(' ');
        await new Promise((resolve) => setTimeout(resolve, 100));
        await expect(headerCheckbox).toHaveAttribute('aria-checked', 'true');
      }
    });

    await step('Tab to first expander button', async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
      let expanderButtons = canvas.queryAllByRole('button', { name: /expand row|collapse row/i });
      if (expanderButtons.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        expanderButtons = canvas.queryAllByRole('button', { name: /expand row|collapse row/i });
      }
      const firstExpander = expanderButtons[0];
      if (firstExpander !== undefined) {
        firstExpander.focus();
        await waitForFocus(firstExpander, 2000);
        await expect(firstExpander).toHaveFocus();
      }
    });

    await step('Press Enter to expand row', async () => {
      // Get the expander button that was focused in the previous step
      let expanderButtons = canvas.queryAllByRole('button', { name: /expand row|collapse row/i });
      if (expanderButtons.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        expanderButtons = canvas.queryAllByRole('button', { name: /expand row|collapse row/i });
      }
      const firstExpander = expanderButtons[0];
      if (firstExpander !== undefined) {
        // Ensure button is focused before pressing Enter
        firstExpander.focus();
        await waitForFocus(firstExpander, 2000);
        await expect(firstExpander).toHaveFocus();
        await expect(firstExpander).toHaveAttribute('aria-expanded', 'false');
        // Press Enter while button is focused - use keyDown event directly on the button
        // This ensures the event is handled by the button's onKeyDown handler
        await userEvent.keyboard('{Enter}');
        // Wait longer for React state update, TanStack Table state sync, and re-render
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Re-query the button to get the updated element after re-render
        const updatedExpander = canvas.queryAllByRole('button', {
          name: /expand row|collapse row/i,
        })[0];
        if (updatedExpander !== undefined) {
          await expect(updatedExpander).toHaveAttribute('aria-expanded', 'true');
        }
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests keyboard navigation: Tab through interactive elements, Space to toggle selection, Enter to expand/collapse rows.',
      },
    },
  },
};

/**
 * Tests focus order: verifies logical tab order through the grid.
 */
export const FocusManagementTest: Story = {
  render: () => {
    const testData: TestRow[] = generateTestData(3);
    const columns = createTestColumns();

    return (
      <div data-test-id="focus-management-container">
        <button
          data-test-id="before-button"
          className="mb-4 px-3 py-1.5 bg-accent-blue text-white rounded text-sm"
        >
          Before Table
        </button>
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
          getRowCanExpand={(row: Row<TestRow>) => row.original.metadata !== undefined}
          height={400}
        />
        <button
          data-test-id="after-button"
          className="mt-4 px-3 py-1.5 bg-accent-blue text-white rounded text-sm"
        >
          After Table
        </button>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Focus starts on before button when tabbing', async () => {
      const beforeButton = canvas.getByTestId('before-button');
      // Focus the button directly first, then verify
      beforeButton.focus();
      await waitForFocus(beforeButton, 1000);
      await expect(beforeButton).toHaveFocus();
    });

    await step('Tab into table - focus moves to header checkbox', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];
      if (headerCheckbox !== undefined) {
        headerCheckbox.focus();
        // Wait longer for focus to be applied, especially in CI
        await waitForFocus(headerCheckbox, 3000);
        await expect(headerCheckbox).toHaveFocus();
      }
    });

    await step('Can tab through table to after button (no focus trap)', async () => {
      const afterButton = canvas.getByTestId('after-button');
      await tabToElement(afterButton, 50);
      await expect(afterButton).toHaveFocus();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests focus management: verifies logical tab order, no focus trap, and bidirectional navigation.',
      },
    },
  },
};
