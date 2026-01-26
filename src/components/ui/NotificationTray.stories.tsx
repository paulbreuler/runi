/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file NotificationTray Storybook stories
 * @description Consolidated story using Storybook 10 controls
 *
 * NotificationTray is a slide-up panel for notifications and system status.
 * Use controls to explore different configurations.
 */

import { useState, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NotificationTray, type NotificationTrayProps } from './NotificationTray';
import { NotificationTrayHeader } from './NotificationTrayHeader';
import { NotificationTrayContent } from './NotificationTrayContent';
import { NotificationTrayFooter } from './NotificationTrayFooter';
import { Button } from './button';

// No-op function for default args
const noop = (): void => {
  /* intentionally empty */
};

// Default args for stories that manage their own state
const defaultArgs: NotificationTrayProps = {
  isOpen: false,
  onClose: noop,
  header: null,
  content: null,
};

const meta = {
  title: 'UI/NotificationTray',
  component: NotificationTray,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        component: `NotificationTray - Slide-up panel for notifications and system status.

**Features:**
- Slides up from bottom (36px above status bar)
- Left edge aligns with trigger button
- No full-screen overlay (doesn't block the screen)
- Click outside to close (ignores interactive elements)
- Escape key to close
- Smooth enter/exit animations
- Respects prefers-reduced-motion

**Composition Pattern:**
Uses composition with separate header, content, and footer components:
- \`NotificationTrayHeader\` - Title, actions, close button
- \`NotificationTrayContent\` - Main content area
- \`NotificationTrayFooter\` - Footer with status/actions

Use the Controls panel to explore different configurations.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the notification tray is open',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback when notification tray should close',
    },
  },
  args: defaultArgs,
} satisfies Meta<NotificationTrayProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Interactive playground for NotificationTray.
 * Click the button to open the tray, then interact with it.
 */
export const Playground: Story = {
  args: defaultArgs,
  render: function PlaygroundStory() {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
      <div className="h-screen bg-bg-app flex flex-col">
        {/* Main content area */}
        <div className="flex-1 p-8">
          <h1 className="text-xl font-semibold text-text-primary mb-4">NotificationTray Demo</h1>
          <p className="text-text-secondary mb-4">
            Click the button below to open the notification tray. It will appear above the status
            bar.
          </p>
          <ul className="text-sm text-text-muted space-y-1 mb-8">
            <li>- Click outside to close</li>
            <li>- Press Escape to close</li>
            <li>- Click the chevron button to close</li>
          </ul>
        </div>

        {/* Simulated status bar */}
        <div className="h-9 border-t border-border-subtle bg-bg-surface/80 flex items-center px-5">
          <Button
            ref={buttonRef}
            variant="ghost"
            size="xs"
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            data-testid="open-tray-button"
          >
            {isOpen ? 'Close Tray' : 'Open Tray'}
          </Button>
        </div>

        {/* NotificationTray */}
        <NotificationTray
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
          }}
          buttonRef={buttonRef}
          header={
            <NotificationTrayHeader
              title="Notifications"
              onClose={() => {
                setIsOpen(false);
              }}
              actions={<span className="text-xs text-text-muted">3 new</span>}
            />
          }
          content={
            <NotificationTrayContent>
              <div className="space-y-2">
                <div className="p-2 bg-bg-raised rounded text-sm">
                  <div className="font-medium text-text-primary">Request completed</div>
                  <div className="text-xs text-text-muted">GET /api/users - 200 OK</div>
                </div>
                <div className="p-2 bg-bg-raised rounded text-sm">
                  <div className="font-medium text-text-primary">Spec imported</div>
                  <div className="text-xs text-text-muted">petstore.yaml loaded</div>
                </div>
                <div className="p-2 bg-bg-raised rounded text-sm">
                  <div className="font-medium text-amber-500">Drift detected</div>
                  <div className="text-xs text-text-muted">Response schema changed</div>
                </div>
              </div>
            </NotificationTrayContent>
          }
          footer={
            <NotificationTrayFooter>
              <span className="text-xs text-text-muted">Last updated: just now</span>
              <Button variant="ghost" size="xs">
                Clear all
              </Button>
            </NotificationTrayFooter>
          }
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial state - tray is closed', async () => {
      const button = canvas.getByTestId('open-tray-button');
      await expect(button).toBeInTheDocument();
      await expect(canvas.queryByTestId('notification-tray')).not.toBeInTheDocument();
    });

    await step('Open tray by clicking button', async () => {
      const button = canvas.getByTestId('open-tray-button');
      await userEvent.click(button);
      await expect(canvas.getByTestId('notification-tray')).toBeInTheDocument();
      await expect(canvas.getByTestId('notification-tray-header')).toBeInTheDocument();
      await expect(canvas.getByTestId('notification-tray-content')).toBeInTheDocument();
    });

    await step('Close tray by clicking close button', async () => {
      const closeButton = canvas.getByTestId('notification-tray-close-button');
      await userEvent.click(closeButton);
      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 400));
      await expect(canvas.queryByTestId('notification-tray')).not.toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for NotificationTray. Click the button to open/close the tray. Demonstrates the slide-up animation, click-outside-to-close, and composition pattern.',
      },
    },
  },
};
