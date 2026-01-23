/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file History Tabs Storybook stories
 * @description Consolidated story using Storybook 10 controls for all tab types
 *
 * This story consolidates all History tab/panel stories:
 * - ResponseTab / ResponsePanel - Request and response body display
 * - HeadersTab / HeadersPanel - Request and response headers display
 * - TimingTab / TimingWaterfall - Request timing visualization
 * - CodeGenTab / CodeGenPanel - Code generation with language selection
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { ResponseTab } from './ResponseTab';
import { HeadersTab } from './HeadersTab';
import { TimingTab } from './TimingTab';
import { CodeGenTab } from './CodeGenTab';
import { CodeGenPanel } from './CodeGenPanel';
import { HeadersPanel } from './HeadersPanel';
import { TimingWaterfall } from './TimingWaterfall';
import { LanguageTabs } from './LanguageTabs';
import type { NetworkHistoryEntry } from '@/types/history';
import type { CodeLanguage } from '@/utils/codeGenerators';
import { waitForFocus, tabToElement } from '@/utils/storybook-test-helpers';

// ============================================================================
// Mock Data
// ============================================================================

function createMockEntry(overrides?: Partial<NetworkHistoryEntry>): NetworkHistoryEntry {
  return {
    id: 'hist_1',
    timestamp: new Date().toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
        'User-Agent': 'runi/1.0.0',
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
        'X-Rate-Limit-Remaining': '99',
        'X-Request-ID': 'abc-123-def-456',
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
        total_ms: 156,
        dns_ms: 12,
        connect_ms: 23,
        tls_ms: 34,
        first_byte_ms: 98,
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
}

// ============================================================================
// Storybook Meta
// ============================================================================

const meta = {
  title: 'History/Tabs',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Consolidated documentation for all History tab components in the expanded panel.

**Tab Types:**
- **ResponseTab** - Request and response body display with JSON formatting
- **HeadersTab** - Request and response headers display
- **TimingTab** - Request timing visualization with waterfall chart
- **CodeGenTab** - Code generation with multiple language options
- **LanguageTabs** - Tab navigation for switching between code generation languages

**Features:**
- Tab navigation with keyboard support
- Copy buttons for content
- JSON formatting with syntax highlighting
- Timing waterfall visualization
- Code generation in multiple languages (JavaScript, Python, Go, Ruby, cURL)

Use the Controls panel to explore different tab types and states.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    tabType: {
      control: 'select',
      options: ['response', 'headers', 'timing', 'codegen'],
      description: 'Tab type to display',
    },
  },
  args: {
    tabType: 'response',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Response Tab Stories
// ============================================================================

/**
 * Response tab with request and response bodies.
 */
export const ResponseTabDefault: Story = {
  render: () => <ResponseTab entry={createMockEntry()} />,
  parameters: {
    docs: {
      description: {
        story:
          'Response tab showing request and response bodies. Response Body tab is active by default. JSON is automatically formatted.',
      },
    },
  },
};

/**
 * Response tab with GET request (no request body).
 */
export const ResponseTabGetRequest: Story = {
  render: () => (
    <ResponseTab
      entry={createMockEntry({
        request: {
          url: 'https://api.example.com/users',
          method: 'GET',
          headers: { 'User-Agent': 'runi/1.0.0' },
          body: null,
          timeout_ms: 30000,
        },
        response: {
          status: 200,
          status_text: 'OK',
          headers: { 'Content-Type': 'application/json' },
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
            first_byte_ms: 98,
          },
        },
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Response tab with GET request (no request body). Only Response Body tab is shown.',
      },
    },
  },
};

/**
 * Response tab with large response body.
 */
export const ResponseTabLargeBody: Story = {
  render: () => (
    <ResponseTab
      entry={createMockEntry({
        response: {
          status: 200,
          status_text: 'OK',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            {
              data: Array.from({ length: 100 }, (_, i) => ({
                id: i + 1,
                name: `User ${String(i + 1)}`,
                email: `user${String(i + 1)}@example.com`,
              })),
            },
            null,
            2
          ),
          timing: {
            total_ms: 156,
            dns_ms: 12,
            connect_ms: 23,
            tls_ms: 34,
            first_byte_ms: 98,
          },
        },
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Response tab with large response body showing scrolling behavior.',
      },
    },
  },
};

/**
 * Tests Response tab interactions: tab switching, copy button, JSON formatting.
 */
export const ResponseTabInteractionTest: Story = {
  render: () => <ResponseTab entry={createMockEntry()} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Response Body tab is active by default', async () => {
      const responseTab = canvas.getByRole('tab', { name: /response body/i });
      await expect(responseTab).toHaveAttribute('aria-selected', 'true');
    });

    await step('Switch to Request Body tab', async () => {
      const requestTab = canvas.getByRole('tab', { name: /request body/i });
      await userEvent.click(requestTab);
      await expect(requestTab).toHaveAttribute('aria-selected', 'true');
    });

    await step('Verify copy button is present', async () => {
      const copyButton = canvas.getByRole('button', { name: /copy/i });
      await expect(copyButton).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests Response tab interactions: tab switching, copy button functionality, and JSON formatting.',
      },
    },
  },
};

