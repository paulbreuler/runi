/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
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
      <div className="w-80 bg-bg-app p-4 border border-border-subtle">
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
};
