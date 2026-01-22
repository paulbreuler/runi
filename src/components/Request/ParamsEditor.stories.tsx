import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { tabToElement } from '@/utils/storybook-test-helpers';
import { ParamsEditor } from './ParamsEditor';
import { useRequestStore } from '@/stores/useRequestStore';

type Story = StoryObj<typeof meta>;

const StoreSeed = ({
  url = 'https://httpbin.org/get',
  children,
}: {
  url?: string;
  children: React.ReactNode;
}): React.JSX.Element => {
  useEffect(() => {
    useRequestStore.setState({ url });
    return () => {
      useRequestStore.getState().reset();
    };
  }, [url]);

  return <>{children}</>;
};

const meta = {
  title: 'Components/Request/ParamsEditor',
  component: ParamsEditor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Query parameter editor for the request builder. Shows key/value inputs with glass styling for consistent focus and hover treatments.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ParamsEditor>;

export default meta;

export const Empty: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
};

export const WithParams: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed url="https://httpbin.org/get?status=active&limit=20">
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
};

export const Editing: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByTestId('add-param-button'));
  },
};

/**
 * Tests form interactions: adding, editing, and removing parameters.
 */
export const FormInteractionsTest: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Add new parameter', async () => {
      const addButton = canvas.getByTestId('add-param-button');
      await userEvent.click(addButton);
      const keyInput = canvas.getByTestId('new-param-key-input');
      const valueInput = canvas.getByTestId('new-param-value-input');
      await expect(keyInput).toBeVisible();
      await expect(valueInput).toBeVisible();
    });

    await step('Enter parameter key and value', async () => {
      const keyInput = canvas.getByTestId('new-param-key-input');
      const valueInput = canvas.getByTestId('new-param-value-input');
      await userEvent.type(keyInput, 'status');
      await userEvent.type(valueInput, 'active');
      await expect(keyInput).toHaveValue('status');
      await expect(valueInput).toHaveValue('active');
    });

    await step('Save parameter with Enter key', async () => {
      const keyInput = canvas.getByTestId('new-param-key-input');
      await userEvent.keyboard('{Enter}');
      // Parameter should be saved and editing mode closed
      await expect(keyInput).not.toBeInTheDocument();
    });

    await step('Edit existing parameter', async () => {
      // Click on the parameter row to edit
      const paramRow = canvas.getByText('status');
      await userEvent.click(paramRow);
      const keyInput = canvas.getByTestId('param-key-input-0');
      await expect(keyInput).toHaveValue('status');
    });

    await step('Remove parameter', async () => {
      // First add a parameter to remove
      const addButton = canvas.getByTestId('add-param-button');
      await userEvent.click(addButton);
      const keyInput = canvas.getByTestId('new-param-key-input');
      await userEvent.type(keyInput, 'test');
      await userEvent.keyboard('{Enter}');
      // Hover to show remove button, then click
      const removeButton = canvas.getByTestId('remove-param-1');
      await userEvent.click(removeButton);
      await expect(canvas.queryByText('test')).not.toBeInTheDocument();
    });
  },
};

/**
 * Tests keyboard navigation through form elements.
 */
export const KeyboardNavigationTest: Story = {
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed url="https://httpbin.org/get?status=active&limit=20">
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to add parameter button', async () => {
      const addButton = canvas.getByTestId('add-param-button');
      const focused = await tabToElement(addButton, 5);
      void expect(focused).toBe(true);
      await expect(addButton).toHaveFocus();
    });

    await step('Add parameter and tab through inputs', async () => {
      await userEvent.keyboard('{Enter}');
      const keyInput = canvas.getByTestId('new-param-key-input');
      await expect(keyInput).toHaveFocus();
      await userEvent.tab();
      const valueInput = canvas.getByTestId('new-param-value-input');
      await expect(valueInput).toHaveFocus();
    });

    await step('Cancel with Escape key', async () => {
      await userEvent.keyboard('{Escape}');
      const keyInput = canvas.queryByTestId('new-param-key-input');
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
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Add parameter with empty key should not save', async () => {
      const addButton = canvas.getByTestId('add-param-button');
      await userEvent.click(addButton);
      const valueInput = canvas.getByTestId('new-param-value-input');
      await userEvent.type(valueInput, 'value-only');
      await userEvent.keyboard('{Enter}');
      // Empty key should cancel editing
      const keyInput = canvas.queryByTestId('new-param-key-input');
      await expect(keyInput).not.toBeInTheDocument();
    });

    await step('Add parameter with key only should save', async () => {
      const addButton = canvas.getByTestId('add-param-button');
      await userEvent.click(addButton);
      const keyInput = canvas.getByTestId('new-param-key-input');
      await userEvent.type(keyInput, 'key-only');
      await userEvent.keyboard('{Enter}');
      // Should save with empty value
      await expect(canvas.getByText('key-only')).toBeVisible();
    });
  },
};