// ============================================================================
// Headers Tab Stories
// ============================================================================

/**
 * Headers tab with request and response headers.
 */
export const HeadersTabDefault: Story = {
  render: () => <HeadersTab entry={createMockEntry()} />,
  parameters: {
    docs: {
      description: {
        story:
          'Headers tab showing request and response headers. Response Headers tab is active by default.',
      },
    },
  },
};

/**
 * Headers tab with many headers.
 */
export const HeadersTabManyHeaders: Story = {
  render: () => (
    <HeadersTab
      entry={createMockEntry({
        request: {
          url: 'https://api.example.com/users',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token123',
            'User-Agent': 'runi/1.0.0',
            'X-Request-ID': 'req-123',
            'X-Correlation-ID': 'corr-456',
            'X-Forwarded-For': '192.168.1.1',
            'X-Forwarded-Proto': 'https',
            Accept: 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          body: '{"name":"John"}',
          timeout_ms: 30000,
        },
        response: {
          status: 200,
          status_text: 'OK',
          headers: {
            'Content-Type': 'application/json',
            'X-Rate-Limit': '100',
            'X-Rate-Limit-Remaining': '99',
            'X-Rate-Limit-Reset': '1640995200',
            'X-Request-ID': 'abc-123-def-456',
            'X-Response-Time': '156ms',
            'X-Powered-By': 'Express',
            'Cache-Control': 'no-cache',
            ETag: 'W/"abc123"',
            'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
          },
          body: '{"id":1}',
          timing: {
            total_ms: 156,
            dns_ms: 12,
            connect_ms: 23,
            tls_ms: 34,
            first_byte_ms: 98,
          },
        },
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'Headers tab with many headers on both request and response.',
      },
    },
  },
};

/**
 * Headers panel with keyboard navigation test.
 */
export const HeadersPanelKeyboardNavigationTest: Story = {
  render: () => (
    <HeadersPanel
      requestHeaders={{
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
      }}
      responseHeaders={{
        'Content-Type': 'application/json',
        'X-Rate-Limit': '100',
      }}
    />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab focuses first secondary tab (Response Headers)', async () => {
      await userEvent.tab();
      const responseHeadersTab = canvas.getByTestId('response-headers-tab');
      await waitForFocus(responseHeadersTab, 1000);
      await expect(responseHeadersTab).toHaveFocus();
    });

    await step('ArrowRight moves to Request Headers tab', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await new Promise((resolve) => setTimeout(resolve, 100));
      const requestHeadersTab = canvas.getByTestId('request-headers-tab');
      await expect(requestHeadersTab).toHaveFocus();
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests keyboard navigation within HeadersPanel secondary tabs using Arrow keys.',
      },
    },
  },
};

// ============================================================================
// Timing Tab Stories
// ============================================================================

/**
 * Timing tab with complete waterfall visualization.
 */
export const TimingTabDefault: Story = {
  render: () => (
    <div className="bg-bg-app p-6 rounded-lg w-[600px]">
      <TimingTab
        segments={{
          dns: 15,
          connect: 25,
          tls: 45,
          wait: 120,
          download: 85,
        }}
        totalMs={290}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Timing tab showing complete waterfall with all segments: DNS, Connect, TLS, Wait (TTFB), and Download.',
      },
    },
  },
};

/**
 * Timing tab with fast response.
 */
