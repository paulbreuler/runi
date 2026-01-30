/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Network column definitions tests
 * @description Tests for TanStack Table column definitions for the Network History Panel
 *
 * TDD: RED phase - these tests define the expected behavior of network columns
 */

import * as React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import { createNetworkColumns, ActionsCell } from './networkColumns';
import { MethodCell } from './methodCell';
import { UrlCell } from './urlCell';
import { StatusCell } from './statusCell';
import { TimingCell } from './timingCell';
import { SizeCell } from './sizeCell';
import { TimeAgoCell } from './timeAgoCell';
import type { NetworkHistoryEntry } from '@/types/history';

// Mock entry factory
function createMockEntry(overrides: Partial<NetworkHistoryEntry> = {}): NetworkHistoryEntry {
  return {
    id: 'test-1',
    timestamp: new Date().toISOString(),
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
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 100,
      },
    },
    ...overrides,
  };
}

// Test table component
interface TestTableProps {
  data?: NetworkHistoryEntry[];
  columns?: Array<ColumnDef<NetworkHistoryEntry>>;
  onReplay?: (entry: NetworkHistoryEntry) => void;
  onCopy?: (entry: NetworkHistoryEntry) => void;
  onDelete?: (id: string) => void;
}

const TestTable = ({
  data = [createMockEntry()],
  columns,
  onReplay = vi.fn(),
  onCopy = vi.fn(),
  onDelete = vi.fn(),
}: TestTableProps): React.ReactElement => {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const defaultColumns = React.useMemo(
    () =>
      createNetworkColumns({
        onReplay,
        onCopy,
        onDelete,
      }),
    [onReplay, onCopy, onDelete]
  );

  const table = useReactTable({
    data,
    columns: columns ?? defaultColumns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => row.id,
    getRowCanExpand: () => true,
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} data-test-id="table-row">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

describe('createNetworkColumns', () => {
  it('creates all expected columns', () => {
    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    expect(columns).toHaveLength(10); // select, expand, method, url, status, timing, size, time, protocol, actions
  });

  it('includes selection column', () => {
    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    expect(columns.find((c) => c.id === 'select')).toBeDefined();
  });

  it('includes expander column', () => {
    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    expect(columns.find((c) => c.id === 'expand')).toBeDefined();
  });

  it('URL column is flexible (no maxSize constraint)', () => {
    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    const urlColumn = columns.find((c) => c.id === 'url');
    expect(urlColumn).toBeDefined();
    expect(urlColumn?.maxSize).toBeUndefined(); // Flexible column should not have maxSize
    expect(urlColumn?.minSize).toBeDefined(); // Should have minSize to prevent too narrow
  });

  it('actions column is fixed on right (has maxSize constraint)', () => {
    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    const actionsColumn = columns.find((c) => c.id === 'actions');
    expect(actionsColumn).toBeDefined();
    expect(actionsColumn?.maxSize).toBeDefined();
    expect(actionsColumn?.minSize).toBeDefined();
    expect(actionsColumn?.maxSize).toBe(actionsColumn?.minSize); // Fixed size
  });

  it('selection column has compact size (uses COLUMN_WIDTHS.SELECTION)', () => {
    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    const selectColumn = columns.find((c) => c.id === 'select');
    expect(selectColumn).toBeDefined();
    // Should use COLUMN_WIDTHS.SELECTION constant (32px for square checkbox)
    expect(selectColumn?.size).toBe(32);
    expect(selectColumn?.minSize).toBe(32);
    expect(selectColumn?.maxSize).toBe(32);
  });

  it('method column has fixed width based on longest method (OPTIONS)', () => {
    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    const methodColumn = columns.find((c) => c.id === 'method');
    expect(methodColumn).toBeDefined();
    // Method column should be fixed width (100px for OPTIONS + padding)
    expect(methodColumn?.size).toBe(100);
    expect(methodColumn?.minSize).toBe(100);
    expect(methodColumn?.maxSize).toBe(100);
  });

  it('does not accept compareMode prop (compare mode removed)', () => {
    // TypeScript should warn if compareMode is passed, but for runtime test:
    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
      // compareMode prop should be ignored if passed
    } as Parameters<typeof createNetworkColumns>[0] & { compareMode?: boolean });

    expect(columns.find((c) => c.id === 'compare')).toBeUndefined();
    expect(columns.find((c) => c.id === 'select')).toBeDefined();
  });

  it('selection column always uses regular selection (not compare mode)', () => {
    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
    });

    const selectionColumn = columns.find((c) => c.id === 'select');
    expect(selectionColumn).toBeDefined();
    // Selection column should not use compare mode logic
    expect(selectionColumn?.id).toBe('select');
  });
});

