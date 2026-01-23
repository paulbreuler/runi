/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeGenPanel Storybook stories
 * @description Visual documentation for CodeGenPanel component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeGenPanel } from './CodeGenPanel';
import type { NetworkHistoryEntry } from '@/types/history';

const meta: Meta<typeof CodeGenPanel> = {
  title: 'History/Tabs/CodeGenPanel',
  component: CodeGenPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Panel with language tabs for code generation from network history entries.',
      },
    },
    test: {
      skip: true, // Display-only component, no interactive elements to test
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CodeGenPanel>;

const createMockEntry = (overrides?: Partial<NetworkHistoryEntry>): NetworkHistoryEntry => ({
  id: '1',
  timestamp: '2024-01-01T00:00:00Z',
  request: {
    url: 'https://api.example.com/users',
    method: 'GET',
    headers: { Authorization: 'Bearer token123' },
    body: null,
    timeout_ms: 30000,
  },
  response: {
    status: 200,
    status_text: 'OK',
    headers: {},
    body: '{}',
    timing: {
      total_ms: 100,
      dns_ms: 10,
      connect_ms: 20,
      tls_ms: 30,
      first_byte_ms: 50,
    },
  },
  ...overrides,
});

/**
 * Code generation panel with GET request.
 */
export const GetRequest: Story = {
  args: {
    entry: createMockEntry(),
  },
};

/**
 * Code generation panel with POST request and JSON body.
 */
export const PostRequest: Story = {
  args: {
    entry: createMockEntry({
      request: {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        },
        body: '{"name":"John Doe","email":"john@example.com"}',
        timeout_ms: 30000,
      },
    }),
  },
};

/**
 * Code generation panel with custom language subset.
 */
export const CustomLanguages: Story = {
  args: {
    entry: createMockEntry(),
    languages: ['javascript', 'python'],
  },
};
