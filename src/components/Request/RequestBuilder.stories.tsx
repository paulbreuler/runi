/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useEffect } from 'react';
import { waitForFocus } from '@/utils/storybook-test-helpers';
import { RequestBuilder } from './RequestBuilder';
import { useRequestStoreRaw } from '@/stores/useRequestStore';

const meta: Meta<typeof RequestBuilder> = {
  title: 'Request/RequestBuilder',
  component: RequestBuilder,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Request builder with tabbed editors (Headers, Body, Params, Auth).

- **Keyboard**: Arrow Left/Right to move focus and activate tabs.
- **Focus**: Roving tabindex, consistent focus ring.
- **Overflow cues**: Uses scrollable tab list with gradient cues.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RequestBuilder>;

const StoreSeed = ({
  url = 'https://api.example.com/users',
  headers = { 'Content-Type': 'application/json' },
  body = `{
  "name": "John Doe"
}`,
}: {
  url?: string;
  headers?: Record<string, string>;
  body?: string;
}): React.JSX.Element => {
  useEffect(() => {
    useRequestStoreRaw.getState().initContext('global', { url, headers, body });
    return () => {
      useRequestStoreRaw.getState().reset('global');
    };
  }, [url, headers, body]);

  return <RequestBuilder />;
};

/**
 * Playground with interaction test.
 */
export const Playground: Story = {
  tags: ['test'],
  render: () => (
    <div className="h-screen border border-border-default bg-bg-app">
      <StoreSeed />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const getByTestId = (testId: string): HTMLElement => {
      const el = canvasElement.querySelector(`[data-test-id="${testId}"]`);
      if (!(el instanceof HTMLElement)) {
        throw new Error(`Missing element [data-test-id="${testId}"]`);
      }
      return el;
    };
    const headersTab = getByTestId('request-tab-headers');
    const bodyTab = getByTestId('request-tab-body');

    await step('Focus Headers tab', async () => {
      headersTab.focus();
      await waitForFocus(headersTab, 1000);
      await expect(headersTab).toHaveFocus();
    });

    await step('Arrow Right → focus Body and show editor', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await expect(bodyTab).toHaveFocus();
      await expect(getByTestId('code-editor')).toBeInTheDocument();
    });

    await step('Body panel fills available height', async () => {
      const panel = getByTestId('request-tab-panel-body');
      const cmContainer = getByTestId('code-editor-cm-container');
      const panelHeight = Math.round(panel.getBoundingClientRect().height);
      const cmHeight = Math.round(cmContainer.getBoundingClientRect().height);
      await expect(cmHeight).toBeGreaterThanOrEqual(panelHeight - 40);
    });

    await step('Body editor supports horizontal scroll', async () => {
      const cmContainer = getByTestId('code-editor-cm-container');
      const cmScroller = cmContainer.querySelector('.cm-scroller');
      await expect(cmScroller).not.toBeNull();
      if (cmScroller === null) {
        return;
      }
      const longLine = `{"token":"${'a'.repeat(240)}"}`;
      useRequestStoreRaw.getState().setBody('global', longLine);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const scrollWidth = cmScroller.scrollWidth;
      const clientWidth = cmScroller.clientWidth;
      await expect(scrollWidth).toBeGreaterThan(clientWidth);
    });
  },
};

/**
 * Empty state (no headers).
 */
export const EmptyHeaders: Story = {
  tags: ['test'],
  render: () => (
    <div className="h-screen border border-border-default bg-bg-app">
      <StoreSeed headers={{}} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Shows empty headers state', async () => {
      await expect(canvas.getByTestId('header-empty-row')).toBeInTheDocument();
    });
  },
};
