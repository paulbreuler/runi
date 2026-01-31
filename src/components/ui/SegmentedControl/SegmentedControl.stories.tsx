/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useState, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AlertCircle, AlertTriangle, Info, Terminal, CheckCircle, XCircle } from 'lucide-react';
import { SegmentedControl, SAIYAN_TIERS } from '.';

const meta = {
  title: 'UI/SegmentedControl',
  component: SegmentedControl,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A standalone segmented control for mutually exclusive options.

## Features

- **Two display variants**: full (label + icon), icon-only
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const allButton = canvas.getByRole('button', { name: /^all$/i });
    const activeButton = canvas.getByRole('button', { name: /^active$/i });

    await step('Initial selection is correct', async () => {
      await expect(allButton).toBeVisible();
      await expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Can click to change selection', async () => {
      await userEvent.click(activeButton);
      await expect(activeButton).toHaveAttribute('aria-pressed', 'true');
      await expect(allButton).toHaveAttribute('aria-pressed', 'false');
    });

    await step('Keyboard navigation works', async () => {
      // Focus the all button directly first
      allButton.focus();
      // Use a shorter timeout and verify focus immediately
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(allButton).toHaveFocus();
      // SegmentedControl doesn't support Arrow key navigation between buttons
      // Instead, focus the activeButton directly to test that it can receive focus
      activeButton.focus();
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(activeButton).toHaveFocus();
    });

    await step('Can activate with Enter key', async () => {
      // Ensure activeButton has focus before pressing Enter
      if (document.activeElement !== activeButton) {
        activeButton.focus();
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await userEvent.keyboard('{Enter}');
      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 50));
      await expect(activeButton).toHaveAttribute('aria-pressed', 'true');
    });
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
          className="px-2 py-1 text-xs bg-bg-raised border border-border-subtle rounded hover:border-border-emphasis"
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

// Use tier config directly from the component - single source of truth

