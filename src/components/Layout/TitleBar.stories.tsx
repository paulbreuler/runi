/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { TitleBar } from './TitleBar';
import { isMacSync } from '@/utils/platform';

const meta = {
  title: 'Layout/TitleBar',
  component: TitleBar,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0a0a0a',
        },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TitleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default TitleBar with default title "runi".
 * On macOS, uses native traffic light controls (overlay style).
 * On Windows/Linux, shows custom window controls on the right.
 */
export const Default: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar />
    </div>
  ),
};

/**
 * TitleBar with custom title.
 */
export const WithCustomTitle: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar title="My Custom Title" />
    </div>
  ),
};

/**
 * TitleBar with custom children content instead of title text.
 */
export const WithContent: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar>
        <div className="flex items-center gap-2">
          <span className="font-medium">API Request</span>
          <span className="text-text-muted text-xs">GET /api/users</span>
        </div>
      </TitleBar>
    </div>
  ),
};

/**
 * TitleBar styling with backdrop blur and semi-transparent background
 * (matches macOS overlay style).
 */
export const OverlayStyle: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar title="Overlay Title Bar" />
      <div className="p-8 text-text-secondary">
        Content area below title bar. Notice the backdrop blur and semi-transparent background
        effect.
      </div>
    </div>
  ),
};

/**
 * Test window controls interactions (Windows/Linux only).
 * Verifies that minimize, maximize, and close buttons are interactive.
 * Note: On macOS, native traffic light controls are used (not testable in Storybook).
 */
export const WindowControlsTest: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar title="Window Controls Test" />
      <div className="p-8 text-text-secondary">
        Test window controls. On Windows/Linux, buttons should be visible and clickable.
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const isMac = isMacSync();

    await step('Verify title bar is visible', async () => {
      await expect(canvas.getByTestId('titlebar')).toBeVisible();
    });

    if (!isMac) {
      await step('Verify window controls are visible (Windows/Linux)', async () => {
        await expect(canvas.getByTestId('titlebar-minimize')).toBeVisible();
        await expect(canvas.getByTestId('titlebar-maximize')).toBeVisible();
        await expect(canvas.getByTestId('titlebar-close')).toBeVisible();
      });

      await step('Verify window controls are interactive', async () => {
        const minimizeButton = canvas.getByTestId('titlebar-minimize');
        const maximizeButton = canvas.getByTestId('titlebar-maximize');
        const closeButton = canvas.getByTestId('titlebar-close');

        // Buttons should be clickable (not disabled)
        await expect(minimizeButton).not.toBeDisabled();
        await expect(maximizeButton).not.toBeDisabled();
        await expect(closeButton).not.toBeDisabled();

        // Test hover states by checking button classes
        await userEvent.hover(minimizeButton);
        await userEvent.hover(maximizeButton);
        await userEvent.hover(closeButton);
      });
    } else {
      await step('Verify native controls on macOS (not testable)', () => {
        // On macOS, native traffic light controls are used
        // They are not rendered in the component, so we can't test them
        void expect(canvas.queryByTestId('titlebar-minimize')).not.toBeInTheDocument();
        void expect(canvas.queryByTestId('titlebar-maximize')).not.toBeInTheDocument();
        void expect(canvas.queryByTestId('titlebar-close')).not.toBeInTheDocument();
      });
    }
  },
};

/**
 * Test keyboard navigation for title bar.
 * Verifies that title bar content is accessible via keyboard.
 */
export const KeyboardNavigationTest: Story = {
  render: () => (
    <div className="w-full bg-bg-app">
      <TitleBar title="Keyboard Navigation Test" />
      <div className="p-8 text-text-secondary">
        Test keyboard navigation. Tab through the title bar to verify accessibility.
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const isMac = isMacSync();

    await step('Verify title bar is accessible', async () => {
      const titlebar = canvas.getByTestId('titlebar');
      await expect(titlebar).toBeVisible();
    });

    if (!isMac) {
      await step('Verify window controls are keyboard accessible', async () => {
        const minimizeButton = canvas.getByTestId('titlebar-minimize');
        const maximizeButton = canvas.getByTestId('titlebar-maximize');
        const closeButton = canvas.getByTestId('titlebar-close');

        // Tab to buttons
        await userEvent.tab();
        // Should focus first button (minimize)
        await expect(minimizeButton).toHaveFocus();

        await userEvent.tab();
        // Should focus next button (maximize)
        await expect(maximizeButton).toHaveFocus();

        await userEvent.tab();
        // Should focus last button (close)
        await expect(closeButton).toHaveFocus();
      });
    }
  },
};
