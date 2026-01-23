/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Code,
  CheckCircle,
  Brain,
  AlertCircle,
  AlertTriangle,
  Info,
  Terminal,
  GitCompare,
  Download,
  Trash2,
  Copy,
} from 'lucide-react';
import { ActionBar } from './ActionBar';
import { ActionBarGroup } from './ActionBarGroup';
import { ActionBarSegment } from './ActionBarSegment';
import { ActionBarSearch } from './ActionBarSearch';
import { ActionBarSelect } from './ActionBarSelect';
import { ActionBarCompositeButton } from './ActionBarCompositeButton';
import {
  renderMethodOption,
  renderStatusOption,
  renderIntelligenceOption,
  type MethodSelectOption,
  type StatusSelectOption,
  type IntelligenceSelectOption,
} from './selectRenderers';
import { Button } from '../ui/button';
import { Filter } from 'lucide-react';

const meta = {
  title: 'ActionBar/ActionBar',
  component: ActionBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `A unified, composable ActionBar component system for toolbars.

## Features

- **Responsive Breakpoints**: Automatically adapts to container width (full → compact → icon)
- **Horizontal Scroll**: Overflow handling with animated gradient cues
- **Touch Support**: Pan gestures for mobile devices
- **Reduced Motion**: Respects user preferences
- **Accessible**: ARIA roles, labels, and keyboard navigation

## Components

| Component | Purpose |
|-----------|---------|
| \`ActionBar\` | Responsive container with scroll handling |
| \`ActionBarGroup\` | Semantic grouping with optional separator |
| \`ActionBarSegment\` | Segmented control for mutually exclusive options |
| \`ActionBarSearch\` | Compact search input with icon |
| \`ActionBarSelect\` | Radix Select wrapper with icon mode and custom rendering |
| \`ActionBarCompositeButton\` | Split button with dropdown menu |

**Note**: This story file includes both ActionBar system stories and ActionBarSelect-specific stories demonstrating custom rendering with colored options.

## Responsive Variants

| Width | Variant | Behavior |
|-------|---------|----------|
| > 800px | \`full\` | Full labels, all controls visible |
| 600-800px | \`compact\` | Shorter labels |
| < 600px | \`icon\` | Icon-only with tooltips |

## Usage

\`\`\`tsx
<ActionBar breakpoints={[800, 600]}>
  <ActionBarGroup>
    <ActionBarSearch
      value={search}
      onChange={setSearch}
      placeholder="Search..."
      aria-label="Search"
    />
    <ActionBarSelect
      value={filter}
      onValueChange={setFilter}
      options={[...]}
      icon={<Filter />}
      aria-label="Filter by..."
    />
  </ActionBarGroup>
  <ActionBarGroup align="end">
    <Button>Action</Button>
  </ActionBarGroup>
</ActionBar>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Custom args for ConsolePanelToolbar power-up demonstration
interface ConsolePanelToolbarStoryArgs {
  powerTier?:
    | 'normal'
    | 'tier1'
    | 'tier2'
    | 'tier3'
    | 'tier4'
    | 'tier5'
    | 'tier6'
    | 'tier7'
    | 'tier8'
    | 'custom';
  errorCount?: number;
  warnCount?: number;
  infoCount?: number;
  debugCount?: number;
}

/**
 * Basic ActionBar with search and buttons.
 */
export const Default: Story = {
  args: {
    children: null,
  },
  render: () => (
    <ActionBar aria-label="Default action bar">
      <ActionBarGroup>
        <ActionBarSearch
          value=""
          onChange={(): void => undefined}
          placeholder="Search..."
          aria-label="Search"
        />
      </ActionBarGroup>
      <ActionBarGroup align="end">
        <Button size="xs" variant="outline">
          Cancel
        </Button>
        <Button size="xs">Save</Button>
      </ActionBarGroup>
    </ActionBar>
  ),
};

/**
 * Network History FilterBar example.
 * Demonstrates search, selects, compare toggle, and composite save button.
 */
export const NetworkHistoryFilterBar: Story = {
  args: {
    children: null,
  },
  render: function NetworkHistoryExample() {
    const [search, setSearch] = useState('');
    const [method, setMethod] = useState('ALL');
    const [status, setStatus] = useState('All');
    const [intelligence, setIntelligence] = useState('All');
    const [compareMode, setCompareMode] = useState(false);

    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">Resize the container to see responsive behavior.</p>
        <ActionBar aria-label="Network history filters">
          <ActionBarGroup>
            <ActionBarSearch
              value={search}
              onChange={setSearch}
              placeholder="Filter by URL..."
              aria-label="Filter history by URL"
            />
            <ActionBarSelect
              value={method}
              onValueChange={setMethod}
              options={[
                { value: 'ALL', label: 'All Methods' },
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
                { value: 'PUT', label: 'PUT' },
                { value: 'PATCH', label: 'PATCH' },
                { value: 'DELETE', label: 'DELETE' },
              ]}
              icon={<Code size={14} />}
              aria-label="Filter by HTTP method"
            />
            <ActionBarSelect
              value={status}
              onValueChange={setStatus}
              options={[
                { value: 'All', label: 'All Status' },
                { value: '2xx', label: '2xx Success' },
                { value: '3xx', label: '3xx Redirect' },
                { value: '4xx', label: '4xx Client Error' },
                { value: '5xx', label: '5xx Server Error' },
              ]}
              icon={<CheckCircle size={14} />}
              aria-label="Filter by status code"
            />
            <ActionBarSelect
              value={intelligence}
              onValueChange={setIntelligence}
              options={[
                { value: 'All', label: 'All' },
                { value: 'Has Drift', label: 'Has Drift' },
                { value: 'AI Generated', label: 'AI Generated' },
                { value: 'Bound to Spec', label: 'Bound to Spec' },
              ]}
              icon={<Brain size={14} />}
              aria-label="Filter by intelligence"
            />
          </ActionBarGroup>

          <ActionBarGroup separator>
            <Button
              size="xs"
              variant={compareMode ? 'default' : 'outline'}
              onClick={() => {
                setCompareMode(!compareMode);
              }}
              aria-pressed={compareMode}
            >
              <GitCompare size={14} />
              <span>Compare</span>
            </Button>
          </ActionBarGroup>

          <ActionBarGroup align="end">
            <ActionBarCompositeButton
              primary={{
                label: 'Save Selected',
                icon: <Download size={12} />,
                onClick: () => {
                  console.log('Save selected');
                },
                disabled: true,
              }}
              options={[
                {
                  label: 'Save Selected',
                  icon: <Download size={12} />,
                  onClick: () => {
                    console.log('Save selected');
                  },
                  disabled: true,
                },
                {
                  label: 'Save All',
                  icon: <Download size={12} />,
                  onClick: () => {
                    console.log('Save all');
                  },
                },
              ]}
            />
            <Button size="xs" variant="destructive-outline">
              <Trash2 size={12} />
              <span>Delete All</span>
            </Button>
          </ActionBarGroup>
        </ActionBar>
      </div>
    );
  },
};

/**
 * Console Panel Toolbar example.
 * Demonstrates segmented log level filter with badges and power-up tiers.
 *
 * **Power-Up System:**
 * - Badge counts over 9000 trigger power tiers (1-4)
 * - All badges over 9000 with high totals trigger advanced tiers (5-8)
 * - Use the Controls panel to adjust badge counts or select tier presets
 * - Watch for visual effects and animations as tiers change
 *
 * **Tiers:**
 * - Tier 0: Normal (all badges < 9000)
 * - Tier 1-4: Power Up (1-4 badges over 9000)
 * - Tier 5-8: Ascended (all badges over 9000, increasing total power)
 */
export const ConsolePanelToolbar: Story = {
  args: {
    children: null,
    powerTier: 'normal',
    errorCount: 3,
    warnCount: 7,
    infoCount: 24,
    debugCount: 156,
  } as any,
  argTypes: {
    powerTier: {
      control: 'select',
      options: [
        'normal',
        'tier1',
        'tier2',
        'tier3',
        'tier4',
        'tier5',
        'tier6',
        'tier7',
        'tier8',
        'custom',
      ],
      description: 'Power tier preset (sets badge counts automatically)',
    },
    errorCount: {
      control: 'number',
      min: 0,
      max: 50000,
      step: 100,
      description: 'Error log count',
    },
    warnCount: {
      control: 'number',
      min: 0,
      max: 50000,
      step: 100,
      description: 'Warning log count',
    },
    infoCount: {
      control: 'number',
      min: 0,
      max: 50000,
      step: 100,
      description: 'Info log count',
    },
    debugCount: {
      control: 'number',
      min: 0,
      max: 50000,
      step: 100,
      description: 'Debug log count',
    },
  } as any,
  render: function ConsoleToolbarExample(args) {
    const storyArgs = args as unknown as ConsolePanelToolbarStoryArgs;
    
    // Power tier presets
    const tierPresets: Record<
      string,
      { error: number; warn: number; info: number; debug: number }
    > = {
      normal: { error: 3, warn: 7, info: 24, debug: 156 },
      tier1: { error: 9001, warn: 7, info: 24, debug: 156 },
      tier2: { error: 9001, warn: 9001, info: 24, debug: 156 },
      tier3: { error: 9001, warn: 9001, info: 9001, debug: 156 },
      tier4: { error: 9001, warn: 9001, info: 9001, debug: 9001 },
      tier5: { error: 9000, warn: 9000, info: 9000, debug: 9000 },
      tier6: { error: 12500, warn: 12500, info: 12500, debug: 12500 },
      tier7: { error: 20000, warn: 20000, info: 20000, debug: 20000 },
      tier8: { error: 25000, warn: 25000, info: 25000, debug: 25000 },
    };

    // Initialize counts from preset or args, but use state for interactivity
    const initialPreset =
      storyArgs.powerTier !== undefined && storyArgs.powerTier !== 'custom'
        ? tierPresets[storyArgs.powerTier]
        : undefined;
    const initialCounts = initialPreset ?? {
      error: storyArgs.errorCount ?? 3,
      warn: storyArgs.warnCount ?? 7,
      info: storyArgs.infoCount ?? 24,
      debug: storyArgs.debugCount ?? 156,
    };

    // Use state for counts to enable interactive buttons
    const [counts, setCounts] = useState(initialCounts);
    const [isEvolving, setIsEvolving] = useState(false);
    const [filter, setFilter] = useState<string>('all');
    const [correlationId, setCorrelationId] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);

    // Update counts when args change (from controls)
    React.useEffect(() => {
      const preset =
        storyArgs.powerTier !== undefined && storyArgs.powerTier !== 'custom'
          ? tierPresets[storyArgs.powerTier]
          : undefined;
      if (preset !== undefined) {
        setCounts(preset);
      } else if (storyArgs.powerTier === 'custom') {
        setCounts({
          error: storyArgs.errorCount ?? 3,
          warn: storyArgs.warnCount ?? 7,
          info: storyArgs.infoCount ?? 24,
          debug: storyArgs.debugCount ?? 156,
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- tierPresets is stable
    }, [storyArgs.powerTier, storyArgs.errorCount, storyArgs.warnCount, storyArgs.infoCount, storyArgs.debugCount]);

    // Interactive power-up functions
    const addHundred = (): void => {
      setCounts((c) => ({
        error: c.error + 100,
        warn: c.warn + 100,
        info: c.info + 100,
        debug: c.debug + 100,
      }));
    };

    const addNineThousand = (): void => {
      setCounts((c) => ({
        error: c.error + 9000,
        warn: c.warn + 9000,
        info: c.info + 9000,
        debug: c.debug + 9000,
      }));
    };

    // Progressive evolution: staggered power-up sequence
    const triggerEvolution = (): void => {
      if (isEvolving) {
        return;
      }
      setIsEvolving(true);

      // Reset first
      setCounts({ error: 3, warn: 7, info: 24, debug: 156 });

      // Stagger each badge crossing threshold to see animations
      setTimeout(() => {
        setCounts((c) => ({ ...c, error: 9001 }));
      }, 400);
      setTimeout(() => {
        setCounts((c) => ({ ...c, warn: 9001 }));
      }, 1200);
      setTimeout(() => {
        setCounts((c) => ({ ...c, info: 9001 }));
      }, 2000);
      setTimeout(() => {
        setCounts((c) => ({ ...c, debug: 9001 }));
      }, 2800);
      // After tier 4, boost to tier 5 (all exactly 9000)
      setTimeout(() => {
        setCounts({ error: 9000, warn: 9000, info: 9000, debug: 9000 });
      }, 4000);
      // Progress to tier 6
      setTimeout(() => {
        setCounts({ error: 12500, warn: 12500, info: 12500, debug: 12500 });
      }, 5500);
      // Progress to tier 7
      setTimeout(() => {
        setCounts({ error: 20000, warn: 20000, info: 20000, debug: 20000 });
      }, 7000);
      // Final tier 8
      setTimeout(() => {
        setCounts({ error: 25000, warn: 25000, info: 25000, debug: 25000 });
      }, 8500);
      // Allow re-triggering after sequence
      setTimeout(() => {
        setIsEvolving(false);
      }, 10000);
    };

    const resetCounts = (): void => {
      setCounts({ error: 3, warn: 7, info: 24, debug: 156 });
      setIsEvolving(false);
    };

    const total = counts.error + counts.warn + counts.info + counts.debug;

    // Calculate current tier for display
    const calculateTier = (): number => {
      const badges = [
        counts.error >= 9000 ? counts.error : 0,
        counts.warn >= 9000 ? counts.warn : 0,
        counts.info >= 9000 ? counts.info : 0,
        counts.debug >= 9000 ? counts.debug : 0,
      ].filter((b) => b > 0);

      const badgesOver9000 = badges.length;
      const totalPower = badges.reduce((sum, b) => sum + b, 0);
      const allOver9000 = badgesOver9000 === 4 && badges.every((b) => b >= 9000);

      if (allOver9000) {
        if (totalPower >= 100000) return 8;
        if (totalPower >= 80000) return 7;
        if (totalPower >= 50000) return 6;
        return 5;
      }
      return Math.min(badgesOver9000, 4);
    };

    const currentTier = calculateTier();

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Console toolbar with log level segment and correlation ID search.
          </p>
          {currentTier > 0 && (
            <div className="text-xs text-text-muted">
              <span className="font-semibold text-accent-blue">Power Tier: {currentTier}</span>
              {currentTier >= 5 && <span className="ml-2 text-signal-warning">⚡ ASCENDED ⚡</span>}
            </div>
          )}
        </div>
        
        {/* Interactive Power-Up Controls */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-bg-raised/50 rounded-lg border border-border-subtle">
          <span className="text-xs font-medium text-text-secondary mr-2">Power-Up Controls:</span>
          <Button size="xs" variant="outline" onClick={addHundred} disabled={isEvolving}>
            +100 All
          </Button>
          <Button size="xs" variant="outline" onClick={addNineThousand} disabled={isEvolving}>
            +9000 All
          </Button>
          <Button
            size="xs"
            variant="default"
            onClick={triggerEvolution}
            disabled={isEvolving}
            className="font-semibold"
          >
            {isEvolving ? 'Evolving...' : '⚡ Watch Power-Up ⚡'}
          </Button>
          <Button size="xs" variant="ghost" onClick={resetCounts} disabled={isEvolving}>
            Reset
          </Button>
          <span className="text-xs text-text-muted ml-auto">
            Current: E:{counts.error} W:{counts.warn} I:{counts.info} D:{counts.debug}
          </span>
        </div>
        <ActionBar aria-label="Console toolbar">
          <ActionBarGroup>
            <ActionBarSegment
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
                  badge: counts.info,
                },
                {
                  value: 'debug',
                  label: 'Debug',
                  icon: <Terminal size={12} className="text-text-muted" />,
                  badge: counts.debug,
                },
              ]}
              aria-label="Filter by log level"
            />
            <ActionBarSearch
              value={correlationId}
              onChange={setCorrelationId}
              placeholder="Correlation ID..."
              aria-label="Filter by correlation ID"
            />
          </ActionBarGroup>

          <ActionBarGroup align="end">
            <Button
              size="xs"
              variant={autoScroll ? 'default' : 'outline'}
              onClick={() => {
                setAutoScroll(!autoScroll);
              }}
              aria-pressed={autoScroll}
            >
              Auto
            </Button>
            <Button size="xs" variant="ghost">
              <Copy size={14} />
            </Button>
            <Button size="xs" variant="destructive-outline">
              <Trash2 size={14} />
            </Button>
          </ActionBarGroup>
        </ActionBar>
      </div>
    );
  },
};

/**
 * Segmented control with icons and badges.
 */
export const SegmentedControl: Story = {
  args: {
    children: null,
  },
  render: function SegmentExample() {
    const [value, setValue] = useState('all');

    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">ActionBarSegment for mutually exclusive options.</p>
        <ActionBar aria-label="Segment demo">
          <ActionBarGroup>
            <ActionBarSegment
              value={value}
              onValueChange={setValue}
              options={[
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active', badge: 12 },
                { value: 'completed', label: 'Completed', badge: 5 },
                { value: 'archived', label: 'Archived' },
              ]}
              aria-label="Filter by status"
            />
          </ActionBarGroup>
        </ActionBar>
        <p className="text-xs text-text-muted">Selected: {value}</p>
      </div>
    );
  },
};

/**
 * Composite button with dropdown menu.
 */
export const CompositeButton: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Split button with primary action and dropdown options.
      </p>
      <ActionBar aria-label="Composite button demo">
        <ActionBarGroup>
          <ActionBarCompositeButton
            primary={{
              label: 'Save',
              icon: <Download size={12} />,
              onClick: () => {
                console.log('Save clicked');
              },
            }}
            options={[
              {
                label: 'Save',
                icon: <Download size={12} />,
                onClick: () => {
                  console.log('Save');
                },
              },
              {
                label: 'Save As...',
                icon: <Download size={12} />,
                onClick: () => {
                  console.log('Save As');
                },
              },
              {
                label: 'Export',
                icon: <Download size={12} />,
                onClick: () => {
                  console.log('Export');
                },
              },
            ]}
          />
          <ActionBarCompositeButton
            variant="default"
            primary={{
              label: 'Create',
              icon: <Download size={12} />,
              onClick: () => {
                console.log('Create clicked');
              },
            }}
            options={[
              { label: 'New File', onClick: (): void => undefined },
              { label: 'New Folder', onClick: (): void => undefined },
            ]}
          />
        </ActionBarGroup>
      </ActionBar>
    </div>
  ),
};

/**
 * Demonstrates all three responsive variants side by side.
 */
export const ResponsiveVariants: Story = {
  args: {
    children: null,
  },
  render: function ResponsiveExample() {
    const [search, setSearch] = useState('');
    const [method, setMethod] = useState('ALL');

    const renderActionBar = (variant: 'full' | 'compact' | 'icon'): React.JSX.Element => (
      <div className="border border-border-subtle rounded-lg overflow-hidden">
        <div className="px-2 py-1 bg-bg-raised/50 text-xs text-text-muted border-b border-border-subtle">
          {variant} variant
        </div>
        <ActionBar aria-label={`${variant} variant example`}>
          <ActionBarGroup>
            <ActionBarSearch
              value={search}
              onChange={setSearch}
              placeholder="Search..."
              aria-label="Search"
              variant={variant}
            />
            <ActionBarSelect
              value={method}
              onValueChange={setMethod}
              options={[
                { value: 'ALL', label: 'All Methods' },
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
              ]}
              icon={<Code size={14} />}
              aria-label="Method"
              variant={variant}
            />
          </ActionBarGroup>
          <ActionBarGroup align="end">
            <ActionBarCompositeButton
              displayVariant={variant}
              primary={{
                label: 'Save',
                icon: <Download size={12} />,
                onClick: (): void => undefined,
              }}
              options={[
                { label: 'Save', onClick: (): void => undefined },
                { label: 'Save All', onClick: (): void => undefined },
              ]}
            />
          </ActionBarGroup>
        </ActionBar>
      </div>
    );

    return (
      <div className="space-y-6">
        <p className="text-sm text-text-muted">
          Each variant shown with explicit override (normally auto-detected by container width).
        </p>
        {renderActionBar('full')}
        {renderActionBar('compact')}
        {renderActionBar('icon')}
      </div>
    );
  },
};

/**
 * Groups with separators and alignment.
 */
export const GroupsAndSeparators: Story = {
  args: {
    children: null,
  },
  render: () => (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        ActionBarGroup supports separators and end alignment.
      </p>
      <ActionBar aria-label="Groups demo">
        <ActionBarGroup separator aria-label="Primary actions">
          <Button size="xs">Action 1</Button>
          <Button size="xs">Action 2</Button>
        </ActionBarGroup>
        <ActionBarGroup separator aria-label="Secondary actions">
          <Button size="xs" variant="outline">
            Action 3
          </Button>
        </ActionBarGroup>
        <ActionBarGroup align="end" aria-label="End actions">
          <Button size="xs" variant="ghost">
            <Trash2 size={14} />
          </Button>
        </ActionBarGroup>
      </ActionBar>
    </div>
  ),
};

// ============================================================================
// ActionBarSelect Stories
// ============================================================================

/**
 * Basic select without custom rendering.
 */
export const ActionBarSelectDefault: Story = {
  args: {
    children: null,
  },
  render: function ActionBarSelectDefaultStory() {
    const [value, setValue] = useState('option1');
    return (
      <ActionBar aria-label="Demo">
        <ActionBarGroup>
          <ActionBarSelect
            value={value}
            onValueChange={setValue}
            options={[
              { value: 'option1', label: 'Option 1' },
              { value: 'option2', label: 'Option 2' },
              { value: 'option3', label: 'Option 3' },
            ]}
            icon={<Filter size={14} />}
            aria-label="Select an option"
          />
        </ActionBarGroup>
      </ActionBar>
    );
  },
};

const METHOD_OPTIONS: MethodSelectOption[] = [
  { value: 'ALL', label: 'All Methods' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

/**
 * HTTP method select with colored badges.
 * Methods display with industry-standard colors (GET=blue, POST=green, etc.)
 */
export const ActionBarSelectMethod: Story = {
  args: {
    children: null,
  },
  render: function ActionBarSelectMethodStory() {
    const [value, setValue] = useState('ALL');
    return (
      <ActionBar aria-label="Demo">
        <ActionBarGroup>
          <ActionBarSelect<MethodSelectOption>
            value={value}
            onValueChange={setValue}
            options={METHOD_OPTIONS}
            icon={<Code size={14} />}
            aria-label="Filter by HTTP method"
            renderItem={renderMethodOption}
          />
        </ActionBarGroup>
      </ActionBar>
    );
  },
};

const STATUS_OPTIONS: StatusSelectOption[] = [
  { value: 'All', label: 'All Status' },
  { value: '2xx', label: '2xx Success', range: '2xx' },
  { value: '3xx', label: '3xx Redirect', range: '3xx' },
  { value: '4xx', label: '4xx Client Error', range: '4xx' },
  { value: '5xx', label: '5xx Server Error', range: '5xx' },
];

/**
 * Status code select with colored dots.
 * Each status range shows a colored dot indicator.
 */
export const ActionBarSelectStatus: Story = {
  args: {
    children: null,
  },
  render: function ActionBarSelectStatusStory() {
    const [value, setValue] = useState('All');
    return (
      <ActionBar aria-label="Demo">
        <ActionBarGroup>
          <ActionBarSelect<StatusSelectOption>
            value={value}
            onValueChange={setValue}
            options={STATUS_OPTIONS}
            icon={<CheckCircle size={14} />}
            aria-label="Filter by status code"
            renderItem={renderStatusOption}
          />
        </ActionBarGroup>
      </ActionBar>
    );
  },
};

const INTELLIGENCE_OPTIONS: IntelligenceSelectOption[] = [
  { value: 'All', label: 'All' },
  { value: 'verified', label: 'Verified', signal: 'verified' },
  { value: 'drift', label: 'Has Drift', signal: 'drift' },
  { value: 'ai', label: 'AI Generated', signal: 'ai' },
  { value: 'bound', label: 'Bound to Spec', signal: 'bound' },
];

/**
 * Intelligence signal select with colored dots.
 * Shows signal type indicators matching the app's signal system.
 */
export const ActionBarSelectIntelligence: Story = {
  args: {
    children: null,
  },
  render: function ActionBarSelectIntelligenceStory() {
    const [value, setValue] = useState('All');
    return (
      <ActionBar aria-label="Demo">
        <ActionBarGroup>
          <ActionBarSelect<IntelligenceSelectOption>
            value={value}
            onValueChange={setValue}
            options={INTELLIGENCE_OPTIONS}
            icon={<Brain size={14} />}
            aria-label="Filter by intelligence signal"
            renderItem={renderIntelligenceOption}
          />
        </ActionBarGroup>
      </ActionBar>
    );
  },
};

/**
 * All colored selects together, showing how they work in a filter bar.
 */
export const ActionBarSelectNetworkHistoryFilters: Story = {
  args: {
    children: null,
  },
  render: function ActionBarSelectNetworkHistoryFiltersStory() {
    const [method, setMethod] = useState('ALL');
    const [status, setStatus] = useState('All');
    const [intelligence, setIntelligence] = useState('All');

    return (
      <ActionBar aria-label="Network history filters">
        <ActionBarGroup>
          <ActionBarSelect
            value={method}
            onValueChange={setMethod}
            options={METHOD_OPTIONS}
            icon={<Code size={14} />}
            aria-label="Filter by HTTP method"
            renderItem={renderMethodOption}
          />
          <ActionBarSelect
            value={status}
            onValueChange={setStatus}
            options={STATUS_OPTIONS}
            icon={<CheckCircle size={14} />}
            aria-label="Filter by status code"
            renderItem={renderStatusOption}
          />
          <ActionBarSelect
            value={intelligence}
            onValueChange={setIntelligence}
            options={INTELLIGENCE_OPTIONS}
            icon={<Brain size={14} />}
            aria-label="Filter by intelligence signal"
            renderItem={renderIntelligenceOption}
          />
        </ActionBarGroup>
      </ActionBar>
    );
  },
};
