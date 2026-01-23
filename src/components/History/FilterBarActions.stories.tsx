/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { FilterBarActions } from './FilterBarActions';
import { ActionBar } from '@/components/ActionBar';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

const meta = {
  title: 'Components/History/FilterBarActions',
  component: FilterBarActions,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Action buttons for the filter bar: Save and Delete.

## Features

- **Composite Save button**: Split button with dropdown for "Save All" option
- **Destructive Delete button**: Uses destructive-outline variant
- **Responsive variants**: Inherits variant from ActionBar context

## Accessibility

- All buttons have aria-labels for screen readers
- Dropdown uses aria-expanded for state
- Delete button is clearly marked as destructive action

## Usage

FilterBarActions should be used inside an ActionBar to get automatic responsive behavior:

\`\`\`tsx
<ActionBar>
  <FilterBarActions
    onSaveAll={handleSaveAll}
    onSaveSelection={handleSaveSelection}
    onClearAll={handleClearAll}
    isSaveSelectionDisabled={false}
  />
</ActionBar>
\`\`\`
`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FilterBarActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = fn();
const noopAsync = fn().mockResolvedValue(undefined);

/**
 * Default full variant with all labels.
 */
export const Default: Story = {
  args: {
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <ActionBar aria-label="Filter bar actions demo">
      <FilterBarActions {...args} />
    </ActionBar>
  ),
};

/**
 * Save selection disabled (no entries selected).
 */
export const SaveDisabled: Story = {
  args: {
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: true,
  },
  render: (args) => (
    <ActionBar aria-label="Filter bar actions demo">
      <FilterBarActions {...args} />
    </ActionBar>
  ),
};

/**
 * All variants side by side for comparison.
 * The variant is determined by the ActionBar container width.
 */
export const AllVariants: Story = {
  args: {
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-text-muted mb-2">
          Full variant (auto-detected when ActionBar is wide)
        </p>
        <ActionBar breakpoints={[100, 50]} aria-label="Full variant">
          <FilterBarActions {...args} />
        </ActionBar>
      </div>
      <div>
        <p className="text-xs text-text-muted mb-2">
          Note: Resize the ActionBar container to see responsive variants
        </p>
      </div>
    </div>
  ),
};

/**
 * Test button interactions: Save and Delete buttons.
 */
export const ButtonInteractionsTest: Story = {
  args: {
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <ActionBar aria-label="Filter bar actions demo">
      <FilterBarActions {...args} />
    </ActionBar>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click Save button', async () => {
      // There might be multiple save buttons (primary and in dropdown), get the first one
      const saveButtons = canvas.getAllByRole('button', { name: /save/i });
      const saveButton = saveButtons[0];
      if (saveButton !== undefined) {
        await userEvent.click(saveButton);
        await expect(noop).toHaveBeenCalled();
      }
    });

    await step('Click Delete All button', async () => {
      const deleteButton = canvas.getByRole('button', {
        name: /delete all network history entries/i,
      });
      await userEvent.click(deleteButton);
      // onClearAll is async, so wait a bit
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
      await expect(noopAsync).toHaveBeenCalled();
    });
  },
};

/**
 * Test keyboard navigation through action buttons.
 */
export const KeyboardNavigationTest: Story = {
  args: {
    onSaveAll: noop,
    onSaveSelection: noop,
    onClearAll: noopAsync,
    isSaveSelectionDisabled: false,
  },
  render: (args) => (
    <ActionBar aria-label="Filter bar actions demo">
      <FilterBarActions {...args} />
    </ActionBar>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to Save button', async () => {
      // Get the first save button (primary action)
      const saveButtons = canvas.getAllByRole('button', { name: /save/i });
      const saveButton = saveButtons[0];
      if (saveButton !== undefined) {
        saveButton.focus();
        await waitForFocus(saveButton, 1000);
        await expect(saveButton).toHaveFocus();
      }
      await expect(saveButton).toHaveFocus();
    });

    await step('Tab to Delete All button', async () => {
      const deleteButton = canvas.getByRole('button', {
        name: /delete all network history entries/i,
      });
      const focused = await tabToElement(deleteButton, 10);
      await expect(focused).toBe(true);
      await expect(deleteButton).toHaveFocus();
    });
  },
};
