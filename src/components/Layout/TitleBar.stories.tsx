/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TitleBar Storybook stories
 * @description Stories for the TitleBar component showing platform variations and custom content
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within, mocked } from 'storybook/test';
import { TitleBar } from './TitleBar';
import { Search } from 'lucide-react';
import { isMacSync } from '@/utils/platform';

// Custom args for story controls
interface TitleBarStoryArgs {
  platform?: 'macOS' | 'Windows';
}

type CombinedProps = React.ComponentProps<typeof TitleBar> & TitleBarStoryArgs;

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

**Storybook 10 Features:**
- Uses \`sb.mock\` for platform simulation.
- Uses controls for state variations.
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
    platform: {
      control: 'radio',
      options: ['macOS', 'Windows'],
      description: 'Simulate platform-specific controls',
    },
  },
  args: {
    title: 'runi',
    platform: 'macOS',
  },
} satisfies Meta<CombinedProps>;

export default meta;
type Story = StoryObj<CombinedProps>;

/**
 * Default TitleBar with just a title.
 */
export const Default: Story = {
  render: (args) => {
    mocked(isMacSync).mockReturnValue(args.platform === 'macOS');
    return <TitleBar title={args.title} />;
  },
};

/**
 * Windows-style TitleBar.
 */
export const WindowsLayout: Story = {
  args: {
    platform: 'Windows',
  },
  render: (args) => {
    mocked(isMacSync).mockReturnValue(args.platform === 'macOS');
    return <TitleBar title={args.title} onSettingsClick={fn()} />;
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
  render: (args) => {
    mocked(isMacSync).mockReturnValue(args.platform === 'macOS');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { platform, ...rest } = args;
    return <TitleBar {...rest} />;
  },
};

/**
 * Interaction test for window controls and settings.
 */
export const InteractionTest: Story = {
  args: {
    onSettingsClick: fn(),
    platform: 'Windows',
  },
  render: (args) => {
    mocked(isMacSync).mockReturnValue(args.platform === 'macOS');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { platform, ...rest } = args;
    return <TitleBar {...rest} />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const settingsBtn = canvas.queryByTestId('titlebar-settings');

    if (settingsBtn !== null) {
      await step('Click settings button', async () => {
        await userEvent.click(settingsBtn);
        await expect(settingsBtn).toHaveFocus();
      });
    }

    await step('Verify window controls are present', async () => {
      await expect(canvas.getByTestId('titlebar-minimize')).toBeVisible();
      await expect(canvas.getByTestId('titlebar-maximize')).toBeVisible();
      await expect(canvas.getByTestId('titlebar-close')).toBeVisible();
    });
  },
};