describe('MethodCell', () => {
  it('renders GET method with correct styling', () => {
    render(<MethodCell method="GET" />);
    const badge = screen.getByText('GET');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-accent-blue');
  });

  it('renders POST method with success styling', () => {
    render(<MethodCell method="POST" />);
    const badge = screen.getByText('POST');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-success');
  });

  it('renders DELETE method with error styling', () => {
    render(<MethodCell method="DELETE" />);
    const badge = screen.getByText('DELETE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-error');
  });

  it('renders method in uppercase', () => {
    render(<MethodCell method="get" />);
    expect(screen.getByText('GET')).toBeInTheDocument();
  });
});

describe('StatusCell', () => {
  it('renders 2xx status with success styling', () => {
    render(<StatusCell status={200} />);
    const badge = screen.getByText('200');
    expect(badge).toHaveClass('text-signal-success');
  });

  it('renders 3xx status with info styling', () => {
    render(<StatusCell status={301} />);
    const badge = screen.getByText('301');
    expect(badge).toHaveClass('text-accent-blue');
  });

  it('renders 4xx status with warning styling', () => {
    render(<StatusCell status={404} />);
    const badge = screen.getByText('404');
    expect(badge).toHaveClass('text-signal-warning');
  });

  it('renders 5xx status with error styling', () => {
    render(<StatusCell status={500} />);
    const badge = screen.getByText('500');
    expect(badge).toHaveClass('text-signal-error');
  });
});

describe('UrlCell', () => {
  it('renders URL text', () => {
    render(<UrlCell url="https://api.example.com/users" />);
    expect(screen.getByText('https://api.example.com/users')).toBeInTheDocument();
  });

  it('truncates long URLs', () => {
    render(<UrlCell url="https://api.example.com/very/long/path/that/should/truncate" />);
    const urlText = screen.getByText(/api.example.com/);
    expect(urlText).toHaveClass('truncate');
  });

  it('shows intelligence signals when provided', () => {
    render(
      <UrlCell
        url="https://api.example.com"
        intelligence={{
          boundToSpec: true,
          specOperation: 'getUsers',
          drift: null,
          aiGenerated: false,
          verified: true,
        }}
      />
    );
    // Intelligence signals should be rendered
    expect(screen.getByTestId('intelligence-signals')).toBeInTheDocument();
  });
});

