/**
 * @file Console column definitions tests
 * @description Tests for TanStack Table column definitions for the Console Panel
 *
 * TDD: RED phase - these tests define the expected behavior of console columns
 */

import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type ExpandedState,
} from '@tanstack/react-table';
import {
  createConsoleColumns,
  LevelCell,
  MessageCell,
  TimestampCell,
  ConsoleActionsCell,
} from './consoleColumns';
import type { ConsoleLog } from '@/types/console';

// Mock log factory
function createMockLog(overrides: Partial<ConsoleLog> = {}): ConsoleLog {
  return {
    id: 'test-log-1',
    level: 'info',
    message: 'Test log message',
    args: [],
    timestamp: Date.now(),
    ...overrides,
  };
}

// Test table component
interface TestTableProps {
  data?: ConsoleLog[];
  columns?: Array<ColumnDef<ConsoleLog>>;
  onCopy?: (log: ConsoleLog) => void;
  onDelete?: (id: string) => void;
}

const TestTable = ({
  data = [createMockLog()],
  columns,
  onCopy = vi.fn(),
  onDelete = vi.fn(),
}: TestTableProps): React.ReactElement => {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const defaultColumns = React.useMemo(
    () =>
      createConsoleColumns({
        onCopy,
        onDelete,
      }),
    [onCopy, onDelete]
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
          <tr key={row.id} data-testid="table-row">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

describe('createConsoleColumns', () => {
  it('creates all expected columns', () => {
    const columns = createConsoleColumns({
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    expect(columns).toHaveLength(6); // select, expand, level, message, timestamp, actions
  });

  it('includes selection column', () => {
    const columns = createConsoleColumns({
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    expect(columns.find((c) => c.id === 'select')).toBeDefined();
  });

  it('includes expander column', () => {
    const columns = createConsoleColumns({
      onCopy: vi.fn(),
      onDelete: vi.fn(),
    });

    expect(columns.find((c) => c.id === 'expand')).toBeDefined();
  });
});

describe('LevelCell', () => {
  it('renders info level with correct icon and styling', () => {
    render(<LevelCell level="info" />);
    const badge = screen.getByText('info');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-accent-blue');
  });

  it('renders warn level with warning styling', () => {
    render(<LevelCell level="warn" />);
    const badge = screen.getByText('warn');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-warning');
  });

  it('renders error level with error styling', () => {
    render(<LevelCell level="error" />);
    const badge = screen.getByText('error');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-signal-error');
  });

  it('renders debug level with muted styling', () => {
    render(<LevelCell level="debug" />);
    const badge = screen.getByText('debug');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-text-muted');
  });

  it('includes level icon', () => {
    render(<LevelCell level="error" />);
    // Should have an icon (svg element)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});

describe('MessageCell', () => {
  it('renders log message', () => {
    render(<MessageCell message="Hello, world!" />);
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('truncates long messages', () => {
    render(<MessageCell message="This is a very long message that should be truncated..." />);
    const messageText = screen.getByText(/This is a very long message/);
    expect(messageText).toHaveClass('truncate');
  });

  it('shows count badge when count > 1', () => {
    render(<MessageCell message="Repeated message" count={5} />);
    expect(screen.getByText('×5')).toBeInTheDocument();
  });

  it('does not show count badge when count is 1', () => {
    render(<MessageCell message="Single message" count={1} />);
    expect(screen.queryByText('×1')).not.toBeInTheDocument();
  });

  it('does not show count badge when count is undefined', () => {
    render(<MessageCell message="No count message" />);
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
  });
});

describe('TimestampCell', () => {
  it('renders formatted timestamp', () => {
    const timestamp = new Date('2024-01-15T10:30:45').getTime();
    render(<TimestampCell timestamp={timestamp} />);
    // Should show time in HH:MM:SS format
    expect(screen.getByText(/10:30:45/)).toBeInTheDocument();
  });

  it('shows milliseconds', () => {
    const timestamp = new Date('2024-01-15T10:30:45.123').getTime();
    render(<TimestampCell timestamp={timestamp} />);
    // Should include milliseconds
    expect(screen.getByText(/\.123/)).toBeInTheDocument();
  });
});

describe('ConsoleActionsCell', () => {
  it('renders copy button', () => {
    const onCopy = vi.fn();
    render(<ConsoleActionsCell log={createMockLog()} onCopy={onCopy} />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  it('renders delete button when onDelete is provided', () => {
    const onDelete = vi.fn();
    render(<ConsoleActionsCell log={createMockLog()} onCopy={vi.fn()} onDelete={onDelete} />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls onCopy when copy button is clicked', () => {
    const log = createMockLog();
    const onCopy = vi.fn();
    render(<ConsoleActionsCell log={log} onCopy={onCopy} />);

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(onCopy).toHaveBeenCalledWith(log);
  });

  it('calls onDelete when delete button is clicked', () => {
    const log = createMockLog({ id: 'delete-me' });
    const onDelete = vi.fn();
    render(<ConsoleActionsCell log={log} onCopy={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('delete-me');
  });
});

describe('Console columns integration', () => {
  it('renders a complete row with all columns', () => {
    const timestamp = new Date('2024-01-15T10:30:45.123').getTime();
    const log = createMockLog({
      level: 'warn',
      message: 'Warning: Something went wrong',
      timestamp,
    });

    render(<TestTable data={[log]} />);

    // Level
    expect(screen.getByText('warn')).toBeInTheDocument();

    // Message
    expect(screen.getByText('Warning: Something went wrong')).toBeInTheDocument();

    // Timestamp
    expect(screen.getByText(/10:30:45/)).toBeInTheDocument();
  });

  it('action callbacks receive correct log', () => {
    const log = createMockLog({ id: 'unique-log-id' });
    const onCopy = vi.fn();
    const onDelete = vi.fn();

    render(<TestTable data={[log]} onCopy={onCopy} onDelete={onDelete} />);

    // Click copy
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(onCopy).toHaveBeenCalledWith(expect.objectContaining({ id: 'unique-log-id' }));
  });

  it('renders multiple logs', () => {
    const logs = [
      createMockLog({ id: '1', level: 'info', message: 'First log' }),
      createMockLog({ id: '2', level: 'error', message: 'Second log' }),
      createMockLog({ id: '3', level: 'debug', message: 'Third log' }),
    ];

    render(<TestTable data={logs} />);

    expect(screen.getByText('First log')).toBeInTheDocument();
    expect(screen.getByText('Second log')).toBeInTheDocument();
    expect(screen.getByText('Third log')).toBeInTheDocument();
  });
});
