import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DataPanel } from './DataPanel';
import { Checkbox } from './checkbox';
import { EmptyState } from './EmptyState';
import { AlertCircle, Info, Bug, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LogItem {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  selected?: boolean;
}

const sampleLogs: LogItem[] = [
  { id: '1', level: 'info', message: 'Application started', timestamp: new Date() },
  { id: '2', level: 'warn', message: 'Memory usage high', timestamp: new Date() },
  { id: '3', level: 'error', message: 'Failed to connect to database', timestamp: new Date() },
  { id: '4', level: 'debug', message: 'Request received: GET /api/users', timestamp: new Date() },
  { id: '5', level: 'info', message: 'User logged in: john@example.com', timestamp: new Date() },
];

const levelColors = {
  info: 'text-accent-blue',
  warn: 'text-signal-warning',
  error: 'text-signal-error',
  debug: 'text-text-muted',
};

const levelIcons = {
  info: Info,
  warn: AlertCircle,
  error: Bug,
  debug: Check,
};

const meta = {
  title: 'Components/UI/DataPanel',
  component: DataPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `A generic, reusable panel component for displaying lists of data with an optional header.

## Features

- **Generic Type Support**: Works with any item type via TypeScript generics
- **Pluggable Row Renderer**: Pass a render function for complete control over row rendering
- **Configurable Header**: Optional header with select all functionality
- **Empty State**: Built-in support for empty state rendering
- **Scroll Container**: Includes scrollable container with ref forwarding

## Usage

**Basic Panel:**
\`\`\`tsx
<DataPanel
  items={logs}
  renderRow={(log) => <LogRow key={log.id} log={log} />}
/>
\`\`\`

**With Header:**
\`\`\`tsx
<DataPanel
  items={logs}
  renderRow={(log) => <LogRow key={log.id} log={log} />}
  header={{
    columns: [{ label: 'Level' }, { label: 'Message' }],
    allSelected: allLogsSelected,
    onSelectAllChange: handleSelectAll,
  }}
/>
\`\`\`

**With Empty State:**
\`\`\`tsx
<DataPanel
  items={[]}
  renderRow={(log) => <LogRow key={log.id} log={log} />}
  emptyState={<EmptyState message="No logs yet" />}
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const LogRow = ({
  log,
  selected,
  onSelect,
}: {
  log: LogItem;
  selected?: boolean;
  onSelect?: () => void;
}): React.ReactElement => {
  const Icon = levelIcons[log.level];
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-2 py-1.5 border-b border-border-subtle',
        'hover:bg-bg-raised/50 transition-colors',
        selected === true && 'bg-accent-blue/10'
      )}
    >
      {onSelect !== undefined && (
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label={`Select ${log.message}`}
        />
      )}
      <Icon size={14} className={levelColors[log.level]} />
      <span className={cn('text-xs font-medium uppercase', levelColors[log.level])}>
        {log.level}
      </span>
      <span className="flex-1 text-sm text-text-primary truncate">{log.message}</span>
      <span className="text-xs text-text-muted w-20 text-right">
        {log.timestamp.toLocaleTimeString()}
      </span>
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <div className="bg-bg-app rounded-lg border border-border-default overflow-hidden h-64">
      <DataPanel items={sampleLogs} renderRow={(log) => <LogRow key={log.id} log={log} />} />
    </div>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <div className="bg-bg-app rounded-lg border border-border-default overflow-hidden h-64">
      <DataPanel
        items={sampleLogs}
        renderRow={(log) => <LogRow key={log.id} log={log} />}
        header={{
          columns: [
            { label: 'Level', className: 'text-xs text-text-muted w-16' },
            { label: 'Message', className: 'flex-1 text-xs text-text-muted' },
            { label: 'Time', className: 'w-20 text-right text-xs text-text-muted' },
          ],
          allSelected: false,
          showSelectAll: false,
          onSelectAllChange: (): void => {
            /* noop for story */
          },
        }}
      />
    </div>
  ),
};

export const WithEmptyState: Story = {
  render: () => (
    <div className="bg-bg-app rounded-lg border border-border-default overflow-hidden h-64">
      <DataPanel
        items={[]}
        renderRow={(log: LogItem) => <LogRow key={log.id} log={log} />}
        emptyState={<EmptyState message="No logs to display" className="h-full" />}
      />
    </div>
  ),
};

export const WithSelectAll: Story = {
  render: function WithSelectAllPanel() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const allSelected = selectedIds.size === sampleLogs.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < sampleLogs.length;

    const handleSelectAll = (checked: boolean): void => {
      if (checked) {
        setSelectedIds(new Set(sampleLogs.map((log) => log.id)));
      } else {
        setSelectedIds(new Set());
      }
    };

    const toggleSelect = (id: string): void => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    };

    return (
      <div className="bg-bg-app rounded-lg border border-border-default overflow-hidden h-80">
        <DataPanel
          items={sampleLogs}
          renderRow={(log) => (
            <LogRow
              key={log.id}
              log={log}
              selected={selectedIds.has(log.id)}
              onSelect={() => {
                toggleSelect(log.id);
              }}
            />
          )}
          header={{
            columns: [
              { label: 'Level', className: 'text-xs text-text-muted w-16' },
              { label: 'Message', className: 'flex-1 text-xs text-text-muted' },
              { label: 'Time', className: 'w-20 text-right text-xs text-text-muted' },
            ],
            showSelectAll: true,
            allSelected,
            someSelected,
            onSelectAllChange: handleSelectAll,
          }}
          showHeaderOnlyWhenItemsExist={true}
        />
        <div className="px-3 py-2 border-t border-border-subtle bg-bg-raised/50 text-xs text-text-muted">
          Selected: {selectedIds.size} / {sampleLogs.length}
        </div>
      </div>
    );
  },
};

interface NetworkEntry {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  status: number;
  time: number;
  size: string;
}

const sampleNetworkEntries: NetworkEntry[] = [
  { id: '1', method: 'GET', url: '/api/users', status: 200, time: 45, size: '1.2 KB' },
  { id: '2', method: 'POST', url: '/api/users', status: 201, time: 120, size: '0.5 KB' },
  { id: '3', method: 'GET', url: '/api/products?page=1', status: 200, time: 89, size: '4.5 KB' },
  { id: '4', method: 'DELETE', url: '/api/users/123', status: 204, time: 30, size: '0 B' },
];

const methodColors = {
  GET: 'text-accent-blue',
  POST: 'text-signal-success',
  PUT: 'text-signal-warning',
  DELETE: 'text-signal-error',
};

const NetworkRow = ({ entry }: { entry: NetworkEntry }): React.ReactElement => (
  <div className="flex items-center gap-3 px-2 py-1.5 border-b border-border-subtle hover:bg-bg-raised/50">
    <span className={cn('text-xs font-mono w-12', methodColors[entry.method])}>{entry.method}</span>
    <span className="flex-1 text-sm text-text-primary font-mono truncate">{entry.url}</span>
    <span
      className={cn(
        'text-xs w-10 text-right',
        entry.status >= 400 ? 'text-signal-error' : 'text-signal-success'
      )}
    >
      {entry.status}
    </span>
    <span className="text-xs text-text-muted w-12 text-right">{entry.time}ms</span>
    <span className="text-xs text-text-muted w-14 text-right">{entry.size}</span>
  </div>
);

/**
 * Demonstrates using DataPanel with a different item type (network entries).
 */
export const DifferentRowType: Story = {
  render: () => (
    <div className="bg-bg-app rounded-lg border border-border-default overflow-hidden h-64">
      <DataPanel
        items={sampleNetworkEntries}
        renderRow={(entry) => <NetworkRow key={entry.id} entry={entry} />}
        header={{
          columns: [
            { label: 'Method', className: 'text-xs text-text-muted w-12' },
            { label: 'URL', className: 'flex-1 text-xs text-text-muted' },
            { label: 'Status', className: 'w-10 text-right text-xs text-text-muted' },
            { label: 'Time', className: 'w-12 text-right text-xs text-text-muted' },
            { label: 'Size', className: 'w-14 text-right text-xs text-text-muted' },
          ],
          showSelectAll: false,
          allSelected: false,
          onSelectAllChange: (): void => {
            /* noop for story */
          },
        }}
      />
    </div>
  ),
};
