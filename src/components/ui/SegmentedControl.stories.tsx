import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AlertCircle, AlertTriangle, Info, Terminal, CheckCircle, XCircle } from 'lucide-react';
import { SegmentedControl } from './SegmentedControl';

const meta = {
  title: 'Components/UI/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A standalone segmented control for mutually exclusive options.

## Features

- **Three display variants**: full (label + icon), compact (smaller), icon-only
- **Badge counts**: Show counts with optional Motion+ animation
- **Sizes**: sm, md (default), lg
- **Keyboard navigation**: Tab, Enter, Space
- **Accessible**: ARIA roles, labels, and pressed state

## Usage

\`\`\`tsx
<SegmentedControl
  value={filter}
  onValueChange={setFilter}
  options={[
    { value: 'all', label: 'All' },
    { value: 'error', label: 'Errors', icon: <AlertCircle />, badge: 5 },
    { value: 'warn', label: 'Warnings', icon: <AlertTriangle /> },
  ]}
  aria-label="Filter by log level"
/>
\`\`\`

## When to Use

- Log level filters in console panels
- Status filters (active/completed/archived)
- View mode toggles (list/grid/calendar)
- Any mutually exclusive toggle group
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic segmented control with text-only options.
 */
export const Default: Story = {
  args: {
    value: 'all',
    onValueChange: (): void => undefined,
    options: [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
    ],
    'aria-label': 'Filter by status',
  },
  render: function DefaultStory(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="space-y-4">
        <SegmentedControl {...args} value={value} onValueChange={setValue} />
        <p className="text-xs text-text-muted">Selected: {value}</p>
      </div>
    );
  },
};

/**
 * Options with icons for visual distinction.
 */
export const WithIcons: Story = {
  args: {
    value: 'all',
    onValueChange: (): void => undefined,
    options: [
      { value: 'all', label: 'All' },
      {
        value: 'error',
        label: 'Errors',
        icon: <AlertCircle size={12} className="text-signal-error" />,
      },
      {
        value: 'warn',
        label: 'Warnings',
        icon: <AlertTriangle size={12} className="text-signal-warning" />,
      },
      { value: 'info', label: 'Info', icon: <Info size={12} className="text-accent-blue" /> },
    ],
    'aria-label': 'Filter by log level',
  },
  render: function WithIconsStory(args) {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onValueChange={setValue} />;
  },
};

/**
 * Badge counts for showing quantities (e.g., error counts).
 */
export const WithBadges: Story = {
  args: {
    value: 'all',
    onValueChange: (): void => undefined,
    options: [
      { value: 'all', label: 'All' },
      {
        value: 'error',
        label: 'Errors',
        icon: <AlertCircle size={12} className="text-signal-error" />,
        badge: 3,
      },
      {
        value: 'warn',
        label: 'Warnings',
        icon: <AlertTriangle size={12} className="text-signal-warning" />,
        badge: 7,
      },
      {
        value: 'info',
        label: 'Info',
        icon: <Info size={12} className="text-accent-blue" />,
        badge: 24,
      },
    ],
    'aria-label': 'Filter by log level',
  },
  render: function WithBadgesStory(args) {
    const [value, setValue] = useState(args.value);
    return <SegmentedControl {...args} value={value} onValueChange={setValue} />;
  },
};

/**
 * Badges capped at maxBadgeCount (default 99).
 */
export const BadgeOverflow: Story = {
  args: {
    value: 'all',
    onValueChange: (): void => undefined,
    options: [
      { value: 'all', label: 'All' },
      { value: 'messages', label: 'Messages', badge: 150 },
      { value: 'notifications', label: 'Notifications', badge: 99 },
    ],
    maxBadgeCount: 99,
    'aria-label': 'Filter messages',
  },
  render: function BadgeOverflowStory(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="space-y-4">
        <SegmentedControl {...args} value={value} onValueChange={setValue} />
        <p className="text-xs text-text-muted">Counts over 99 show as &quot;99+&quot;</p>
      </div>
    );
  },
};

/**
 * Animated badge counts using Motion+.
 * Click between options to see the animation on count changes.
 */
export const AnimatedBadges: Story = {
  args: {
    value: 'all',
    onValueChange: (): void => undefined,
    options: [
      { value: 'all', label: 'All' },
      { value: 'error', label: 'Errors', badge: 3 },
      { value: 'warn', label: 'Warnings', badge: 7 },
    ],
    animateBadge: true,
    'aria-label': 'Filter by level',
  },
  render: function AnimatedBadgesStory(args) {
    const [value, setValue] = useState(args.value);
    const [counts, setCounts] = useState({ error: 3, warn: 7 });

    // Simulate changing counts
    const incrementError = (): void => {
      setCounts((c) => ({ ...c, error: c.error + 1 }));
    };

    return (
      <div className="space-y-4">
        <SegmentedControl
          {...args}
          value={value}
          onValueChange={setValue}
          options={[
            { value: 'all', label: 'All' },
            { value: 'error', label: 'Errors', badge: counts.error },
            { value: 'warn', label: 'Warnings', badge: counts.warn },
          ]}
        />
        <button
          type="button"
          onClick={incrementError}
          className="px-2 py-1 text-xs bg-bg-raised border border-border-subtle rounded hover:bg-bg-elevated"
        >
          Add Error (+1)
        </button>
        <p className="text-xs text-text-muted">
          Badge counts animate when they change (uses Motion+ AnimateNumber)
        </p>
      </div>
    );
  },
};

/**
 * Three size variants: sm, md (default), lg.
 */
export const Sizes: Story = {
  args: {
    value: 'option1',
    onValueChange: (): void => undefined,
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ],
    'aria-label': 'Size demo',
  },
  render: function SizesStory() {
    const [value, setValue] = useState('option1');
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ];

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs text-text-muted">Small (h-6)</p>
          <SegmentedControl
            value={value}
            onValueChange={setValue}
            options={options}
            size="sm"
            aria-label="Small size"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-text-muted">Medium (h-7, default)</p>
          <SegmentedControl
            value={value}
            onValueChange={setValue}
            options={options}
            size="md"
            aria-label="Medium size"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-text-muted">Large (h-8)</p>
          <SegmentedControl
            value={value}
            onValueChange={setValue}
            options={options}
            size="lg"
            aria-label="Large size"
          />
        </div>
      </div>
    );
  },
};

/**
 * Icon-only mode for compact layouts. Tooltips show labels.
 */
export const IconOnly: Story = {
  args: {
    value: 'all',
    onValueChange: (): void => undefined,
    options: [
      { value: 'all', label: 'All', icon: <CheckCircle size={14} /> },
      {
        value: 'error',
        label: 'Errors',
        icon: <XCircle size={14} className="text-signal-error" />,
        badge: 5,
      },
      {
        value: 'warn',
        label: 'Warnings',
        icon: <AlertTriangle size={14} className="text-signal-warning" />,
        badge: 3,
      },
      { value: 'debug', label: 'Debug', icon: <Terminal size={14} /> },
    ],
    displayVariant: 'icon',
    'aria-label': 'Filter by level',
  },
  render: function IconOnlyStory(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="space-y-4">
        <SegmentedControl {...args} value={value} onValueChange={setValue} />
        <p className="text-xs text-text-muted">
          Hover to see tooltips with labels (and badge counts)
        </p>
      </div>
    );
  },
};

/**
 * Disabled individual options.
 */
export const DisabledOptions: Story = {
  args: {
    value: 'active',
    onValueChange: (): void => undefined,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'pending', label: 'Pending', disabled: true },
      { value: 'archived', label: 'Archived' },
    ],
    'aria-label': 'Status filter',
  },
  render: function DisabledOptionsStory(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="space-y-4">
        <SegmentedControl {...args} value={value} onValueChange={setValue} />
        <p className="text-xs text-text-muted">&quot;Pending&quot; option is disabled</p>
      </div>
    );
  },
};

/**
 * Entire control disabled.
 */
export const DisabledControl: Story = {
  args: {
    value: 'option1',
    onValueChange: (): void => undefined,
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    disabled: true,
    'aria-label': 'Disabled control',
  },
};

/**
 * Allow deselection by clicking the selected option.
 */
export const AllowEmpty: Story = {
  args: {
    value: 'filter1',
    onValueChange: (): void => undefined,
    options: [
      { value: 'filter1', label: 'Filter 1' },
      { value: 'filter2', label: 'Filter 2' },
      { value: 'filter3', label: 'Filter 3' },
    ],
    allowEmpty: true,
    'aria-label': 'Optional filter',
  },
  render: function AllowEmptyStory(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="space-y-4">
        <SegmentedControl {...args} value={value} onValueChange={setValue} />
        <p className="text-xs text-text-muted">
          Selected: {value !== '' ? value : '(none)'} - Click selected to deselect
        </p>
      </div>
    );
  },
};

/**
 * Console log level filter - real-world usage example.
 */
export const ConsoleLogFilter: Story = {
  args: {
    value: 'all',
    onValueChange: (): void => undefined,
    options: [],
    'aria-label': 'Filter by log level',
  },
  render: function ConsoleLogFilterStory() {
    const [filter, setFilter] = useState('all');
    const counts = { error: 3, warn: 7, info: 24, debug: 156 };
    const total = counts.error + counts.warn + counts.info + counts.debug;

    return (
      <div className="space-y-4 p-4 bg-bg-surface border border-border-subtle rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Console</span>
          <SegmentedControl
            value={filter}
            onValueChange={setFilter}
            options={[
              { value: 'all', label: `All (${String(total)})` },
              {
                value: 'error',
                label: 'Errors',
                icon: <AlertCircle size={12} className="text-signal-error" />,
                badge: counts.error,
              },
              {
                value: 'warn',
                label: 'Warnings',
                icon: <AlertTriangle size={12} className="text-signal-warning" />,
                badge: counts.warn,
              },
              {
                value: 'info',
                label: 'Info',
                icon: <Info size={12} className="text-accent-blue" />,
              },
              {
                value: 'debug',
                label: 'Debug',
                icon: <Terminal size={12} className="text-text-muted" />,
              },
            ]}
            size="sm"
            aria-label="Filter by log level"
          />
        </div>
        <div className="h-32 bg-bg-app border border-border-subtle rounded p-2 font-mono text-xs text-text-muted">
          {filter === 'all' || filter === 'error' ? (
            <div className="text-signal-error">[ERROR] Connection refused</div>
          ) : null}
          {filter === 'all' || filter === 'warn' ? (
            <div className="text-signal-warning">[WARN] Deprecated API usage</div>
          ) : null}
          {filter === 'all' || filter === 'info' ? (
            <div className="text-accent-blue">[INFO] Server started on port 3000</div>
          ) : null}
          {filter === 'all' || filter === 'debug' ? (
            <div className="text-text-muted">[DEBUG] Processing request...</div>
          ) : null}
        </div>
      </div>
    );
  },
};

/**
 * All display variants compared side-by-side with interactive badge counts.
 * Demonstrates how badges appear in full, compact, and icon modes.
 */
export const AllVariantsComparison: Story = {
  args: {
    value: 'all',
    onValueChange: (): void => undefined,
    options: [],
    'aria-label': 'Variant comparison',
  },
  render: function AllVariantsComparisonStory() {
    const [value, setValue] = useState('all');
    const [counts, setCounts] = useState({ error: 3, warn: 7 });

    const incrementError = (): void => {
      setCounts((c) => ({ ...c, error: c.error + 1 }));
    };

    const incrementWarn = (): void => {
      setCounts((c) => ({ ...c, warn: c.warn + 1 }));
    };

    const addHundred = (): void => {
      setCounts((c) => ({ error: c.error + 100, warn: c.warn + 100 }));
    };

    const resetCounts = (): void => {
      setCounts({ error: 3, warn: 7 });
    };

    const total = counts.error + counts.warn + 24; // 24 = info count

    const options = [
      {
        value: 'all',
        label: 'All',
        icon: <CheckCircle size={12} />,
        badge: total,
      },
      {
        value: 'error',
        label: 'Errors',
        icon: <AlertCircle size={12} className="text-signal-error" />,
        badge: counts.error,
      },
      {
        value: 'warn',
        label: 'Warnings',
        icon: <AlertTriangle size={12} className="text-signal-warning" />,
        badge: counts.warn,
      },
      {
        value: 'info',
        label: 'Info',
        icon: <Info size={12} className="text-accent-blue" />,
        badge: 24,
      },
    ];

    const variants: Array<'full' | 'compact' | 'icon'> = ['full', 'compact', 'icon'];

    return (
      <div className="space-y-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={incrementError}
            className="px-3 py-1.5 text-xs bg-signal-error/10 text-signal-error border border-signal-error/30 rounded hover:bg-signal-error/20"
          >
            Add Error (+1)
          </button>
          <button
            type="button"
            onClick={incrementWarn}
            className="px-3 py-1.5 text-xs bg-signal-warning/10 text-signal-warning border border-signal-warning/30 rounded hover:bg-signal-warning/20"
          >
            Add Warning (+1)
          </button>
          <button
            type="button"
            onClick={addHundred}
            className="px-3 py-1.5 text-xs bg-accent-blue/10 text-accent-blue border border-accent-blue/30 rounded hover:bg-accent-blue/20"
          >
            +100 All
          </button>
          <button
            type="button"
            onClick={resetCounts}
            className="px-3 py-1.5 text-xs bg-bg-raised border border-border-subtle rounded hover:bg-bg-elevated"
          >
            Reset
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((variant) => (
            <div key={variant} className="flex items-center gap-4">
              <div className="w-20 text-xs font-medium text-text-muted uppercase tracking-wide shrink-0">
                {variant}
              </div>
              <div className="p-3 bg-bg-surface border border-border-subtle rounded-lg">
                <SegmentedControl
                  value={value}
                  onValueChange={setValue}
                  options={options}
                  displayVariant={variant}
                  animateBadge={true}
                  size="sm"
                  aria-label={`${variant} variant`}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-text-muted">
          All: {total} | Errors: {counts.error} | Warnings: {counts.warn} | Info: 24 | Selected:{' '}
          {value}
        </p>
      </div>
    );
  },
};
