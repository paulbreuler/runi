import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { DataPanelHeader } from './DataPanelHeader';
import { Button } from './button';
import { Download } from 'lucide-react';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'Components/UI/DataPanelHeader',
  component: DataPanelHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `A reusable header component for data panels with select all functionality.

## Features

- **Select All Checkbox**: Optional checkbox with support for checked, unchecked, and indeterminate states
- **Column Labels**: Configurable column labels with custom widths and styles
- **Enable/Disable**: Can be conditionally shown/hidden via \`enabled\` prop
- **Extensible**: Supports additional children content

## Usage

**Basic Header:**
\`\`\`tsx
<DataPanelHeader
  columns={[
    { label: 'Level', className: 'text-xs' },
    { label: 'Message', className: 'flex-1 text-xs' },
    { label: 'Time', className: 'w-24 text-right text-xs' },
  ]}
  allSelected={false}
  onSelectAllChange={(checked) => console.log(checked)}
/>
\`\`\`

**With Indeterminate State:**
\`\`\`tsx
<DataPanelHeader
  columns={columns}
  allSelected={false}
  someSelected={true}
  onSelectAllChange={handleSelectAll}
/>
\`\`\`

**Without Select All:**
\`\`\`tsx
<DataPanelHeader
  columns={columns}
  showSelectAll={false}
  allSelected={false}
  onSelectAllChange={() => {}}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    showSelectAll: {
      control: 'boolean',
      description: 'Whether to show the select all checkbox',
    },
    allSelected: {
      control: 'boolean',
      description: 'Whether all items are selected',
    },
    someSelected: {
      control: 'boolean',
      description: 'Whether some (but not all) items are selected',
    },
    enabled: {
      control: 'boolean',
      description: 'Whether the header is visible',
    },
  },
} satisfies Meta<typeof DataPanelHeader>;

export default meta;
// Use a more permissive Story type that allows render without args
type Story = StoryObj<typeof DataPanelHeader>;

const consoleColumns = [
  { label: 'Level', className: 'text-xs text-text-muted' },
  { label: 'Message', className: 'flex-1 text-xs text-text-muted' },
  { label: 'Time', className: 'w-24 text-right text-xs text-text-muted' },
];

const networkColumns = [
  { label: '', width: 'w-4' }, // Checkbox space
  { label: '', width: 'w-5' }, // Chevron space
  { label: 'Method', width: 'w-14', className: 'text-xs text-text-muted' },
  { label: 'URL', className: 'flex-1 text-xs text-text-muted' },
  { label: 'Status', width: 'w-12', className: 'text-right text-xs text-text-muted' },
  { label: 'Time', width: 'w-14', className: 'text-right text-xs text-text-muted' },
  { label: 'Size', width: 'w-16', className: 'text-right text-xs text-text-muted' },
];

export const Default: Story = {
  args: {
    columns: consoleColumns,
    allSelected: false,
    showSelectAll: true,
    onSelectAllChange: (checked) => {
      console.log('Select all:', checked);
    },
  },
};

export const AllSelected: Story = {
  args: {
    columns: consoleColumns,
    allSelected: true,
    showSelectAll: true,
    onSelectAllChange: (checked) => {
      console.log('Select all:', checked);
    },
  },
};

export const Indeterminate: Story = {
  args: {
    columns: consoleColumns,
    allSelected: false,
    someSelected: true,
    showSelectAll: true,
    onSelectAllChange: (checked) => {
      console.log('Select all:', checked);
    },
  },
};

export const WithoutSelectAll: Story = {
  args: {
    columns: consoleColumns,
    showSelectAll: false,
    allSelected: false,
    onSelectAllChange: (): void => {
      /* noop for story */
    },
  },
};

export const NetworkPanelStyle: Story = {
  args: {
    columns: networkColumns,
    allSelected: false,
    showSelectAll: true,
    onSelectAllChange: (checked) => {
      console.log('Select all:', checked);
    },
  },
};

export const Disabled: Story = {
  args: {
    columns: consoleColumns,
    allSelected: false,
    enabled: false,
    onSelectAllChange: (): void => {
      /* noop for story */
    },
  },
};

export const WithExtraContent: Story = {
  args: {
    columns: consoleColumns,
    allSelected: false,
    showSelectAll: true,
    onSelectAllChange: (checked) => {
      console.log('Select all:', checked);
    },
    children: (
      <Button size="xs" variant="ghost" className="ml-auto">
        <Download className="mr-1" size={12} />
        Export
      </Button>
    ),
  },
};

/**
 * Interactive example demonstrating select all functionality.
 */
export const Interactive: Story = {
  render: function InteractiveHeader() {
    const [items, setItems] = useState([
      { id: 1, selected: false },
      { id: 2, selected: true },
      { id: 3, selected: false },
      { id: 4, selected: false },
    ]);

    const allSelected = items.every((item) => item.selected);
    const someSelected = items.some((item) => item.selected);

    const handleSelectAll = (checked: boolean): void => {
      setItems((prev) => prev.map((item) => ({ ...item, selected: checked })));
    };

    return (
      <div className="bg-bg-app rounded-lg border border-border-default overflow-hidden">
        <DataPanelHeader
          columns={consoleColumns}
          allSelected={allSelected}
          someSelected={someSelected && !allSelected}
          onSelectAllChange={handleSelectAll}
        />
        <div className="p-4 text-sm text-text-secondary">
          <p>
            Selected: {items.filter((i) => i.selected).length} / {items.length}
          </p>
          <p className="text-xs text-text-muted mt-2">
            Click the checkbox to toggle select all.
            {someSelected && !allSelected && ' (Currently in indeterminate state)'}
          </p>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const selectAllCheckbox = canvas.getByRole('checkbox', { name: /select all/i });

    await step('Select all starts in indeterminate state', async () => {
      await expect(selectAllCheckbox).toBeVisible();
      await expect(selectAllCheckbox).toHaveAttribute('aria-checked', 'mixed');
      const statusText = canvas.getByText(/selected: 1 \/ 4/i);
      await expect(statusText).toBeVisible();
    });

    await step('Select all selects all items', async () => {
      await userEvent.click(selectAllCheckbox);
      await expect(selectAllCheckbox).toBeChecked();
      const statusText = canvas.getByText(/selected: 4 \/ 4/i);
      await expect(statusText).toBeVisible();
    });

    await step('Select all unselects all items', async () => {
      await userEvent.click(selectAllCheckbox);
      await expect(selectAllCheckbox).not.toBeChecked();
      const statusText = canvas.getByText(/selected: 0 \/ 4/i);
      await expect(statusText).toBeVisible();
    });

    await step('Keyboard navigation works', async () => {
      await tabToElement(selectAllCheckbox);
      await waitForFocus(selectAllCheckbox);
      await expect(selectAllCheckbox).toHaveFocus();
    });
  },
};
