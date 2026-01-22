import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { StatusBar } from './StatusBar';

const meta = {
  title: 'Layout/StatusBar',
  component: StatusBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full border border-border-default bg-bg-app">
      <StatusBar />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('status-bar')).toBeInTheDocument();
    // Verify status bar displays environment info
    await expect(canvas.getByText(/Environment:/i)).toBeInTheDocument();
  },
};

/**
 * Test status bar content and keyboard shortcut hint.
 * Verifies that status bar displays correct information and keyboard shortcut hint.
 */
export const ContentTest: Story = {
  render: () => (
    <div className="w-full border border-border-default bg-bg-app">
      <StatusBar />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify status bar is visible', async () => {
      await expect(canvas.getByTestId('status-bar')).toBeVisible();
    });

    await step('Verify environment information is displayed', async () => {
      await expect(canvas.getByText(/Environment:/i)).toBeVisible();
      await expect(canvas.getByText(/default/i)).toBeVisible();
    });

    await step('Verify keyboard shortcut hint is displayed', async () => {
      await expect(canvas.getByText(/for AI assistance/i)).toBeVisible();
      // Should show modifier key (⌘ or Ctrl)
      const modifierKey = canvas.getByText(/⌘|Ctrl/i);
      await expect(modifierKey).toBeVisible();
    });
  },
};
