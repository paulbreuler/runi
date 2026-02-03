/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SettingsPanel } from './SettingsPanel';
import { DEFAULT_SETTINGS } from '@/types/settings-defaults';

const meta: Meta<typeof SettingsPanel> = {
  title: 'Settings/SettingsPanel',
  component: SettingsPanel,
  args: {
    isOpen: true,
  },
  argTypes: {
    isOpen: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof SettingsPanel>;

/**
 * Playground: Settings panel with General tab content.
 */
export const Playground: Story = {
  args: {
    initialSettings: DEFAULT_SETTINGS,
    onClose: (): void => undefined,
    onSettingsChange: (): void => undefined,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Focus search and type query', async () => {
      const search = canvas.getByTestId('settings-search-input');
      await userEvent.click(search);
      await userEvent.type(search, 'timeout');
      await expect(canvas.getByText(/match/)).toBeInTheDocument();
    });

    await step('Clear search query', async () => {
      const clear = canvas.getByTestId('settings-search-clear');
      await userEvent.click(clear);
      await expect(canvas.queryByText(/match/)).not.toBeInTheDocument();
    });
  },
};