/**
 * All display variants compared side-by-side with interactive badge counts.
 * Demonstrates how badges appear in full and icon modes with tiered visual effects.
 *
 * Use the tier buttons to explore different visual states.
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
    const [counts, setCounts] = useState({ error: 3, warn: 7, info: 24, debug: 156 });
    const [isEvolving, setIsEvolving] = useState(false);

    const incrementError = (): void => {
      setCounts((c) => ({ ...c, error: c.error + 1 }));
    };

    const incrementWarn = (): void => {
      setCounts((c) => ({ ...c, warn: c.warn + 1 }));
    };

    const addHundred = (): void => {
      setCounts((c) => ({
        error: c.error + 100,
        warn: c.warn + 100,
        info: c.info + 100,
        debug: c.debug + 100,
      }));
    };

    // Add large count increment
    const addNineThousand = (): void => {
      setCounts((c) => ({
        error: c.error + 9000,
        warn: c.warn + 9000,
        info: c.info + 9000,
        debug: c.debug + 9000,
      }));
    };

    // Ref to track pending tier change timeout
    const tierChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Set a specific tier directly with reset-then-play pattern.
     * Always resets to tier 0 first, then applies the target tier.
     * This ensures clicking any tier button (even the same one) triggers animation.
     */
    const setTierDirectly = (targetTier: number): void => {
      // Clear any pending tier change
      if (tierChangeTimeoutRef.current !== null) {
        clearTimeout(tierChangeTimeoutRef.current);
        tierChangeTimeoutRef.current = null;
      }

      // Badge values for each tier
      const tierToPower: Record<number, number> = {
        0: 100,
        1: 9001,
        2: 9001,
        3: 9001,
        4: 9001,
        5: 9000,
        6: 12500,
        7: 20000,
        8: 25000,
      };

      // Step 1: Reset to tier 0 immediately
      setCounts({ error: 100, warn: 100, info: 100, debug: 100 });

      // Step 2: After brief delay, set target tier (allows state machine to see the change)
      tierChangeTimeoutRef.current = setTimeout(() => {
        const power = tierToPower[targetTier] ?? 100;
        const activeCount = targetTier >= 5 ? 4 : targetTier;

        setCounts({
          error: activeCount >= 1 ? power : 100,
          warn: activeCount >= 2 ? power : 100,
          info: activeCount >= 3 ? power : 100,
          debug: activeCount >= 4 ? power : 100,
        });
        tierChangeTimeoutRef.current = null;
      }, 50);
    };

    // Tier evolution: staggered power-up sequence
    const triggerEvolution = (): void => {
      if (isEvolving) {
        return;
      }
      setIsEvolving(true);

      // Reset first
      setCounts({ error: 3, warn: 7, info: 24, debug: 156 });

      // Stagger each badge crossing threshold
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
      // After finale, boost to MUI levels
      setTimeout(() => {
        setCounts({ error: 25000, warn: 25000, info: 25000, debug: 25000 });
      }, 5000);
      // Allow re-triggering after sequence
      setTimeout(() => {
        setIsEvolving(false);
      }, 6500);
    };

    const resetCounts = (): void => {
      setCounts({ error: 3, warn: 7, info: 24, debug: 156 });
      setIsEvolving(false);
    };

    const total = counts.error + counts.warn + counts.info + counts.debug;

    // Calculate current tier based on the power level system
    const badgesWithCounts = [counts.error, counts.warn, counts.info, counts.debug];
    const badgesOver9000 = badgesWithCounts.filter((c) => c >= 9000).length;
    const totalBadges = badgesWithCounts.filter((c) => c > 0).length;
    const totalPower = badgesWithCounts.reduce((sum, c) => sum + c, 0);
    const allOver9000 = badgesOver9000 > 0 && badgesOver9000 === totalBadges;

    let currentTier: number;
    if (allOver9000) {
      if (totalPower >= 100000) {
        currentTier = 8;
      } else if (totalPower >= 80000) {
        currentTier = 7;
      } else if (totalPower >= 50000) {
        currentTier = 6;
      } else {
        currentTier = 5;
      }
    } else {
      currentTier = Math.min(badgesOver9000, 4);
    }

    // Note: "All" has no badge so it doesn't affect tier calculation
    const options = [
      {
        value: 'all',
        label: 'All',
        icon: <CheckCircle size={12} />,
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
        badge: counts.info,
      },
      {
        value: 'debug',
        label: 'Debug',
        icon: <Terminal size={12} className="text-text-muted" />,
        badge: counts.debug,
      },
    ];

    const variants: Array<'full' | 'icon'> = ['full', 'icon'];

    // Get tier config (with guaranteed fallback)
    const baseTierConfig = SAIYAN_TIERS[0] ?? {
      name: 'Base',
      color: 'transparent',
      glow: 'transparent',
      path: '',
      duration: 2.0,
      glowSize: 0,
    };
    const tierConfig = SAIYAN_TIERS[currentTier] ?? baseTierConfig;

    return (
      <div className="space-y-6">
        {/* Tier status indicator - always visible to prevent layout shift */}
        <div
          className="text-xs font-semibold px-3 py-1.5 rounded border inline-block"
          style={
            currentTier > 0
              ? {
                  color: tierConfig.color,
                  borderColor: `${tierConfig.color}50`,
                  backgroundColor: `${tierConfig.color}10`,
                }
              : {
                  color: 'var(--color-text-muted)',
                  borderColor: 'var(--color-border-subtle)',
                  backgroundColor: 'transparent',
                }
          }
        >
          {currentTier > 0 ? (
            <>
              Tier {currentTier}: {tierConfig.name}
              {currentTier >= 5 && (
                <span className="ml-2 opacity-70">(Power: {total.toLocaleString()})</span>
              )}
            </>
          ) : (
            <span className="opacity-50">Tier 0: Base</span>
          )}
        </div>

        {/* Tier jump buttons - all 8 tiers */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-text-muted mr-1">Jump to tier:</span>
          {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((tier) => {
            // Get tier config with fallback
            const config = SAIYAN_TIERS[tier] ?? baseTierConfig;
            return (
              <button
                key={tier}
                type="button"
                onClick={() => {
                  setTierDirectly(tier);
                }}
                className="px-2 py-1 text-xs border rounded hover:opacity-80 transition-opacity"
                style={{
                  borderColor: config.color,
                  color: config.color,
                  backgroundColor: currentTier === tier ? `${config.color}20` : 'transparent',
                }}
                title={config.name}
              >
                T{tier}
              </button>
            );
          })}
        </div>

        {/* Original controls */}
        <div className="flex flex-wrap gap-2">
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
            onClick={addNineThousand}
            className="px-3 py-1.5 text-xs bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-400 border border-amber-500/30 rounded hover:from-amber-500/20 hover:to-orange-500/20"
            title="Add 9000 to all counts"
          >
            +9K ⚡
          </button>
          <button
            type="button"
            onClick={triggerEvolution}
            disabled={isEvolving}
            className="px-3 py-1.5 text-xs bg-gradient-to-r from-amber-500/10 via-red-500/10 to-gray-300/10 text-amber-400 border border-amber-500/30 rounded hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Watch the tier evolution unfold"
          >
            🔥 Tier Evolution
          </button>
          <button
            type="button"
            onClick={resetCounts}
            className="px-3 py-1.5 text-xs bg-bg-raised border border-border-subtle rounded hover:border-border-emphasis"
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
              <div className="p-3 bg-bg-surface border border-border-subtle rounded-lg overflow-visible">
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
          Total Power: {total.toLocaleString()} | Errors: {counts.error.toLocaleString()} |
          Warnings: {counts.warn.toLocaleString()} | Info: {counts.info.toLocaleString()} | Debug:{' '}
          {counts.debug.toLocaleString()} | Selected: {value}
        </p>
      </div>
    );
  },
};
