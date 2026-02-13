/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
import { ContextBar } from './ContextBar';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useFeatureFlagStore } from '@/stores/features/useFeatureFlagStore';
import { requestContextDescriptor } from '@/contexts/RequestContext';
import { FileText } from 'lucide-react';
import type { CanvasContextDescriptor } from '@/types/canvas';

const meta = {
  title: 'Layout/ContextBar',
  component: ContextBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Context bar with tab navigation and layout picker. Displays active context tabs and allows switching between different canvas contexts.',
      },
    },
  },
  decorators: [
    (Story) => {
      // Register mock context
      useCanvasStore.getState().registerContext(requestContextDescriptor);
      useCanvasStore.getState().setActiveContext('request');

      // Enable popout feature flag for testing
      useFeatureFlagStore.getState().setFlag('canvas', 'popout', true);

      return (
        <div className="h-screen flex flex-col bg-bg-app">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof ContextBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with Request context active.
 * Shows context tab with active indicator, layout picker, and popout button.
 */
export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify context tab renders', async () => {
      const tab = canvas.getByTestId('context-tab-request');
      await expect(tab).toBeInTheDocument();
      await expect(tab).toHaveTextContent('Request');
    });

    await step('Verify active indicator', async () => {
      const indicator = canvas.getByTestId('active-indicator');
      await expect(indicator).toBeInTheDocument();
    });

    await step('Verify layout picker', async () => {
      const picker = canvas.getByTestId('layout-picker-trigger');
      await expect(picker).toBeInTheDocument();
    });

    await step('Verify popout button', async () => {
      const button = canvas.getByTestId('popout-button');
      await expect(button).toBeInTheDocument();
    });
  },
};

/**
 * Multiple contexts registered.
 * Tests context switching between Request and Blueprint views.
 */
export const MultipleContexts: Story = {
  decorators: [
    (Story) => {
      // Register multiple contexts
      const { registerContext, setActiveContext } = useCanvasStore.getState();
      registerContext(requestContextDescriptor);
      registerContext({
        id: 'blueprint',
        label: 'Blueprint',
        icon: FileText,
        panels: {},
        layouts: [],
      } satisfies CanvasContextDescriptor);
      setActiveContext('request');

      return (
        <div className="h-screen flex flex-col bg-bg-app">
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Switch contexts', async () => {
      const blueprintTab = canvas.getByTestId('context-tab-blueprint');
      await userEvent.click(blueprintTab);

      // Verify switch
      await expect(useCanvasStore.getState().activeContextId).toBe('blueprint');
    });
  },
};
