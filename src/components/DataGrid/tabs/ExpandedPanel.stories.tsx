/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ExpandedPanel Storybook stories
 * @description Visual documentation for ExpandedPanel component with tab navigation
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ExpandedPanel } from './ExpandedPanel';
import type { NetworkHistoryEntry } from '@/types/history';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

const meta: Meta<typeof ExpandedPanel> = {
  title: 'Components/DataGrid/ExpandedPanel',
  component: ExpandedPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ExpandedPanel provides a tabbed interface for displaying detailed network history entry information.

**Features:**
- **Tab Navigation**: Switch between Timing, Response, Headers, TLS, and Code Gen tabs
- **Timing Tab (default)**: Shows timing waterfall visualization and intelligence signals
- **Response Tab**: Displays request and response bodies with formatting
- **Headers Tab**: Shows request and response headers
- **TLS Tab**: Displays TLS certificate details and connection information
- **Code Gen Tab**: Generates code snippets in multiple languages

**Accessibility:**
- Full keyboard navigation via Radix Tabs
- ARIA attributes handled automatically
- Focus management on tab activation
        `,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Creates a mock network history entry for stories.
 */
const createMockEntry = (overrides?: Partial<NetworkHistoryEntry>): NetworkHistoryEntry => ({
  id: 'hist_1',
  timestamp: new Date().toISOString(),
  request: {
    url: 'https://api.example.com/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer token123',
    },
    body: JSON.stringify(
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
    status: 200,
    status_text: 'OK',
    headers: {
      'Content-Type': 'application/json',
      'X-Rate-Limit': '100',
    },
    body: JSON.stringify(
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
  ...overrides,
});

/**
 * Default expanded panel showing all tabs with typical network entry.
 */
export const Default: Story = {
  args: {
    entry: createMockEntry(),
  },
};

/**
 * Expanded panel with verified request (intelligence signals).
 */
export const VerifiedRequest: Story = {
  args: {
    entry: createMockEntry({
      intelligence: {
        verified: true,
        drift: null,
        aiGenerated: false,
        boundToSpec: true,
        specOperation: 'createUser',
      },
    }),
  },
};

/**
 * Expanded panel with drift detected.
 */
export const DriftDetected: Story = {
  args: {
    entry: createMockEntry({
      intelligence: {
        verified: false,
        drift: {
          type: 'response',
          fields: ['body.email'],
          message: 'Expected string, got number',
        },
        aiGenerated: false,
        boundToSpec: true,
        specOperation: 'getUserById',
      },
    }),
  },
};

/**
 * Expanded panel with AI-generated request.
 */
export const AIGenerated: Story = {
  args: {
    entry: createMockEntry({
      intelligence: {
        verified: false,
        drift: null,
        aiGenerated: true,
        boundToSpec: false,
        specOperation: null,
      },
    }),
  },
};

/**
 * Expanded panel with GET request (no request body).
 */
export const GetRequest: Story = {
  args: {
    entry: createMockEntry({
      request: {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: {
          Authorization: 'Bearer token123',
        },
        body: null,
        timeout_ms: 30000,
      },
      response: {
        status: 200,
        status_text: 'OK',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            users: [
              { id: 1, name: 'John' },
              { id: 2, name: 'Jane' },
            ],
          },
          null,
          2
        ),
        timing: {
          total_ms: 156,
          dns_ms: 12,
          connect_ms: 23,
          tls_ms: 34,
          first_byte_ms: 50,
        },
      },
    }),
  },
};

/**
 * Expanded panel with error response (4xx).
 */
export const ErrorResponse: Story = {
  args: {
    entry: createMockEntry({
      response: {
        status: 404,
        status_text: 'Not Found',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Resource not found' }, null, 2),
        timing: {
          total_ms: 45,
          dns_ms: 5,
          connect_ms: 10,
          tls_ms: 15,
          first_byte_ms: 30,
        },
      },
    }),
  },
};

/**
 * Expanded panel with TLS certificate data.
 */
export const WithTLSCertificate: Story = {
  args: {
    entry: createMockEntry(),
    certificate: {
      subject: {
        commonName: 'example.com',
        organization: 'Example Inc',
        country: 'US',
      },
      issuer: {
        commonName: 'Example CA',
        organization: 'Example Certificate Authority',
      },
      validFrom: '2024-01-01T00:00:00Z',
      validTo: '2025-01-01T00:00:00Z',
      serialNumber: '1234567890',
      fingerprint: {
        sha256: 'A1:B2:C3:D4:E5:F6:...',
        sha1: 'AA:BB:CC:DD:EE:FF:...',
      },
      version: 3,
      signatureAlgorithm: 'SHA256withRSA',
      publicKeyAlgorithm: 'RSA',
      keySize: 2048,
    },
    protocolVersion: 'TLS 1.3',
  },
};

/**
 * Tests tab navigation: click tabs to switch content, verify keyboard navigation.
 */
export const TabNavigationTest: Story = {
  args: {
    entry: createMockEntry(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Timing tab is selected by default', async () => {
      const timingTab = canvas.getByRole('tab', { name: /timing/i });
      await expect(timingTab).toHaveAttribute('data-state', 'active');
    });

    await step('Click Response tab to switch content', async () => {
      const responseTab = canvas.getByRole('tab', { name: /response/i });
      await userEvent.click(responseTab);
      await expect(responseTab).toHaveAttribute('data-state', 'active');
    });

    await step('Click Headers tab to switch content', async () => {
      const headersTab = canvas.getByRole('tab', { name: /headers/i });
      await userEvent.click(headersTab);
      await expect(headersTab).toHaveAttribute('data-state', 'active');
    });

    await step('Tab to first tab and use keyboard navigation', async () => {
      const timingTab = canvas.getByRole('tab', { name: /timing/i });
      await tabToElement(timingTab, 20);
      await expect(timingTab).toHaveFocus();
    });

    await step('Use Arrow Right to move to next tab', async () => {
      await userEvent.keyboard('{ArrowRight}');
      // There might be multiple response tabs, get the first one that's focusable
      const responseTabs = canvas.getAllByRole('tab', { name: /response/i });
      const responseTab = responseTabs[0];
      if (responseTab !== undefined) {
        await waitForFocus(responseTab, 1000);
        await expect(responseTab).toHaveFocus();
      }
    });

    await step('Press Enter to activate tab', async () => {
      await userEvent.keyboard('{Enter}');
      // Wait for tab activation
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Get the focused response tab (should be the one we just activated)
      const responseTabs = canvas.getAllByRole('tab', { name: /response/i });
      const activeResponseTab = responseTabs.find(
        (tab) => tab.getAttribute('data-state') === 'active'
      );
      if (activeResponseTab !== undefined) {
        await expect(activeResponseTab).toHaveAttribute('data-state', 'active');
      } else {
        // Fallback: check first response tab
        await expect(responseTabs[0]).toHaveAttribute('data-state', 'active');
      }
    });

    await step('Use Arrow Left to move back to Timing tab', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      const timingTab = canvas.getByRole('tab', { name: /timing/i });
      await expect(timingTab).toHaveFocus();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests tab navigation: click to switch tabs, Arrow Left/Right to navigate between tabs, Enter to activate.',
      },
    },
  },
};

/**
 * Expanded panel with action buttons.
 * Feature #24: Expanded Panel - Action Buttons
 */
export const WithActionButtons: Story = {
  args: {
    entry: createMockEntry(),
    onReplay: (): void => {
      console.log('Replay clicked');
    },
    onCopy: (): void => {
      console.log('Copy cURL clicked');
    },
    onChain: (): void => {
      console.log('Chain Request clicked');
    },
    onGenerateTests: (): void => {
      console.log('Generate Tests clicked');
    },
    onAddToCollection: (): void => {
      console.log('Add to Collection clicked');
    },
    onBlockToggle: (id: string, isBlocked: boolean): void => {
      console.log(`Block toggle clicked: ${id}, blocked: ${String(isBlocked)}`);
    },
    isBlocked: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify all action buttons are present', async () => {
      await expect(canvas.getByRole('button', { name: /edit.*replay/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /copy.*curl/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /chain.*request/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /generate.*tests/i })).toBeInTheDocument();
      await expect(
        canvas.getByRole('button', { name: /add.*to.*collection/i })
      ).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /block/i })).toBeInTheDocument();
    });

    await step('Click Edit & Replay button', async () => {
      const replayButton = canvas.getByRole('button', { name: /edit.*replay/i });
      await userEvent.click(replayButton);
      // Button should still be present after click
      await expect(replayButton).toBeInTheDocument();
    });

    await step('Click Copy cURL button', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy.*curl/i });
      await userEvent.click(copyButton);
      await expect(copyButton).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Feature #24: Expanded Panel - Action Buttons. Displays all action buttons at the bottom of the expanded panel: Edit & Replay, Copy cURL, Chain Request, Generate Tests, Add to Collection, and Block/Unblock.',
      },
    },
  },
};

/**
 * Expanded panel with blocked entry (shows Unblock button).
 */
export const WithBlockedEntry: Story = {
  args: {
    entry: createMockEntry(),
    onBlockToggle: (id: string, isBlocked: boolean): void => {
      console.log(`Block toggle clicked: ${id}, blocked: ${String(isBlocked)}`);
    },
    isBlocked: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Unblock button is shown for blocked entry', async () => {
      await expect(canvas.getByRole('button', { name: /unblock/i })).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows Unblock button when entry is blocked.',
      },
    },
  },
};
