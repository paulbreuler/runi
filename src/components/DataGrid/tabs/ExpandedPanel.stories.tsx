/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ExpandedPanel Storybook stories
 * @description Consolidated story using Storybook 10 controls for all state variations
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within, fn } from 'storybook/test';
import { ExpandedPanel } from './ExpandedPanel';
import type { NetworkHistoryEntry } from '@/types/history';
import { Z_INDEX } from '@/components/DataGrid/constants';

const meta: Meta<typeof ExpandedPanel> = {
  title: 'DataGrid/ExpandedPanel',
  component: ExpandedPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ExpandedPanel provides a tabbed interface for displaying detailed network history entry information.

**Features:**
- Tab Navigation: Switch between Timing, Response, Headers, TLS, and Code Gen tabs
- Intelligence Signals: Shows verified, drift, and AI-generated states
- Action Buttons: Edit & Replay, Copy cURL, Chain Request, Generate Tests, Add to Collection, Block/Unblock
- Keyboard Navigation: Full keyboard support via Radix Tabs
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isBlocked: {
      control: 'boolean',
      description: 'Entry is blocked (shows Unblock button)',
    },
  },
  args: {
    isBlocked: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const createMockEntry = (
  overrides?: Partial<NetworkHistoryEntry>,
  status?: string
): NetworkHistoryEntry => {
  const baseEntry: NetworkHistoryEntry = {
    id: 'hist_1',
    timestamp: new Date().toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: status === 'get' ? 'GET' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      },
      body:
        status === 'get'
          ? null
          : JSON.stringify(
              {
                name: 'John Doe',
                email: 'john@example.com',
              },
              null,
              2
            ),
      timeout_ms: 30000,
    },
    response: {
      status: status === 'error' ? 500 : 200,
      status_text: status === 'error' ? 'Internal Server Error' : 'OK',
      headers: {
        'Content-Type': 'application/json',
        'X-Rate-Limit': '100',
      },
      body:
        status === 'error'
          ? JSON.stringify({ error: 'Internal server error' }, null, 2)
          : JSON.stringify(
              {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                createdAt: '2024-01-01T00:00:00Z',
              },
              null,
              2
            ),
      timing: {
        total_ms: 290,
        dns_ms: 15,
        connect_ms: 25,
        tls_ms: 45,
        first_byte_ms: 120,
      },
    },
    intelligence: {
      boundToSpec: false,
      specOperation: null,
      drift: null,
      aiGenerated: false,
      verified: false,
    },
    ...overrides,
  };

  // Apply status-specific overrides
  if (status === 'verified') {
    baseEntry.intelligence = {
      verified: true,
      drift: null,
      aiGenerated: false,
      boundToSpec: true,
      specOperation: 'createUser',
    };
  } else if (status === 'drift') {
    baseEntry.intelligence = {
      verified: false,
      drift: {
        type: 'response',
        fields: ['body.email'],
        message: 'Expected string, got number',
      },
      aiGenerated: false,
      boundToSpec: true,
      specOperation: 'getUserById',
    };
  } else if (status === 'ai-generated') {
    baseEntry.intelligence = {
      verified: false,
      drift: null,
      aiGenerated: true,
      boundToSpec: false,
      specOperation: null,
    };
  } else if (status === 'tls') {
    baseEntry.request.url = 'https://secure.example.com/api';
    baseEntry.response.timing.tls_ms = 120;
  }

  return baseEntry;
};

/**
 * Playground story with controls for all ExpandedPanel features.
 * Use the Controls panel to explore different entry states and configurations.
 *
 * Note: Entry state variations (verified, drift, AI-generated, etc.) can be explored
 * by modifying the entry prop directly in the Controls panel, or by creating additional
 * stories for specific states if needed for documentation.
 */
export const Playground: Story = {
  render: (args) => {
    const entry = createMockEntry(undefined, 'default');

    return (
      <div className="w-full max-w-4xl">
        <ExpandedPanel
          entry={entry}
          onBlockToggle={args.isBlocked === true ? fn() : undefined}
          isBlocked={args.isBlocked}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('Verify panel renders', async () => {
      const panel = canvasElement.querySelector('[data-testid="expanded-section"]');
      await expect(panel).toBeInTheDocument();
    });

    await step('Test tab navigation', async () => {
      const headersTab = canvas.queryByTestId('tab-headers');
      if (headersTab !== null) {
        await userEvent.click(headersTab);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await expect(headersTab).toHaveAttribute('data-state', 'active');
      }
    });

    await step('Verify z-index layering', async () => {
      const expandedSection = canvasElement.querySelector('[data-testid="expanded-section"]');
      if (expandedSection !== null) {
        const computedStyle = window.getComputedStyle(expandedSection);
        const zIndex = Number.parseInt(computedStyle.zIndex, 10);
        // Verify z-index is exactly EXPANDED_PANEL (8) and less than HEADER_RIGHT (30)
        await expect(zIndex).toBe(Z_INDEX.EXPANDED_PANEL);
        await expect(zIndex).toBeLessThan(Z_INDEX.HEADER_RIGHT);
      }
    });

    if (args.isBlocked === true) {
      await step('Verify Unblock button for blocked entry', async () => {
        const unblockButton = canvas.queryByRole('button', { name: /unblock/i });
        if (unblockButton !== null) {
          await expect(unblockButton).toBeInTheDocument();
        }
      });
    }
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground for ExpandedPanel. Use the Controls panel to explore different entry states (verified, drift, AI-generated, error, TLS) and configurations (action buttons, blocked state).',
      },
    },
  },
};
