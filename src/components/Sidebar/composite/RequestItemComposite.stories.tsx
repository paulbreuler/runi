/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { RequestItemComposite } from './RequestItemComposite';
import type { CollectionRequest } from '@/types/collection';
import type { RequestTabState } from '@/types/canvas';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { requestContextDescriptor } from '@/contexts/RequestContext/descriptor';
import { useContextSync } from '@/hooks/useContextSync';

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

const syncTestRequests: CollectionRequest[] = Array.from({ length: 11 }, (_, index) => {
  const seq = index + 1;
  return {
    ...baseRequest,
    id: `req_first_${String(seq).padStart(2, '0')}`,
    seq,
    method: seq % 2 === 0 ? 'POST' : 'GET',
    name: seq <= 10 ? 'Returns anything passed in request data.' : `Request ${String(seq)}`,
    url: `https://httpbin.org/anything/${String(seq)}`,
  };
});

const CanvasSyncHarness = (): React.JSX.Element => {
  useContextSync();

  return (
    <div className="flex flex-col gap-1" data-test-id="request-sync-harness">
      {syncTestRequests.map((request) => (
        <RequestItemComposite key={request.id} request={request} collectionId="col_1" />
      ))}
    </div>
  );
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

    await step('Render truncated request row', async () => {
      await expect(button).toBeInTheDocument();
      await expect(button).toHaveTextContent('GET');
    });

    await step('Verify request name is truncated', async () => {
      // Verify button shows truncated name (Tooltip provides full name on hover)
      const nameElement = button.querySelector('[data-test-id="request-name"]');
      await expect(nameElement).toBeInTheDocument();
      await expect(nameElement).toHaveClass('truncate');
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

    await step('Render row and keep stream badge visible', async () => {
      await expect(button).toBeInTheDocument();
      await expect(button).toHaveTextContent('Stream');
    });

    await step('Verify request name is truncated', async () => {
      // Verify button shows truncated name (Tooltip provides full name on hover)
      const nameElement = button.querySelector('[data-test-id="request-name"]');
      await expect(nameElement).toBeInTheDocument();
      await expect(nameElement).toHaveClass('truncate');
    });
  },
};

export const CollectionSelectionOpensCanvasContexts: Story = {
  render: (): React.JSX.Element => <CanvasSyncHarness />,
  decorators: [
    (Story): React.JSX.Element => {
      useEffect(() => {
        const canvasStore = useCanvasStore.getState();
        canvasStore.reset();
        canvasStore.registerContext(requestContextDescriptor);
        canvasStore.setActiveContext('request');

        useCollectionStore.setState((state) => ({
          ...state,
          selectedCollectionId: null,
          selectedRequestId: null,
        }));
      }, []);

      return (
        <div
          className="w-80 bg-bg-app p-4 border border-border-subtle"
          data-scroll-container
          style={{ overflow: 'auto', maxHeight: '400px' }}
        >
          <Story />
        </div>
      );
    },
  ],
  play: async ({ canvasElement, step }): Promise<void> => {
    const canvas = within(canvasElement);
    const initialRequestTabCount = useCanvasStore
      .getState()
      .contextOrder.filter((id) => id.startsWith('request-')).length;

    await step('Select first request item and verify a request context opens', async () => {
      await userEvent.click(canvas.getByTestId('request-select-req_first_01'));

      await waitFor(() => {
        const store = useCanvasStore.getState();
        const requestTabCount = store.contextOrder.filter((id) => id.startsWith('request-')).length;
        void expect(requestTabCount).toBe(initialRequestTabCount + 1);

        const activeContextId = store.activeContextId;
        void expect(activeContextId).toMatch(/^request-/);
        if (activeContextId === null) {
          return;
        }

        const activeState = store.getContextState(activeContextId) as Partial<RequestTabState>;
        void expect(activeState.source).toMatchObject({
          type: 'collection',
          collectionId: 'col_1',
          requestId: 'req_first_01',
        });
      });
    });

    await step(
      'Select eleventh request item and verify it opens through the same path',
      async () => {
        await userEvent.click(canvas.getByTestId('request-select-req_first_11'));

        await waitFor(() => {
          const store = useCanvasStore.getState();
          const requestTabCount = store.contextOrder.filter((id) =>
            id.startsWith('request-')
          ).length;
          void expect(requestTabCount).toBe(initialRequestTabCount + 2);

          const activeContextId = store.activeContextId;
          void expect(activeContextId).toMatch(/^request-/);
          if (activeContextId === null) {
            return;
          }

          const activeState = store.getContextState(activeContextId) as Partial<RequestTabState>;
          void expect(activeState.source).toMatchObject({
            type: 'collection',
            collectionId: 'col_1',
            requestId: 'req_first_11',
          });
        });
      }
    );
  },
};