export const TimingTabFastResponse: Story = {
  render: () => (
    <div className="bg-bg-app p-6 rounded-lg w-[600px]">
      <TimingTab
        segments={{
          dns: 2,
          connect: 5,
          tls: 8,
          wait: 15,
          download: 10,
        }}
        totalMs={40}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Timing tab with fast response showing minimal timing on each segment.',
      },
    },
  },
};

/**
 * Timing tab with slow response (>1000ms).
 */
export const TimingTabSlowResponse: Story = {
  render: () => (
    <div className="bg-bg-app p-6 rounded-lg w-[600px]">
      <TimingTab
        segments={{
          dns: 50,
          connect: 100,
          tls: 150,
          wait: 800,
          download: 400,
        }}
        totalMs={1500}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Timing tab with slow response (>1000ms) showing long wait time.',
      },
    },
  },
};

/**
 * Timing waterfall with legend.
 */
export const TimingWaterfallWithLegend: Story = {
  render: () => (
    <div className="w-96 bg-bg-surface p-4 rounded">
      <TimingWaterfall
        segments={{
          dns: 15,
          connect: 25,
          tls: 35,
          wait: 80,
          download: 45,
        }}
        totalMs={200}
        showLegend={true}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Timing waterfall component with legend showing all segment values.',
      },
    },
  },
};

// ============================================================================
// Code Generation Tab Stories
// ============================================================================

/**
 * Code generation tab with GET request.
 */
export const CodeGenTabDefault: Story = {
  render: () => <CodeGenTab entry={createMockEntry()} />,
  parameters: {
    docs: {
      description: {
        story: 'Code generation tab with GET request showing JavaScript code by default.',
      },
    },
  },
};

/**
 * Code generation tab with POST request and JSON body.
 */
export const CodeGenTabPostRequest: Story = {
  render: () => (
    <CodeGenTab
      entry={createMockEntry({
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
      })}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Code generation tab with POST request and JSON body showing code with body parameter.',
      },
    },
  },
};

/**
 * Code generation tab with custom language subset.
 */
export const CodeGenTabCustomLanguages: Story = {
  render: () => <CodeGenPanel entry={createMockEntry()} languages={['javascript', 'python']} />,
  parameters: {
    docs: {
      description: {
        story: 'Code generation panel with custom language subset (only JavaScript and Python).',
      },
    },
  },
};

// ============================================================================
// LanguageTabs Stories
// ============================================================================

/**
 * LanguageTabs - default with all available languages.
 */
export const LanguageTabsDefault: Story = {
  render: () => {
    const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('javascript');

    return (
      <LanguageTabs
        languages={['javascript', 'python', 'go', 'ruby', 'curl']}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />
    );
  },
};

/**
 * LanguageTabs - with subset of languages.
 */
export const LanguageTabsSubset: Story = {
  render: () => {
    const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('python');

    return (
      <LanguageTabs
        languages={['javascript', 'python']}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />
    );
  },
};

/**
 * LanguageTabs - tab interactions test.
 */
export const LanguageTabsTabInteractionsTest: Story = {
  render: () => {
    const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('javascript');

    return (
      <LanguageTabs
        languages={['javascript', 'python', 'go', 'ruby', 'curl']}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click Python tab', async () => {
      const pythonTab = canvas.getByRole('tab', { name: /python/i });
      await userEvent.click(pythonTab);
      await expect(pythonTab).toHaveAttribute('aria-selected', 'true');
    });

    await step('Click Go tab', async () => {
      const goTab = canvas.getByRole('tab', { name: /^go$/i });
      await userEvent.click(goTab);
      await expect(goTab).toHaveAttribute('aria-selected', 'true');
    });
  },
};

/**
 * LanguageTabs - keyboard navigation test.
 */
export const LanguageTabsKeyboardNavigationTest: Story = {
  render: () => {
    const [activeLanguage, setActiveLanguage] = useState<CodeLanguage>('javascript');

    return (
      <LanguageTabs
        languages={['javascript', 'python', 'go']}
        activeLanguage={activeLanguage}
        onLanguageChange={setActiveLanguage}
      />
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to Python tab', async () => {
      const pythonTab = canvas.getByRole('tab', { name: /python/i });
      const focused = await tabToElement(pythonTab, 10);
      await expect(focused).toBe(true);
      await expect(pythonTab).toHaveFocus();
    });
  },
};
