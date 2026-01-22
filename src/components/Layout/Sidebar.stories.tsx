import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Sidebar with Collections drawer (default state).
 */
export const Default: Story = {
  render: () => (
    <div className="w-64 h-screen border border-border-default bg-bg-app">
      <Sidebar />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId('sidebar-content')).toBeInTheDocument();
    await expect(canvas.getByTestId('collections-drawer')).toBeInTheDocument();
  },
};

/**
 * Test keyboard navigation and drawer interactions.
 * Verifies that Collections drawer can be toggled and keyboard navigation works.
 */
export const KeyboardNavigationTest: Story = {
  render: () => (
    <div className="w-64 h-screen border border-border-default bg-bg-app">
      <Sidebar />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify sidebar content is visible', async () => {
      await expect(canvas.getByTestId('sidebar-content')).toBeInTheDocument();
      await expect(canvas.getByTestId('collections-drawer')).toBeInTheDocument();
    });

    await step('Toggle Collections drawer with keyboard', async () => {
      const drawerButton = canvas.getByRole('button', { expanded: true });
      await expect(drawerButton).toHaveAttribute('aria-expanded', 'true');

      // Tab to button and activate with Enter
      await userEvent.tab();
      await userEvent.keyboard('{Enter}');

      // Drawer should collapse
      await expect(drawerButton).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Expand Collections drawer again', async () => {
      const drawerButton = canvas.getByRole('button', { expanded: false });
      await userEvent.click(drawerButton);
      await expect(drawerButton).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

/**
 * Test drawer state persistence.
 * Verifies that drawer open/closed state is maintained.
 */
export const StatePersistenceTest: Story = {
  render: () => (
    <div className="w-64 h-screen border border-border-default bg-bg-app">
      <Sidebar />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial drawer state (open by default)', async () => {
      const drawerButton = canvas.getByRole('button', { expanded: true });
      await expect(drawerButton).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Toggle drawer closed and verify state', async () => {
      const drawerButton = canvas.getByRole('button', { expanded: true });
      await userEvent.click(drawerButton);
      await expect(drawerButton).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Toggle drawer open and verify state persists', async () => {
      const drawerButton = canvas.getByRole('button', { expanded: false });
      await userEvent.click(drawerButton);
      await expect(drawerButton).toHaveAttribute('aria-expanded', 'true');
    });
  },
};
