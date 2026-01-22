/**
 * @file Selection column Storybook stories
 * @description Visual documentation for the selection column helper
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useReactTable, getCoreRowModel, type ColumnDef, flexRender } from '@tanstack/react-table';
import { createSelectionColumn } from './selectionColumn';
import { cn } from '@/utils/cn';
import { tabToElement } from '@/utils/storybook-test-helpers';

// Test data type
interface DemoRow {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  email: string;
}

// Sample data
const demoData: DemoRow[] = [
  { id: '1', name: 'Alice Johnson', status: 'active', email: 'alice@example.com' },
  { id: '2', name: 'Bob Smith', status: 'inactive', email: 'bob@example.com' },
  { id: '3', name: 'Carol White', status: 'pending', email: 'carol@example.com' },
  { id: '4', name: 'David Brown', status: 'active', email: 'david@example.com' },
  { id: '5', name: 'Eve Davis', status: 'active', email: 'eve@example.com' },
];

// Demo table component
interface DemoTableProps {
  initialSelection?: Record<string, boolean>;
  showHeader?: boolean;
  checkboxSize?: 'sm' | 'default' | 'lg';
}

const DemoTable = ({
  initialSelection = {},
  showHeader = true,
  checkboxSize,
}: DemoTableProps): React.ReactElement => {
  const [rowSelection, setRowSelection] = React.useState(initialSelection);

  const columns: Array<ColumnDef<DemoRow>> = [
    createSelectionColumn<DemoRow>({ size: checkboxSize }),
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return (
          <span
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              status === 'active' && 'bg-signal-success/10 text-signal-success',
              status === 'inactive' && 'bg-text-muted/10 text-text-muted',
              status === 'pending' && 'bg-signal-warning/10 text-signal-warning'
            )}
          >
            {status}
          </span>
        );
      },
    },
  ];

  const table = useReactTable({
    data: demoData,
    columns,
    state: {
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  const selectedCount = Object.keys(rowSelection).filter(
    (key) => rowSelection[key] === true
  ).length;

  return (
    <div className="space-y-4">
      <div className="text-sm text-text-secondary">
        Selected: {selectedCount} of {demoData.length} rows
      </div>
      <table className="min-w-full border-collapse">
        {showHeader && (
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border-default">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-medium text-text-secondary uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
        )}
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-border-default hover:bg-bg-raised transition-colors',
                row.getIsSelected() && 'bg-accent-blue/10'
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 text-sm text-text-primary">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const meta: Meta<typeof DemoTable> = {
  title: 'DataGrid/Columns/SelectionColumn',
  component: DemoTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Selection column helper for TanStack Table. Provides header checkbox for select all and row checkboxes for individual selection.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-bg-app p-4 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DemoTable>;

/**
 * Default state with no rows selected.
 * Click the header checkbox to select all, or individual row checkboxes.
 */
export const Default: Story = {
  args: {},
};

/**
 * Some rows are pre-selected, showing the indeterminate state on header.
 */
export const SomeSelected: Story = {
  args: {
    initialSelection: { '1': true, '3': true },
  },
};

/**
 * All rows are pre-selected.
 */
export const AllSelected: Story = {
  args: {
    initialSelection: { '1': true, '2': true, '3': true, '4': true, '5': true },
  },
};

/**
 * Small checkbox size variant.
 */
export const SmallCheckboxes: Story = {
  args: {
    checkboxSize: 'sm',
  },
};

/**
 * Large checkbox size variant.
 */
export const LargeCheckboxes: Story = {
  args: {
    checkboxSize: 'lg',
  },
};

/**
 * Tests checkbox selection interactions: click to select, keyboard navigation.
 */
export const SelectionInteractionTest: Story = {
  args: {},
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click header checkbox to select all rows', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];
      if (headerCheckbox !== undefined) {
        await userEvent.click(headerCheckbox);
        // Wait for state update (may need more time in CI)
        await new Promise((resolve) => setTimeout(resolve, 200));
        await expect(headerCheckbox).toHaveAttribute('aria-checked', 'true');
      }
    });

    await step('Verify selected count updates', async () => {
      // Wait for count to update
      await new Promise((resolve) => setTimeout(resolve, 100));
      // The component shows "Selected: X of Y rows"
      const selectedText = await canvas.findByText(/Selected: 5 of 5 rows/, {}, { timeout: 2000 });
      await expect(selectedText).toBeInTheDocument();
    });

    await step('Click individual row checkbox to deselect', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1];
      if (firstRowCheckbox !== undefined) {
        await userEvent.click(firstRowCheckbox);
        await expect(firstRowCheckbox).toHaveAttribute('aria-checked', 'false');
        // Header should now show indeterminate state
        const headerCheckbox = checkboxes[0];
        if (headerCheckbox !== undefined) {
          await expect(headerCheckbox).toHaveAttribute('aria-checked', 'mixed');
        }
      }
    });

    await step('Tab to checkbox and use Space key to toggle', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const secondRowCheckbox = checkboxes[2];
      if (secondRowCheckbox !== undefined) {
        await tabToElement(secondRowCheckbox, 10);
        await expect(secondRowCheckbox).toHaveFocus();
        // Press Space to toggle off
        await userEvent.keyboard(' ');
        await expect(secondRowCheckbox).toHaveAttribute('aria-checked', 'false');
      }
    });

    await step('Click header checkbox to deselect all', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      const headerCheckbox = checkboxes[0];
      if (headerCheckbox !== undefined) {
        // Click twice: first click selects all (from indeterminate), second deselects
        await userEvent.click(headerCheckbox);
        await userEvent.click(headerCheckbox);
        await expect(headerCheckbox).toHaveAttribute('aria-checked', 'false');
      }
    });

    await step('Verify all deselected', async () => {
      const selectedText = canvas.getByText(/Selected: 0 of 5 rows/);
      await expect(selectedText).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests checkbox selection: click to select all/deselect, individual row selection, and keyboard interaction with Space key.',
      },
    },
  },
};
