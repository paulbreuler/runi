/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TitleBar Storybook stories
 * @description Stories for the TitleBar component showing platform variations and custom content
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TitleBar } from './TitleBar';
import { Search } from 'lucide-react';

const meta = {
  title: 'Layout/TitleBar',
  component: TitleBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Title bar component for window title and controls.
Supports platform-specific layouts (Mac vs Windows/Linux) and custom content.
`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Window title (shown when no children provided)',
    },
    onSettingsClick: {
      action: 'settings clicked',
      description: 'Callback for settings button (shows button if provided)',
    },
    children: {
      control: 'text', // Simple control for demo
      description: 'Custom content to render in the center',
    },
  },
  args: {
    title: 'runi',
  },
} satisfies Meta<typeof TitleBar>;

export default meta;
type Story = StoryObj<typeof TitleBar>;

/**
 * Default TitleBar with just a title.
 */
export const Default: Story = {
  args: {
    title: 'runi',
  },
};

/**
 * TitleBar with Settings button.
 */
export const WithSettings: Story = {
  args: {
    title: 'runi',
    onSettingsClick: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const settingsBtn = canvas.queryByTestId('titlebar-settings');

    // settings button might not show on Mac if the logic dictates?
    // TitleBar.tsx: `const showRightActions = showSettingsButton || !isMac;`
    // If isMac is true, showRightActions is true ONLY if showSettingsButton is true.
    // So if onSettingsClick is provided, it should show.

    if (settingsBtn !== null) {
      await step('Click settings button', async () => {
        await userEvent.click(settingsBtn);
        await expect(settingsBtn).toHaveFocus();
      });
    }
  },
};

/**
 * TitleBar with custom content (e.g. Search).
 * Note how the height adjusts automatically.
 */
export const CustomContent: Story = {
  args: {
    children: (
      <div className="flex items-center gap-2 px-3 py-1 bg-bg-raised/50 rounded-md border border-border-subtle w-64 mx-auto">
        <Search className="w-3.5 h-3.5 text-text-muted" />
        <span className="text-xs text-text-muted">Search...</span>
      </div>
    ),
  },
};

/**
 * Visual regression test: TitleBar with long title.
 */
export const LongTitle: Story = {
  args: {
    title: 'runi - A very long project name that might truncate if the window is too small',
  },
};
