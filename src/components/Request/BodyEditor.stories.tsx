import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect } from 'react';
import { expect, userEvent, within } from '@storybook/test';
import { waitForFocus } from '@/utils/storybook-test-helpers';
import { BodyEditor } from './BodyEditor';
import { useRequestStore } from '@/stores/useRequestStore';

const meta = {
  title: 'Components/Request/BodyEditor',
  component: BodyEditor,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BodyEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const BodyStateDecorator = ({ body }: { body: string }): React.JSX.Element => {
  useEffect((): void | (() => void) => {
    useRequestStore.setState({ body });
    return (): void => {
      useRequestStore.getState().reset();
    };
  }, [body]);

  return (
    <div className="h-64 border border-border-default bg-bg-app">
      <BodyEditor />
    </div>
  );
};

export const Empty: Story = {
  render: () => <BodyStateDecorator body="" />,
};

export const ValidJson: Story = {
  render: () => <BodyStateDecorator body='{"name":"Runi","count":3}' />,
};

export const InvalidJson: Story = {
  render: () => <BodyStateDecorator body='{"name":"Runi",}' />,
};

/**
 * Tests form interactions: typing JSON, validation, and formatting.
 */
export const FormInteractionsTest: Story = {
  render: () => <BodyStateDecorator body="" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Type valid JSON', async () => {
      const textarea = canvas.getByTestId('body-textarea');
      await userEvent.type(textarea, '{"name":"test","count":1}');
      await expect(textarea).toHaveValue('{"name":"test","count":1}');
      // Should show valid JSON indicator
      await expect(canvas.getByText('Valid JSON')).toBeVisible();
    });

    await step('Format JSON', async () => {
      const formatButton = canvas.getByTestId('format-json-button');
      await userEvent.click(formatButton);
      const textarea = canvas.getByTestId('body-textarea');
      // Should be formatted with 2-space indentation
      await expect(textarea).toHaveValue('{\n  "name": "test",\n  "count": 1\n}');
    });

    await step('Type invalid JSON', async () => {
      const textarea = canvas.getByTestId('body-textarea');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, '{"name":"test",}');
      // Should show invalid JSON indicator
      await expect(canvas.getByText('Invalid JSON')).toBeVisible();
      // Format button should not be visible
      await expect(canvas.queryByTestId('format-json-button')).not.toBeInTheDocument();
    });
  },
};

/**
 * Tests keyboard navigation and Tab key handling.
 */
export const KeyboardNavigationTest: Story = {
  render: () => <BodyStateDecorator body="" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to textarea', async () => {
      const textarea = canvas.getByTestId('body-textarea');
      textarea.focus();
      await waitForFocus(textarea, 1000);
      await expect(textarea).toHaveFocus();
    });

    await step('Tab key inserts 2 spaces', async () => {
      const textarea = canvas.getByTestId('body-textarea');
      await userEvent.type(textarea, 'test');
      await userEvent.keyboard('{Tab}');
      // Tab should insert 2 spaces, not move focus
      await expect(textarea).toHaveValue('test  ');
      await expect(textarea).toHaveFocus();
    });
  },
};

/**
 * Tests JSON validation states.
 */
export const ValidationTest: Story = {
  render: () => <BodyStateDecorator body="" />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Empty body shows no validation indicator', async () => {
      const textarea = canvas.getByTestId('body-textarea');
      await expect(textarea).toHaveValue('');
      await expect(canvas.queryByText('Valid JSON')).not.toBeInTheDocument();
      await expect(canvas.queryByText('Invalid JSON')).not.toBeInTheDocument();
    });

    await step('Valid JSON shows success indicator', async () => {
      const textarea = canvas.getByTestId('body-textarea');
      await userEvent.type(textarea, '{"valid": true}');
      // Wait for validation to run
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(canvas.getByText('Valid JSON')).toBeVisible();
      await expect(canvas.getByTestId('format-json-button')).toBeVisible();
    });

    await step('Invalid JSON shows error indicator', async () => {
      const textarea = canvas.getByTestId('body-textarea');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, '{"invalid": }');
      // Wait for validation to run
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(canvas.getByText('Invalid JSON')).toBeVisible();
      await expect(canvas.queryByTestId('format-json-button')).not.toBeInTheDocument();
    });
  },
};
