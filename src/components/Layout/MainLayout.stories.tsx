/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file MainLayout Storybook stories
 * @description Consolidated story using Storybook 10 controls
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { useEffect } from 'react';
import { MainLayout, type MainLayoutProps } from './MainLayout';
import { usePanelStore } from '@/stores/usePanelStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useKeybindingStore } from '@/stores/useKeybindingStore';
import { requestContextDescriptor } from '@/contexts/RequestContext';

// Custom args for story controls (not part of component props - controls store state)
interface MainLayoutStoryArgs {
  sidebarCollapsed?: boolean;
  devToolsPosition?: 'bottom' | 'left' | 'right' | 'hidden';
  devToolsCollapsed?: boolean;
  hasOpenTabs?: boolean;
}

const meta = {
  title: 'Layout/MainLayout',
  component: MainLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `The MainLayout provides a resizable layout with sidebar, request pane, response pane, and a dockable DevTools panel.

**Features:**
- Sidebar: Resizable (256-500px), collapsible
- Request/Response panes: Resizable split (20-80%)
- DevTools panel: Dockable (bottom, left, right), collapsible
- Keyboard shortcuts: Cmd+B (sidebar), Cmd+Shift+I (DevTools)

Use controls to explore different configurations.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sidebarCollapsed: {
      control: 'boolean',
      description: 'Sidebar collapsed state',
    },
    devToolsPosition: {
      control: 'select',
      options: ['bottom', 'left', 'right', 'hidden'],
      description: 'DevTools panel position',
    },
    devToolsCollapsed: {
      control: 'boolean',
      description: 'DevTools panel collapsed',
    },
    hasOpenTabs: {
      control: 'boolean',
      description: 'Whether to show multiple open tabs',
    },
  },
  args: {
    sidebarCollapsed: false,
    devToolsPosition: 'bottom',
    devToolsCollapsed: false,
    hasOpenTabs: true,
  },
} satisfies Meta<MainLayoutProps & MainLayoutStoryArgs>;

export default meta;
type Story = StoryObj<MainLayoutProps & MainLayoutStoryArgs>;

/**
 * Playground with controls for all MainLayout features.
 */
export const Playground: Story = {
  decorators: [
    (Story, context) => {
      const storyArgs = context.args as MainLayoutStoryArgs;
      const sidebarCollapsed = storyArgs.sidebarCollapsed ?? false;
      const devToolsPosition = storyArgs.devToolsPosition ?? 'bottom';
      const devToolsCollapsed = storyArgs.devToolsCollapsed ?? false;
      const hasOpenTabs = storyArgs.hasOpenTabs ?? true;

      useEffect(() => {
        // Initialize template
        useCanvasStore.getState().registerTemplate(requestContextDescriptor);

        if (hasOpenTabs && useCanvasStore.getState().contextOrder.length === 0) {
          useCanvasStore.getState().openRequestTab({ label: 'GET /api/users' });
          useCanvasStore.getState().openRequestTab({ label: 'POST /api/login' });
          useCanvasStore.getState().openRequestTab({ label: 'PUT /api/orders/123' });
        }

        useSettingsStore.setState({
          sidebarVisible: !sidebarCollapsed,
        });

        if (devToolsPosition === 'hidden') {
          usePanelStore.setState({ isVisible: false });
        } else {
          usePanelStore.setState({
            isVisible: true,
            position: devToolsPosition,
            isCollapsed: devToolsCollapsed,
          });
        }
      }, [sidebarCollapsed, devToolsPosition, devToolsCollapsed, hasOpenTabs]);

      return (
        <div className="h-screen w-screen overflow-hidden bg-bg-app">
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Render main layout', async () => {
      await expect(canvas.getByTestId('main-layout')).toBeInTheDocument();
    });

    await step('Toggle sidebar with keyboard shortcut', async () => {
      const initialVisibility = useSettingsStore.getState().sidebarVisible;
      const usesMetaShortcut =
        useKeybindingStore.getState().getCommandForKey('b', ['meta']) === 'sidebar.toggle';

      window.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'b',
          metaKey: usesMetaShortcut,
          ctrlKey: !usesMetaShortcut,
          bubbles: true,
          cancelable: true,
        })
      );

      await waitFor(() => {
        void expect(useSettingsStore.getState().sidebarVisible).toBe(!initialVisibility);
      });
    });
  },
};
