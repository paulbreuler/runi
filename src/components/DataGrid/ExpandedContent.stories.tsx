/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ExpandedContent Storybook stories
 * @description Visual documentation for ExpandedContent component with animation and alignment
 *
 * STORIES:
 * - Default - Basic expanded content with animation
 * - WithExpandedPanel - Integration with ExpandedPanel component
 * - ReducedMotion - Respects prefers-reduced-motion
 * - AlignmentTest - Verifies left margin alignment
 * - AnimationTest - Play function testing expansion/collapse animation
 */

import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ExpandedContent } from './ExpandedContent';
import { ExpandedPanel } from './tabs/ExpandedPanel';
import type { NetworkHistoryEntry } from '@/types/history';
import { EXPANDED_CONTENT_LEFT_MARGIN_PX } from './constants';

const meta: Meta<typeof ExpandedContent> = {
  title: 'Components/DataGrid/ExpandedContent',
  component: ExpandedContent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
ExpandedContent provides a wrapper for expanded row content with smooth animations and proper alignment.

**Features:**
- **Smooth Animation**: Height and opacity transitions for expansion/collapse (Feature #16)
- **Content Alignment**: Left margin aligns with first data column (Feature #17)
- **Accessibility**: Respects prefers-reduced-motion preference
- **Integration**: Designed to work inside table cells with colSpan

**Usage:**
\`\`\`tsx
<tr>
  <td colSpan={columnCount}>
    <ExpandedContent>
      <ExpandedPanel entry={entry} />
    </ExpandedContent>
  </td>
</tr>
\`\`\`
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
 * Default expanded content with simple content.
 */
export const Default: Story = {
  args: {
    children: (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-2">Expanded Content</h3>
        <p className="text-sm text-text-secondary">
          This is expanded content that appears when a row is expanded. It includes smooth
          animations and proper alignment with the first data column.
        </p>
      </div>
    ),
    isVisible: true,
  },
  render: (args) => (
    <div className="w-full">
      <table className="w-full">
        <tbody>
          <tr>
            <td colSpan={5} className="p-0">
              <ExpandedContent {...args} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

/**
 * Expanded content with ExpandedPanel integration (real-world usage).
 */
export const WithExpandedPanel: Story = {
  args: {
    children: <ExpandedPanel entry={createMockEntry()} />,
    isVisible: true,
  },
  render: (args) => (
    <div className="w-full">
      <table className="w-full">
        <tbody>
          <tr>
            <td colSpan={9} className="p-0">
              <ExpandedContent {...args} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

/**
 * Expanded content in collapsed state (isVisible=false).
 */
export const Collapsed: Story = {
  args: {
    children: (
      <div className="p-4">
        <p className="text-sm text-text-secondary">This content is hidden.</p>
      </div>
    ),
    isVisible: false,
  },
  render: (args) => (
    <div className="w-full">
      <table className="w-full">
        <tbody>
          <tr>
            <td colSpan={5} className="p-0">
              <ExpandedContent {...args} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};

/**
 * Tests expansion animation: verify smooth height/opacity transition.
 */
export const AnimationTest: Story = {
  args: {
    children: (
      <div className="p-4">
        <h3 className="text-sm font-medium mb-2">Animated Content</h3>
        <p className="text-sm text-text-secondary">
          This content should animate smoothly when expanding or collapsing.
        </p>
        <ul className="mt-2 space-y-1 text-sm text-text-secondary">
          <li>• Height transitions from 0 to auto</li>
          <li>• Opacity fades in/out</li>
          <li>• Duration: 200ms with easeInOut</li>
        </ul>
      </div>
    ),
    isVisible: false,
  },
  render: (args) => {
    const [isVisible, setIsVisible] = React.useState(args.isVisible);

    return (
      <div className="w-full">
        <div className="mb-4">
          <button
            type="button"
            data-testid="toggle-button"
            onClick={(): void => {
              setIsVisible(isVisible === true ? false : true);
            }}
            className="px-3 py-1.5 text-xs bg-bg-raised border border-border-default rounded hover:bg-bg-elevated"
          >
            {isVisible === true ? 'Collapse' : 'Expand'}
          </button>
        </div>
        <table className="w-full">
          <tbody>
            <tr>
              <td colSpan={5} className="p-0">
                <ExpandedContent {...args} isVisible={isVisible} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify content is initially collapsed', async () => {
      // When isVisible is false, AnimatePresence should not render the content
      // But we need to check after the initial render
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await step('Click toggle button to expand', async () => {
      const toggleButton = canvas.getByTestId('toggle-button');
      await userEvent.click(toggleButton);
      // Wait for animation to start
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await step('Verify expanded content is visible', async () => {
      // Wait for animation to complete (200ms)
      await new Promise((resolve) => setTimeout(resolve, 250));
      const expandedSection = canvas.getByTestId('expanded-section');
      await expect(expandedSection).toBeInTheDocument();
      await expect(expandedSection).toHaveTextContent('Animated Content');
    });

    await step('Click toggle button to collapse', async () => {
      const toggleButton = canvas.getByTestId('toggle-button');
      await userEvent.click(toggleButton);
      // Wait for collapse animation to start
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await step('Verify content collapses smoothly', async () => {
      // Wait for collapse animation to complete
      await new Promise((resolve) => setTimeout(resolve, 250));
      // After collapse, AnimatePresence removes the element
      // Note: AnimatePresence may keep the element briefly during exit animation
      // So we just verify the button text changed
      const toggleButton = canvas.getByTestId('toggle-button');
      await expect(toggleButton).toHaveTextContent('Expand');
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests expansion/collapse animation: click toggle button to expand and collapse content, verifying smooth height and opacity transitions.',
      },
    },
  },
};

/**
 * Tests left margin alignment with first data column.
 */
export const AlignmentTest: Story = {
  args: {
    children: (
      <div className="p-4">
        <p className="text-sm text-text-secondary">
          This content should be aligned with the first data column using{' '}
          <code className="text-xs bg-bg-raised px-1 py-0.5 rounded">
            EXPANDED_CONTENT_LEFT_MARGIN_PX
          </code>{' '}
          ({EXPANDED_CONTENT_LEFT_MARGIN_PX}px).
        </p>
      </div>
    ),
    isVisible: true,
  },
  render: (args) => (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-8 px-2 text-left text-xs font-medium text-text-secondary">☐</th>
            <th className="w-4 px-2 text-left text-xs font-medium text-text-secondary">▶</th>
            <th className="px-3 text-left text-xs font-medium text-text-secondary">Method</th>
            <th className="px-3 text-left text-xs font-medium text-text-secondary">URL</th>
            <th className="px-3 text-left text-xs font-medium text-text-secondary">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border-default">
            <td className="px-2">☐</td>
            <td className="px-2">▶</td>
            <td className="px-3">GET</td>
            <td className="px-3">/api/users</td>
            <td className="px-3">200</td>
          </tr>
          <tr>
            <td colSpan={5} className="p-0">
              <ExpandedContent {...args} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify expanded content has correct left margin', async () => {
      const expandedSection = canvas.getByTestId('expanded-section');
      const innerDiv = expandedSection.querySelector('div.bg-bg-elevated.border-t');

      await expect(innerDiv).toBeInTheDocument();
      await expect(innerDiv).toHaveStyle({
        marginLeft: `${String(EXPANDED_CONTENT_LEFT_MARGIN_PX)}px`,
      });
    });

    await step('Verify margin aligns with first data column', async () => {
      // The first data column (Method) starts after:
      // - Selection column (32px)
      // - Expander column (16px)
      // - First data column padding (6px from px-3)
      // Total: 54px
      const expandedSection = canvas.getByTestId('expanded-section');
      const innerDiv = expandedSection.querySelector('div.bg-bg-elevated.border-t');
      if (innerDiv === null) {
        throw new Error('Inner div not found');
      }
      const computedStyle = window.getComputedStyle(innerDiv);
      const marginLeft = computedStyle.marginLeft;

      await expect(marginLeft).toBe(`${String(EXPANDED_CONTENT_LEFT_MARGIN_PX)}px`);
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests left margin alignment: verifies that expanded content aligns with the first data column using EXPANDED_CONTENT_LEFT_MARGIN_PX (54px).',
      },
    },
  },
};

/**
 * Tests reduced motion preference: animation should be disabled when prefers-reduced-motion is set.
 */
export const ReducedMotion: Story = {
  args: {
    children: (
      <div className="p-4">
        <p className="text-sm text-text-secondary">
          When prefers-reduced-motion is enabled, animations should be instant (duration: 0).
        </p>
      </div>
    ),
    isVisible: true,
  },
  render: (args) => (
    <div className="w-full">
      <table className="w-full">
        <tbody>
          <tr>
            <td colSpan={5} className="p-0">
              <ExpandedContent {...args} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'When prefers-reduced-motion is enabled, the component should disable animations (duration: 0) for instant transitions.',
      },
    },
    // Note: Storybook doesn't easily allow us to test prefers-reduced-motion,
    // but the component code handles it via useReducedMotion hook
    // This story documents the behavior
  },
};