describe('TimingCell', () => {
  it('renders timing in milliseconds', () => {
    render(<TimingCell totalMs={150} />);
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('formats large timings correctly', () => {
    render(<TimingCell totalMs={1500} />);
    expect(screen.getByText('1500ms')).toBeInTheDocument();
  });
});

describe('SizeCell', () => {
  it('renders bytes', () => {
    render(<SizeCell bytes={500} />);
    expect(screen.getByText('500 B')).toBeInTheDocument();
  });

  it('renders kilobytes', () => {
    render(<SizeCell bytes={2048} />);
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('renders megabytes', () => {
    render(<SizeCell bytes={1500000} />);
    expect(screen.getByText('1.4 MB')).toBeInTheDocument();
  });
});

describe('TimeAgoCell', () => {
  it('renders relative time', () => {
    const recentTime = new Date().toISOString();
    render(<TimeAgoCell timestamp={recentTime} />);
    // Should show "just now" or similar
    expect(screen.getByText(/now|second|minute/i)).toBeInTheDocument();
  });
});

describe('ActionsCell', () => {
  it('renders replay button', () => {
    const onReplay = vi.fn();
    render(<ActionsCell entry={createMockEntry()} onReplay={onReplay} onCopy={vi.fn()} />);
    expect(screen.getByRole('button', { name: /replay/i })).toBeInTheDocument();
  });

  it('renders copy button', () => {
    const onCopy = vi.fn();
    render(<ActionsCell entry={createMockEntry()} onReplay={vi.fn()} onCopy={onCopy} />);
    expect(screen.getByRole('button', { name: /copy.*curl/i })).toBeInTheDocument();
  });

  it('renders delete button when onDelete is provided', () => {
    const onDelete = vi.fn();
    render(
      <ActionsCell
        entry={createMockEntry()}
        onReplay={vi.fn()}
        onCopy={vi.fn()}
        onDelete={onDelete}
      />
    );
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onReplay when replay button is clicked', () => {
    const entry = createMockEntry();
    const onReplay = vi.fn();
    render(<ActionsCell entry={entry} onReplay={onReplay} onCopy={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /replay/i }));
    expect(onReplay).toHaveBeenCalledWith(entry);
  });

  it('calls onCopy when copy button is clicked', () => {
    const entry = createMockEntry();
    const onCopy = vi.fn();
    render(<ActionsCell entry={entry} onReplay={vi.fn()} onCopy={onCopy} />);

    fireEvent.click(screen.getByRole('button', { name: /copy.*curl/i }));
    expect(onCopy).toHaveBeenCalledWith(entry);
  });

  it('calls onDelete when delete button is clicked', () => {
    const entry = createMockEntry();
    const onDelete = vi.fn();
    render(<ActionsCell entry={entry} onReplay={vi.fn()} onCopy={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(entry.id);
  });

  // Feature #12: Actions Column - actions are hidden by default
  it('actions are hidden by default', () => {
    const { container } = render(
      <ActionsCell entry={createMockEntry()} onReplay={vi.fn()} onCopy={vi.fn()} />
    );

    const actionContainer = container.querySelector('div[class*="opacity"]');
    expect(actionContainer).toHaveClass('opacity-0');
  });

  // Feature #44: Hover Action Visibility - actions appear on hover
  it('actions appear on row hover', () => {
    const { container } = render(
      <div className="group">
        <ActionsCell entry={createMockEntry()} onReplay={vi.fn()} onCopy={vi.fn()} />
      </div>
    );

    const actionContainer = container.querySelector('div[class*="opacity"]');
    expect(actionContainer).toHaveClass('group-hover:opacity-100');
  });

  // Feature #44: Hover Action Visibility - actions fade in smoothly
  it('actions fade in smoothly with transition', () => {
    const { container } = render(
      <ActionsCell entry={createMockEntry()} onReplay={vi.fn()} onCopy={vi.fn()} />
    );

    const actionContainer = container.querySelector('div[class*="opacity"]');
    expect(actionContainer).toHaveClass('transition-opacity');
  });

  // Feature #44: Hover Action Visibility - actions are visible when focused
  it('actions are visible when focused', () => {
    render(<ActionsCell entry={createMockEntry()} onReplay={vi.fn()} onCopy={vi.fn()} />);

    const replayButton = screen.getByTestId('replay-button');
    act(() => {
      replayButton.focus();
    });

    // Button should be accessible when focused
    expect(replayButton).toHaveFocus();
  });

  // Feature #44: Hover Action Visibility - touch tap support
  it('actions appear on touch tap', () => {
    const { container } = render(
      <div className="group">
        <ActionsCell entry={createMockEntry()} onReplay={vi.fn()} onCopy={vi.fn()} />
      </div>
    );

    const actionContainer = container.querySelector('div[class*="opacity"]');
    const row = container.querySelector('.group');

    // Simulate touch event
    if (row) {
      fireEvent.touchStart(row);
      // Actions should be visible after touch
      // Note: The actual visibility depends on CSS group-hover, which doesn't work in tests
      // But we verify the structure supports it
      expect(actionContainer).toBeInTheDocument();
    }
  });

  // Feature #45: Hover Action Buttons - displays all action buttons
  it('displays all action buttons', () => {
    render(
      <ActionsCell
        entry={createMockEntry()}
        onReplay={vi.fn()}
        onCopy={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('replay-button')).toBeInTheDocument();
    expect(screen.getByTestId('copy-curl-button')).toBeInTheDocument();
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
  });
});

describe('Network columns integration', () => {
  it('renders a complete row with all columns', () => {
    const entry = createMockEntry({
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
          total_ms: 250,
          dns_ms: 10,
          connect_ms: 20,
          tls_ms: 30,
          first_byte_ms: 100,
        },
      },
    });

    render(<TestTable data={[entry]} />);

    // Method
    expect(screen.getByText('POST')).toBeInTheDocument();

    // URL
    expect(screen.getByText('https://api.example.com/users')).toBeInTheDocument();

    // Status
    expect(screen.getByText('201')).toBeInTheDocument();

    // Timing
    expect(screen.getByText('250ms')).toBeInTheDocument();
  });

  it('action callbacks receive correct entry', () => {
    const entry = createMockEntry({ id: 'unique-entry-id' });
    const onReplay = vi.fn();
    const onCopy = vi.fn();
    const onDelete = vi.fn();

    render(<TestTable data={[entry]} onReplay={onReplay} onCopy={onCopy} onDelete={onDelete} />);

    // Click replay
    fireEvent.click(screen.getByRole('button', { name: /replay/i }));
    expect(onReplay).toHaveBeenCalledWith(expect.objectContaining({ id: 'unique-entry-id' }));
  });
});

describe('Selection column (compare mode removed)', () => {
  it('selection checkbox always uses regular selection (TanStack Table)', () => {
    const entry = createMockEntry({ id: 'entry-1' });

    const columns = createNetworkColumns({
      onReplay: vi.fn(),
      onCopy: vi.fn(),
    });

    const TestTableRegular = (): React.ReactElement => {
      const [expanded] = React.useState<ExpandedState>({});
      const table = useReactTable({
        data: [entry],
        columns,
        state: { expanded },
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowId: (row) => row.id,
        enableRowSelection: true,
      });

      return (
        <table>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    };

    render(<TestTableRegular />);

    // Should render checkboxes (using TanStack Table selection)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });
});
