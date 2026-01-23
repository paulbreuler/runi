/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useState } from 'react';
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
import { Button } from '../ui/button';

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
| \`ActionBarSelect\` | Radix Select wrapper with icon mode |
| \`ActionBarCompositeButton\` | Split button with dropdown menu |

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
 * Demonstrates segmented log level filter with badges.
 */
export const ConsolePanelToolbar: Story = {
  args: {
    children: null,
  },
  render: function ConsoleToolbarExample() {
    const [filter, setFilter] = useState<string>('all');
    const [correlationId, setCorrelationId] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);

    // Simulated log counts
    const counts = { error: 3, warn: 7, info: 24, debug: 156 };
    const total = counts.error + counts.warn + counts.info + counts.debug;

    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Console toolbar with log level segment and correlation ID search.
        </p>
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
                },
                {
                  value: 'debug',
                  label: 'Debug',
                  icon: <Terminal size={12} className="text-text-muted" />,
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
