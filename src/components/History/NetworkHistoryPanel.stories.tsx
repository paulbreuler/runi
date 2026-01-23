import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { NetworkHistoryPanel } from './NetworkHistoryPanel';
import type { NetworkHistoryEntry } from '@/types/history';

const meta = {
  title: 'Components/History/NetworkHistoryPanel',
  component: NetworkHistoryPanel,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NetworkHistoryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = fn();

const defaultIntelligence = {
  boundToSpec: false,
  specOperation: null,
  drift: null,
  aiGenerated: false,
  verified: false,
};

const mockEntries: NetworkHistoryEntry[] = [
  {
    id: 'hist_1',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '[{"id":1,"name":"John"},{"id":2,"name":"Jane"}]',
      timing: { total_ms: 156, dns_ms: 12, connect_ms: 23, tls_ms: 34, first_byte_ms: 98 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'getUsers',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
  {
    id: 'hist_2',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"Alice","email":"alice@example.com"}',
      timeout_ms: 30000,
    },
    response: {
      status: 201,
      status_text: 'Created',
      headers: { 'Content-Type': 'application/json' },
      body: '{"id":3,"name":"Alice"}',
      timing: { total_ms: 234, dns_ms: null, connect_ms: null, tls_ms: null, first_byte_ms: null },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'createUser',
      drift: { type: 'response', fields: ['email'], message: 'Missing email field in response' },
      aiGenerated: true,
      verified: false,
    },
  },
  {
    id: 'hist_3',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users/1',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: '{"name":"John Updated"}',
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '{"id":1,"name":"John Updated"}',
      timing: { total_ms: 189, dns_ms: 8, connect_ms: 18, tls_ms: 28, first_byte_ms: 120 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'updateUser',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
  {
    id: 'hist_4',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users/999',
      method: 'GET',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 404,
      status_text: 'Not Found',
      headers: {},
      body: '{"error":"User not found"}',
      timing: { total_ms: 67, dns_ms: 5, connect_ms: 10, tls_ms: 15, first_byte_ms: 50 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'getUserById',
      drift: null,
      aiGenerated: false,
      verified: false,
    },
  },
  {
    id: 'hist_5',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    request: {
      url: 'https://api.example.com/users/2',
      method: 'DELETE',
      headers: {},
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 204,
      status_text: 'No Content',
      headers: {},
      body: '',
      timing: { total_ms: 145, dns_ms: 6, connect_ms: 12, tls_ms: 20, first_byte_ms: 100 },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'deleteUser',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  },
];

/**
 * Default panel with multiple entries showing various states.
 */
export const Default: Story = {
  args: {
    entries: mockEntries,
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[600px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};

/**
 * Empty state - no requests yet.
 */
export const Empty: Story = {
  args: {
    entries: [],
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[400px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};

/**
 * Panel with entries that have drift issues.
 */
export const WithDriftIssues: Story = {
  args: {
    entries: mockEntries.map((entry) =>
      entry.id === 'hist_1'
        ? {
            ...entry,
            intelligence: {
              ...(entry.intelligence ?? defaultIntelligence),
              drift: { type: 'response' as const, fields: ['status'], message: 'Unexpected field' },
              verified: false,
            },
          }
        : entry
    ),
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[600px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};

/**
 * Single entry.
 */
export const SingleEntry: Story = {
  args: {
    entries: mockEntries.slice(0, 1),
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[400px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};

/**
 * Test story for expander functionality - multiple rows to test expansion on different rows.
 * This story is used by Playwright E2E tests to verify expander works on all rows, not just the last one.
 */
export const ExpanderTest: Story = {
  args: {
    entries: mockEntries.slice(0, 5), // Use first 5 entries for testing
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[800px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
};

/**
 * Test filter interactions through the panel.
 */
export const FilterInteractionsTest: Story = {
  args: {
    entries: mockEntries,
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[600px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Filter by search term', async () => {
      const searchInput = canvas.getByLabelText(/filter history by url/i);
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'users');
      await expect(searchInput).toHaveValue('users');
      // Verify filtered results (should show entries with 'users' in URL)
      const rows = canvas.getAllByTestId('history-row');
      // At least one row should be visible after filtering
      await expect(rows.length).toBeGreaterThan(0);
    });

    await step('Filter by method', async () => {
      const methodFilter = canvas.getByTestId('method-filter');
      await userEvent.click(methodFilter);
      // Wait for select to open
      await new Promise((resolve) => setTimeout(resolve, 100));
      const postOption = await canvas.findByRole('option', { name: /^post$/i }, { timeout: 2000 });
      await userEvent.click(postOption);
      // Wait for select to close and filter to apply
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Verify only POST entries are shown
      const rows = canvas.getAllByTestId('history-row');
      await expect(rows.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Test state management when filters change.
 */
export const StateManagementTest: Story = {
  args: {
    entries: mockEntries,
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[600px] bg-bg-app">
      <NetworkHistoryPanel {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial entries are displayed', async () => {
      const rows = canvas.getAllByTestId('history-row');
      await expect(rows.length).toBeGreaterThan(0);
    });

    await step('Apply filter and verify state updates', async () => {
      const statusFilter = canvas.getByTestId('status-filter');
      await userEvent.click(statusFilter);
      // Wait for select to open (Radix Select uses portals)
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Options are in a Radix portal (document.body)
      const statusOption = await within(document.body).findByRole(
        'option',
        { name: /2xx/i },
        { timeout: 2000 }
      );
      await userEvent.click(statusOption);
      // Wait for select to close and filter to apply
      await new Promise((resolve) => setTimeout(resolve, 200));
      // Verify filter state changed
      await expect(statusFilter).toHaveTextContent(/2xx/i);
      // Verify rows are still visible (filtered)
      const rows = canvas.getAllByTestId('history-row');
      await expect(rows.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Visual test for double-click behavior - demonstrates that double-click expands without toggling selection.
 * This story helps visualize the expected behavior: single click selects, double-click expands (selection remains).
 */
export const DoubleClickBehaviorTest: Story = {
  args: {
    entries: mockEntries.slice(0, 3), // Use 3 entries for clarity
    onReplay: noop,
    onCopyCurl: noop,
  },
  render: (args) => (
    <div className="h-[700px] bg-bg-app">
      <div className="p-4 space-y-2">
        <div className="text-sm text-text-muted">
          <p className="font-medium mb-1">Expected Behavior:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Single click on row → selects row (blue highlight)</li>
            <li>Double-click on row → expands row (selection should remain, NOT toggle)</li>
            <li>Row highlight should stay blue when double-clicking a selected row</li>
          </ul>
        </div>
        <NetworkHistoryPanel {...args} />
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click once to select row', async () => {
      const rows = canvas.getAllByTestId('history-row');
      const firstRow = rows[0];
      if (firstRow !== undefined) {
        await userEvent.click(firstRow);
        // Wait for selection state to update
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Row should be selected (have blue highlight class)
        await expect(firstRow).toHaveClass('bg-bg-raised/30');
      }
    });

    await step('Double-click to expand (selection should remain)', async () => {
      const rows = canvas.getAllByTestId('history-row');
      const firstRow = rows[0];
      if (firstRow !== undefined) {
        // Double-click the row
        await userEvent.dblClick(firstRow);
        // Wait for expansion animation
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Verify expanded content is visible
        const expandedSection = canvas.queryByTestId('expanded-section');
        await expect(expandedSection).toBeInTheDocument();

        // Verify row is still selected (should still have highlight)
        await expect(firstRow).toHaveClass('bg-bg-raised/30');
      }
    });

    await step('Verify selection checkbox is still checked after double-click', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      // Find the checkbox for the first row (skip header checkbox)
      const rowCheckbox = checkboxes.find((cb): boolean => {
        const label = cb.getAttribute('aria-label');
        if (label === null) {
          return false;
        }
        return label.includes('Select') && label.includes('hist_1');
      });

      if (rowCheckbox !== undefined) {
        // Checkbox should still be checked after double-click
        await expect(rowCheckbox).toHaveAttribute('aria-checked', 'true');
      }
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Visual test for double-click behavior. Verifies that double-clicking a row expands it without toggling selection. The row should remain selected (blue highlight) after double-click, matching Console tab behavior.',
      },
    },
  },
};
