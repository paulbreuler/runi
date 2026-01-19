import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ConsoleToolbar } from './ConsoleToolbar';

const meta = {
  title: 'Components/Console/ConsoleToolbar',
  component: ConsoleToolbar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Toolbar for the Console Panel, built on the ActionBar component system.

## Features

- **Log Level Filtering**: Segmented control with animated badge counts
- **Full-Text Search**: Search logs across message, args, and correlation ID
- **Auto-scroll Toggle**: Lock/unlock auto-scroll to latest logs
- **Bulk Actions**: Save, copy, and clear console logs

## Auto Button

The Auto button toggles auto-scroll behavior:

| State | Variant | Behavior |
|-------|---------|----------|
| ON (default) | Filled | Console scrolls to show new logs as they arrive |
| OFF | Outline | User can freely scroll through history |

The button uses \`aria-pressed\` for screen reader accessibility.

## Responsive Behavior

Inherits ActionBar's responsive breakpoints:
- **Full mode (> 700px)**: All labels visible
- **Compact mode (500-700px)**: Shorter labels
- **Icon mode (< 500px)**: Icons only with tooltips
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConsoleToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultCounts = { error: 3, warn: 7, info: 24, debug: 156 };

/**
 * Default console toolbar with all features.
 */
export const Default: Story = {
  args: {
    filter: 'all',
    onFilterChange: (): void => undefined,
    searchFilter: '',
    onSearchFilterChange: (): void => undefined,
    autoScroll: true,
    onAutoScrollToggle: (): void => undefined,
    onClear: (): void => undefined,
    onSaveAll: (): void => undefined,
    onSaveSelection: (): void => undefined,
    onCopySelection: (): void => undefined,
    selectedCount: 0,
    counts: defaultCounts,
    totalCount: 190,
  },
};

/**
 * Interactive demo with state management.
 */
export const Interactive: Story = {
  args: Default.args,
  render: function InteractiveStory() {
    const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');
    const [searchText, setSearchText] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const [selectedCount, setSelectedCount] = useState(0);

    return (
      <div className="space-y-4">
        <ConsoleToolbar
          filter={filter}
          onFilterChange={setFilter}
          searchFilter={searchText}
          onSearchFilterChange={setSearchText}
          autoScroll={autoScroll}
          onAutoScrollToggle={() => {
            setAutoScroll(!autoScroll);
          }}
          onClear={() => {
            console.log('Clear logs');
          }}
          onSaveAll={() => {
            console.log('Save all logs');
          }}
          onSaveSelection={() => {
            console.log('Save selection');
          }}
          onCopySelection={() => {
            console.log('Copy selection');
          }}
          selectedCount={selectedCount}
          counts={defaultCounts}
          totalCount={190}
        />
        <div className="flex gap-4 text-xs text-text-muted">
          <span>Filter: {filter}</span>
          <span>Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
          <button
            type="button"
            className="underline"
            onClick={() => {
              setSelectedCount(selectedCount === 0 ? 5 : 0);
            }}
          >
            {selectedCount === 0 ? 'Select some logs' : 'Clear selection'}
          </button>
        </div>
      </div>
    );
  },
};

/**
 * Auto-scroll is ON (default state).
 * The button appears filled, indicating the console will scroll to new logs.
 */
export const AutoScrollEnabled: Story = {
  args: {
    ...Default.args,
    autoScroll: true,
  },
  render: function AutoScrollEnabledStory(args) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Auto-scroll is <strong>enabled</strong>. The Auto button is filled.
        </p>
        <ConsoleToolbar {...args} />
      </div>
    );
  },
};

/**
 * Auto-scroll is OFF.
 * The button appears outlined, indicating free scrolling mode.
 */
export const AutoScrollDisabled: Story = {
  args: {
    ...Default.args,
    autoScroll: false,
  },
  render: function AutoScrollDisabledStory(args) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Auto-scroll is <strong>disabled</strong>. The Auto button is outlined.
        </p>
        <ConsoleToolbar {...args} />
      </div>
    );
  },
};

/**
 * With logs selected, the selection actions become enabled.
 */
export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedCount: 5,
  },
  render: function WithSelectionStory(args) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          5 logs selected. Save Selection and Copy are enabled.
        </p>
        <ConsoleToolbar {...args} />
      </div>
    );
  },
};

/**
 * Filtering by error level shows only error logs.
 */
export const FilteredByErrors: Story = {
  args: {
    ...Default.args,
    filter: 'error',
  },
};

/**
 * Filtering with full-text search.
 * Searches across message, args, and correlation ID.
 */
export const WithSearchFilter: Story = {
  args: {
    ...Default.args,
    searchFilter: 'timeout',
  },
};

/**
 * High error/warning counts show animated badges.
 */
export const HighErrorCounts: Story = {
  args: {
    ...Default.args,
    counts: { error: 42, warn: 128, info: 500, debug: 2000 },
    totalCount: 2670,
  },
  render: function HighCountsStory(args) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          High log counts. Badge numbers animate when they change.
        </p>
        <ConsoleToolbar {...args} />
      </div>
    );
  },
};
