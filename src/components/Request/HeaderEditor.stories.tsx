import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { waitForFocus } from '@/utils/storybook-test-helpers';
import { HeaderEditor } from './HeaderEditor';
import { useRequestStore } from '@/stores/useRequestStore';

type Story = StoryObj<typeof meta>;

const StoreSeed = ({
  headers = {},
  children,
}: {
  headers?: Record<string, string>;
  children: React.ReactNode;
}): React.JSX.Element => {
  useEffect((): void | (() => void) => {
    useRequestStore.setState({ headers });
    return (): void => {
      useRequestStore.getState().reset();
    };
  }, [headers]);

  return <>{children}</>;
};

const meta = {
  title: 'Components/Request/HeaderEditor',
  component: HeaderEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Header editor used inside the request builder. Uses glass inputs to match the search aesthetic and provides inline editing for key/value pairs.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HeaderEditor>;

export default meta;

export const Empty: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
};

export const Editing: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed headers={{ 'Content-Type': 'application/json' }}>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('add-header-button'));
  },
};

/**
 * Tests form interactions: adding, editing, and removing headers.
 */
export const FormInteractionsTest: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Add new header', async () => {
      const addButton = canvas.getByTestId('add-header-button');
      await userEvent.click(addButton);
      // Wait for inputs to appear (React state update)
      await new Promise((resolve) => setTimeout(resolve, 100));
      const keyInput = await canvas.findByTestId('new-header-key-input', {}, { timeout: 2000 });
      const valueInput = await canvas.findByTestId('new-header-value-input', {}, { timeout: 2000 });
      await expect(keyInput).toBeVisible();
      await expect(valueInput).toBeVisible();
    });

    await step('Enter header key and value', async () => {
      const keyInput = canvas.getByTestId('new-header-key-input');
      const valueInput = canvas.getByTestId('new-header-value-input');
      await userEvent.type(keyInput, 'X-Custom-Header');
      await userEvent.type(valueInput, 'custom-value');
      await expect(keyInput).toHaveValue('X-Custom-Header');
      await expect(valueInput).toHaveValue('custom-value');
    });

    await step('Save header with Enter key', async () => {
      const keyInput = canvas.getByTestId('new-header-key-input');
      await userEvent.keyboard('{Enter}');
      // Header should be saved and editing mode closed
      await expect(keyInput).not.toBeInTheDocument();
      await expect(canvas.getByText('X-Custom-Header')).toBeVisible();
    });

    await step('Edit existing header', async () => {
      // Click on the header row to edit
      const headerRow = canvas.getByText('X-Custom-Header');
      await userEvent.click(headerRow);
      const keyInput = canvas.getByTestId('header-key-input-X-Custom-Header');
      await expect(keyInput).toHaveValue('X-Custom-Header');
    });

    await step('Remove header', async () => {
      // First add a header to remove
      const addButton = canvas.getByTestId('add-header-button');
      await userEvent.click(addButton);
      const keyInput = canvas.getByTestId('new-header-key-input');
      await userEvent.type(keyInput, 'X-Test-Header');
      await userEvent.keyboard('{Enter}');
      // Hover to show remove button, then click
      const removeButton = canvas.getByTestId('remove-header-X-Test-Header');
      await userEvent.click(removeButton);
      await expect(canvas.queryByText('X-Test-Header')).not.toBeInTheDocument();
    });
  },
};

/**
 * Tests keyboard navigation through form elements.
 */
export const KeyboardNavigationTest: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed headers={{ 'Content-Type': 'application/json', Accept: 'application/json' }}>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to add header button', async () => {
      const addButton = canvas.getByTestId('add-header-button');
      addButton.focus();
      await waitForFocus(addButton, 1000);
      await expect(addButton).toHaveFocus();
    });

    await step('Add header and tab through inputs', async () => {
      await userEvent.keyboard('{Enter}');
      // Wait for inputs to appear
      await new Promise((resolve) => setTimeout(resolve, 100));
      const keyInput = await canvas.findByTestId('new-header-key-input', {}, { timeout: 2000 });
      await waitForFocus(keyInput, 1000);
      await expect(keyInput).toHaveFocus();
      await userEvent.tab();
      const valueInput = await canvas.findByTestId('new-header-value-input', {}, { timeout: 2000 });
      await waitForFocus(valueInput, 1000);
      await expect(valueInput).toHaveFocus();
    });

    await step('Cancel with Escape key', async () => {
      await userEvent.keyboard('{Escape}');
      const keyInput = canvas.queryByTestId('new-header-key-input');
      await expect(keyInput).not.toBeInTheDocument();
    });
  },
};

/**
 * Tests validation: empty key handling and Enter key submission.
 */
export const ValidationTest: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Add header with empty key should not save', async () => {
      const addButton = canvas.getByTestId('add-header-button');
      await userEvent.click(addButton);
      // Wait for inputs to appear
      await new Promise((resolve) => setTimeout(resolve, 100));
      const valueInput = await canvas.findByTestId('new-header-value-input', {}, { timeout: 2000 });
      await userEvent.type(valueInput, 'value-only');
      await userEvent.keyboard('{Enter}');
      // Wait for validation/cancel
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Empty key should cancel editing
      const keyInput = canvas.queryByTestId('new-header-key-input');
      await expect(keyInput).not.toBeInTheDocument();
    });

    await step('Add header with key only should save', async () => {
      const addButton = canvas.getByTestId('add-header-button');
      await userEvent.click(addButton);
      // Wait for inputs to appear
      await new Promise((resolve) => setTimeout(resolve, 100));
      const keyInput = await canvas.findByTestId('new-header-key-input', {}, { timeout: 2000 });
      await userEvent.type(keyInput, 'X-Key-Only');
      await userEvent.keyboard('{Enter}');
      // Wait for save
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Should save with empty value
      await expect(canvas.getByText('X-Key-Only')).toBeVisible();
    });
  },
};
