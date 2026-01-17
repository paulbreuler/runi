import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useHistoryStore } from '@/stores/useHistoryStore';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';

const meta = {
  title: 'Components/Layout/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const HistoryStoreSeed = ({
  entries = [],
  isLoading = false,
  error = null,
  children,
}: {
  entries?: HistoryEntry[];
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}): React.JSX.Element => {
  useEffect(() => {
    useHistoryStore.setState({ entries, isLoading, error });
    return () => {
      // Cleanup: reset to default state
      useHistoryStore.setState({ entries: [], isLoading: false, error: null });
    };
  }, [entries, isLoading, error]);

  return <>{children}</>;
};

/**
 * Sidebar with empty history (default state).
 */
export const Default: Story = {
  render: () => (
    <div className="w-64 h-screen border border-border-default bg-bg-app">
      <HistoryStoreSeed>
        <Sidebar />
      </HistoryStoreSeed>
    </div>
  ),
};

/**
 * Sidebar with loading history state.
 */
export const LoadingHistory: Story = {
  render: () => (
    <div className="w-64 h-screen border border-border-default bg-bg-app">
      <HistoryStoreSeed isLoading={true}>
        <Sidebar />
      </HistoryStoreSeed>
    </div>
  ),
};

/**
 * Sidebar with error loading history.
 */
export const HistoryError: Story = {
  render: () => (
    <div className="w-64 h-screen border border-border-default bg-bg-app">
      <HistoryStoreSeed error="Failed to load history: Network error">
        <Sidebar />
      </HistoryStoreSeed>
    </div>
  ),
};

/**
 * Sidebar with history entries populated.
 */
export const WithHistory: Story = {
  render: () => {
    const mockEntries: HistoryEntry[] = [
      {
        id: 'hist_1',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        request: {
          url: 'https://api.example.com/users',
          method: 'GET',
          headers: {},
          body: null,
          timeout_ms: 30000,
        },
        response: {
          status: 200,
          status_text: 'OK',
          headers: {},
          body: '{"users": []}',
          timing: {
            total_ms: 150,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      },
      {
        id: 'hist_2',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        request: {
          url: 'https://api.example.com/users',
          method: 'POST',
          headers: {},
          body: '{"name": "John"}',
          timeout_ms: 30000,
        },
        response: {
          status: 201,
          status_text: 'Created',
          headers: {},
          body: '{"id": 1}',
          timing: {
            total_ms: 200,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      },
      {
        id: 'hist_3',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        request: {
          url: 'https://api.example.com/users/123',
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
          timing: {
            total_ms: 100,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      },
    ];

    return (
      <div className="w-64 h-screen border border-border-default bg-bg-app">
        <HistoryStoreSeed entries={mockEntries}>
          <Sidebar />
        </HistoryStoreSeed>
      </div>
    );
  },
};
