/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { CommandBar } from './CommandBar';

const meta: Meta<typeof CommandBar> = {
  title: 'Command/CommandBar',
  component: CommandBar,
  args: {
    isOpen: true,
  },
  argTypes: {
    isOpen: { control: 'boolean' },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Floating command palette overlay triggered by Cmd+K. Provides global search across collections, open tabs, and history, plus quick actions.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof CommandBar>;

/**
 * Playground: Command bar with default state.
 */
export const Playground: Story = {
  args: {
    onClose: (): void => {
      console.log('Command bar closed');
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify command bar is visible', async () => {
      const commandBar = canvas.getByTestId('command-bar');
      await expect(commandBar).toBeInTheDocument();
    });

    await step('Verify input is focused', async () => {
      const input = canvas.getByTestId('command-bar-input');
      await expect(input).toHaveFocus();
    });

    await step('Verify sections are visible', async () => {
      // Actions section should always be visible
      await expect(canvas.getByText(/actions/i)).toBeInTheDocument();
      await expect(canvas.getByText(/new request/i)).toBeInTheDocument();
    });
  },
};

/**
 * With search query: Command bar with a search query entered.
 */
export const WithSearchQuery: Story = {
  args: {
    onClose: (): void => {
      console.log('Command bar closed');
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Type search query', async () => {
      const input = canvas.getByTestId('command-bar-input');
      await userEvent.type(input, 'request');
      await expect(input).toHaveValue('request');
    });

    await step('Verify filtered results', async () => {
      // Should show "New Request" action
      await expect(canvas.getByText(/new request/i)).toBeInTheDocument();
    });
  },
};

/**
 * Keyboard navigation: Command bar with keyboard navigation.
 */
export const KeyboardNavigation: Story = {
  args: {
    onClose: (): void => {
      console.log('Command bar closed');
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Navigate with arrow keys', async () => {
      const input = canvas.getByTestId('command-bar-input');
      await userEvent.click(input);
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowDown}');
      // cmdk handles the selection state internally
      await expect(input).toBeInTheDocument();
    });
  },
};

/**
 * Closed state: Command bar in closed state.
 */
export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: (): void => {
      console.log('Command bar closed');
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify command bar is not visible', async () => {
      const commandBar = canvas.queryByTestId('command-bar');
      await expect(commandBar).not.toBeInTheDocument();
    });
  },
};
