/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { RequestItemComposite } from './RequestItemComposite';
import type { CollectionRequest } from '@/types/collection';

const meta: Meta<typeof RequestItemComposite> = {
  title: 'Sidebar/RequestItemComposite',
  component: RequestItemComposite,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div
        className="w-80 bg-bg-app p-4 border border-border-subtle"
        data-scroll-container
        style={{ overflow: 'auto', maxHeight: '400px' }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RequestItemComposite>;

const baseRequest: CollectionRequest = {
  id: 'req_1',
  name: 'Get User Profile',
  seq: 1,
  method: 'GET',
  url: 'https://api.example.com/user/1',
  headers: {},
  params: [],
  is_streaming: false,
  tags: [],
  binding: {
    is_manual: true,
  },
  intelligence: {
    ai_generated: false,
    verified: true,
  },
};

export const Default: Story = {
  args: {
    request: baseRequest,
    collectionId: 'col_1',
  },
};

export const AiDraft: Story = {
  args: {
    request: {
      ...baseRequest,
      id: 'req_ai_1',
      name: 'List Recent Transactions (AI Suggestion)',
      method: 'POST',
      intelligence: {
        ai_generated: true,
        verified: false,
        generator_model: 'claude-3-5-sonnet',
      },
    },
    collectionId: 'col_1',
  },
};

export const AiVerified: Story = {
  args: {
    request: {
      ...baseRequest,
      id: 'req_ai_2',
      name: 'Update Preferences',
      method: 'PATCH',
      intelligence: {
        ai_generated: true,
        verified: true,
        generator_model: 'claude-3-5-sonnet',
      },
    },
    collectionId: 'col_1',
  },
};

export const BoundToSpec: Story = {
  args: {
    request: {
      ...baseRequest,
      id: 'req_bound',
      name: 'Authenticated Endpoint',
      method: 'GET',
      binding: {
        operation_id: 'getUser',
        path: '/user',
        is_manual: false,
      },
      intelligence: {
        ai_generated: false,
        verified: true,
      },
    },
    collectionId: 'col_1',
  },
};

export const Streaming: Story = {
  args: {
    request: {
      ...baseRequest,
      id: 'req_stream',
      name: 'Listen to Events',
      method: 'GET',
      is_streaming: true,
    },
    collectionId: 'col_1',
  },
};

export const Truncated: Story = {
  args: {
    request: {
      ...baseRequest,
      id: 'req_long',
      name: 'This is a very long request name that will definitely be truncated in the sidebar layout',
    },
    collectionId: 'col_1',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('request-select-req_long');

    await step('Hover to trigger popout after delay', async () => {
      await userEvent.hover(button);
      // Wait for 250ms hover delay + animation
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    });

    await step('Verify popout appears and expands beyond sidebar width', async () => {
      const popout = document.querySelector('[data-test-id="request-popout"]');
      await expect(popout).not.toBeNull();
      if (popout === null) {
        return;
      }

      // Popout content should not have w-full (constrains expansion)
      const content = popout.querySelector('[data-test-id="request-item-content"]');
      await expect(content).not.toBeNull();
      if (content !== null) {
        await expect(content.className).not.toContain('w-full');
      }

      // Popout should be wider than the sidebar container (w-80 = 320px)
      const popoutRect = popout.getBoundingClientRect();
      if (popoutRect.width > 0) {
        await expect(popoutRect.width).toBeGreaterThan(320);
      }
    });

    await step('Unhover to dismiss popout', async () => {
      await userEvent.unhover(button);
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });
  },
};

export const TruncatedWithStreamBadge: Story = {
  args: {
    request: {
      ...baseRequest,
      id: 'req_long_stream',
      name: 'This is a very long streaming request name that should expand and push the badge rightward',
      is_streaming: true,
    },
    collectionId: 'col_1',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('request-select-req_long_stream');

    await step('Hover to trigger popout', async () => {
      await userEvent.hover(button);
      await new Promise((resolve) => {
        setTimeout(resolve, 400);
      });
    });

    await step('Verify popout shows full name with badge after text', async () => {
      const popout = document.querySelector('[data-test-id="request-popout"]');
      await expect(popout).not.toBeNull();
      if (popout === null) {
        return;
      }
      // Full name should be visible (not truncated)
      await expect(popout.textContent).toContain('push the badge rightward');
      // Stream badge should also be present
      await expect(popout.textContent).toContain('Stream');
    });

    await step('Unhover to dismiss', async () => {
      await userEvent.unhover(button);
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });
  },
};
