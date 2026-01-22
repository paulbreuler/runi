/**
 * @file Accessibility Storybook stories
 * @description Visual documentation for accessibility features in DataGrid
 *
 * STORIES:
 * - KeyboardNavigation - Demonstrates keyboard navigation (Tab, Enter, Space, Arrow keys)
 * - ARIA - Shows ARIA attributes and screen reader support
 * - FocusManagement - Demonstrates focus visibility and logical focus order
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Row } from '@tanstack/react-table';
import { VirtualDataGrid } from '../VirtualDataGrid';
import { createSelectionColumn } from '../columns/selectionColumn';
import { createExpanderColumn } from '../columns/expanderColumn';
import type { ColumnDef } from '@tanstack/react-table';

// Test data type
interface TestRow {
  id: string;
  name: string;
  status: string;
  value: number;
  canExpand?: boolean;
}

// Sample test data
const testData: TestRow[] = [
  { id: '1', name: 'Alpha', status: 'active', value: 100, canExpand: true },
  { id: '2', name: 'Beta', status: 'pending', value: 200, canExpand: false },
  { id: '3', name: 'Gamma', status: 'inactive', value: 300, canExpand: true },
  { id: '4', name: 'Delta', status: 'active', value: 400, canExpand: true },
  { id: '5', name: 'Epsilon', status: 'pending', value: 500, canExpand: false },
];

// Column definitions
const createColumns = (): Array<ColumnDef<TestRow>> => [
  createSelectionColumn<TestRow>(),
  createExpanderColumn<TestRow>({
    canExpand: (row) => row.canExpand ?? false,
  }),
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'value',
    accessorKey: 'value',
    header: 'Value',
  },
];

import type { VirtualDataGridProps } from '../VirtualDataGrid';

const meta = {
  title: 'Components/DataGrid/Accessibility',
  component: VirtualDataGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Accessibility features for DataGrid including keyboard navigation, ARIA attributes, and focus management.

## Keyboard Navigation

- **Tab/Shift+Tab**: Navigate through interactive elements (checkboxes, expander buttons)
- **Enter**: Expand/collapse rows when expander button is focused
- **Space**: Select rows when checkbox is focused
- **Arrow Keys**: Navigate between rows (Up/Down) and cells (Left/Right)

## ARIA Attributes

- **Table**: \`role="table"\`
- **Rows**: \`role="row"\`
- **Cells**: \`role="cell"\`
- **Headers**: \`role="columnheader"\`
- **Expander buttons**: \`aria-expanded\` attribute
- **Checkboxes**: \`aria-label\` for screen readers

## Focus Management

- **Visible focus**: Focus indicators with blue ring
- **Logical order**: Tab order follows visual layout
- **No focus trap**: Users can tab in and out of the table
- **Interactive elements**: Only interactive cells have \`tabindex="0"\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VirtualDataGrid>;

export default meta;
type Story = StoryObj<VirtualDataGridProps<TestRow>>;

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
  args: {
    data: testData,
    columns: createColumns(),
    getRowId: (row: TestRow): string => row.id,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: (row: Row<TestRow>): boolean => {
      return row.original.canExpand ?? false;
    },
    height: 400,
  },
  render: () => (
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
            <kbd className="px-1.5 py-0.5 bg-bg-raised rounded text-xs">Enter</kbd>: Expand/collapse
            rows (when expander button focused)
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
      <VirtualDataGrid
        data={testData}
        columns={createColumns()}
        getRowId={(row) => row.id}
        enableRowSelection
        enableExpanding
        getRowCanExpand={(row) => row.original.canExpand ?? false}
        height={400}
      />
    </div>
  ),
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
 * - Table has \`role="table"\`
 * - Rows have \`role="row"\`
 * - Cells have \`role="cell"\`
 * - Headers have \`role="columnheader"\`
 * - Expander buttons have \`aria-expanded\`
 * - Checkboxes have \`aria-label\`
 */
export const ARIA: Story = {
  args: {
    data: testData,
    columns: createColumns(),
    getRowId: (row: TestRow): string => row.id,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: (row: Row<TestRow>): boolean => {
      return row.original.canExpand ?? false;
    },
    height: 400,
  },
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-text-secondary">
        <p className="font-medium mb-2">ARIA Attributes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Table:{' '}
            <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">role=&quot;table&quot;</code>
          </li>
          <li>
            Rows:{' '}
            <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">role=&quot;row&quot;</code>
          </li>
          <li>
            Cells:{' '}
            <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">role=&quot;cell&quot;</code>
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
            Checkboxes: <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">aria-label</code>
          </li>
        </ul>
      </div>
      <VirtualDataGrid
        data={testData}
        columns={createColumns()}
        getRowId={(row) => row.id}
        enableRowSelection
        enableExpanding
        getRowCanExpand={(row) => row.original.canExpand ?? false}
        height={400}
      />
    </div>
  ),
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
  args: {
    data: testData,
    columns: createColumns(),
    getRowId: (row: TestRow): string => row.id,
    enableRowSelection: true,
    enableExpanding: true,
    getRowCanExpand: (row: Row<TestRow>): boolean => {
      return row.original.canExpand ?? false;
    },
    height: 400,
  },
  render: () => (
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
        <VirtualDataGrid
          data={testData}
          columns={createColumns()}
          getRowId={(row) => row.id}
          enableRowSelection
          enableExpanding
          getRowCanExpand={(row) => row.original.canExpand ?? false}
          height={400}
        />
        <button className="mt-4 px-3 py-1.5 bg-accent-blue text-white rounded text-sm">
          After Table (Tab here after)
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates focus management. Tab through the table to see focus indicators and logical tab order.',
      },
    },
  },
};
