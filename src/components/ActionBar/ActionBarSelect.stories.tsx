import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Code, CheckCircle, Brain, Filter } from 'lucide-react';
import { ActionBarSelect } from './ActionBarSelect';
import { ActionBar } from './ActionBar';
import { ActionBarGroup } from './ActionBarGroup';
import {
  renderMethodOption,
  renderStatusOption,
  renderIntelligenceOption,
  type MethodSelectOption,
  type StatusSelectOption,
  type IntelligenceSelectOption,
} from './selectRenderers';

const meta = {
  title: 'Components/ActionBar/ActionBarSelect',
  component: ActionBarSelect,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `A Radix Select wrapper that responds to ActionBar's responsive context.

## Features

- **Responsive modes**: Full, compact, and icon-only display
- **Custom rendering**: Support for \`renderItem\` prop for custom dropdown items
- **Colored options**: Pre-built renderers for methods, status codes, and intelligence signals

## Custom Rendering

Use the \`renderItem\` prop to customize how dropdown items appear:

\`\`\`tsx
<ActionBarSelect
  options={methodOptions}
  renderItem={renderMethodOption}
/>
\`\`\`

Available renderers:
- \`renderMethodOption\` - HTTP methods with colored badges (GET=blue, POST=green, etc.)
- \`renderStatusOption\` - Status ranges with colored dots (2xx=green, 4xx=orange, etc.)
- \`renderIntelligenceOption\` - Intelligence signals with colored dots
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ActionBar aria-label="Demo">
        <ActionBarGroup>
          <Story />
        </ActionBarGroup>
      </ActionBar>
    ),
  ],
} satisfies Meta<typeof ActionBarSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic select without custom rendering.
 */
export const Default: Story = {
  args: {
    value: 'option1',
    onValueChange: (): void => undefined,
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    icon: <Filter size={14} />,
    'aria-label': 'Select an option',
  },
  render: function DefaultStory(args) {
    const [value, setValue] = useState(args.value);
    return <ActionBarSelect {...args} value={value} onValueChange={setValue} />;
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
export const MethodSelect: Story = {
  args: {
    value: 'ALL',
    onValueChange: (): void => undefined,
    options: METHOD_OPTIONS,
    icon: <Code size={14} />,
    'aria-label': 'Filter by HTTP method',
  },
  render: function MethodSelectStory() {
    const [value, setValue] = useState('ALL');
    return (
      <ActionBarSelect<MethodSelectOption>
        value={value}
        onValueChange={setValue}
        options={METHOD_OPTIONS}
        icon={<Code size={14} />}
        aria-label="Filter by HTTP method"
        renderItem={renderMethodOption}
      />
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
export const StatusSelect: Story = {
  args: {
    value: 'All',
    onValueChange: (): void => undefined,
    options: STATUS_OPTIONS,
    icon: <CheckCircle size={14} />,
    'aria-label': 'Filter by status code',
  },
  render: function StatusSelectStory() {
    const [value, setValue] = useState('All');
    return (
      <ActionBarSelect<StatusSelectOption>
        value={value}
        onValueChange={setValue}
        options={STATUS_OPTIONS}
        icon={<CheckCircle size={14} />}
        aria-label="Filter by status code"
        renderItem={renderStatusOption}
      />
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
export const IntelligenceSelect: Story = {
  args: {
    value: 'All',
    onValueChange: (): void => undefined,
    options: INTELLIGENCE_OPTIONS,
    icon: <Brain size={14} />,
    'aria-label': 'Filter by intelligence signal',
  },
  render: function IntelligenceSelectStory() {
    const [value, setValue] = useState('All');
    return (
      <ActionBarSelect<IntelligenceSelectOption>
        value={value}
        onValueChange={setValue}
        options={INTELLIGENCE_OPTIONS}
        icon={<Brain size={14} />}
        aria-label="Filter by intelligence signal"
        renderItem={renderIntelligenceOption}
      />
    );
  },
};

/**
 * All colored selects together, showing how they work in a filter bar.
 */
export const NetworkHistoryFilters: Story = {
  args: {
    value: 'ALL',
    onValueChange: (): void => undefined,
    options: [],
    icon: <Filter size={14} />,
    'aria-label': 'Demo',
  },
  render: function NetworkHistoryFiltersStory() {
    const [method, setMethod] = useState('ALL');
    const [status, setStatus] = useState('All');
    const [intelligence, setIntelligence] = useState('All');

    return (
      <div className="flex items-center gap-2">
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
      </div>
    );
  },
};
