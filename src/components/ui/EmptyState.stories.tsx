import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from '@storybook/test';
import { EmptyState } from './EmptyState';
import { Key, Search, Inbox, FileText, Network } from 'lucide-react';
import { Button } from './button';
import { tabToElement, waitForFocus } from '@/utils/storybook-test-helpers';

type Story = StoryObj<typeof meta>;

const meta = {
  title: 'Components/UI/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Unified empty state component for consistent empty states across the application.

## Features

- **Variants**: muted (subtle), prominent (full-featured), minimal (visual placeholder)
- **Sizes**: sm, md (default), lg
- **Accessibility**: Full ARIA support, semantic HTML, reduced motion
- **Animations**: Smooth Apple-inspired Motion animations
- **Flexible**: Supports icons, actions, custom content via children

## Design Philosophy

Follows runi's zen, calm, book-like design with muted surfaces and soft contrast. Color is used as a signal, not decoration.`,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;

/**
 * Default empty state with title only.
 * Basic usage for simple empty states.
 */
export const Default: Story = {
  args: {
    title: 'No items found',
  },
  render: (args) => (
    <div className="min-h-[300px] w-[500px] bg-bg-app p-6">
      <EmptyState {...args} />
    </div>
  ),
};

/**
 * Empty state with title and description.
 * Provides helpful context to users.
 */
export const WithDescription: Story = {
  args: {
    title: 'No items found',
    description: 'Try adjusting your filters or create a new item to get started.',
  },
  render: (args) => (
    <div className="min-h-[300px] w-[500px] bg-bg-app p-6">
      <EmptyState {...args} />
    </div>
  ),
};

/**
 * Empty state with icon, title, and description.
 * Icon adds visual interest and helps communicate the state.
 */
export const WithIcon: Story = {
  args: {
    title: 'No search results',
    description: 'Try different keywords or adjust your search filters.',
    icon: <Search className="text-text-muted/50" />,
  },
  render: (args) => (
    <div className="min-h-[400px] w-[500px] bg-bg-app p-6">
      <EmptyState {...args} />
    </div>
  ),
};

/**
 * Empty state with action button.
 * Provides a clear call-to-action for users.
 */
export const WithAction: Story = {
  args: {
    title: 'No items found',
    description: 'Get started by creating your first item.',
    icon: <Inbox className="text-text-muted/50" />,
    action: <Button>Create Item</Button>,
  },
  render: (args) => (
    <div className="min-h-[400px] w-[500px] bg-bg-app p-6">
      <EmptyState {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const actionButton = canvas.getByRole('button', { name: /create item/i });

    await step('Action button is visible and clickable', async () => {
      await expect(actionButton).toBeVisible();
      await userEvent.click(actionButton);
      await expect(actionButton).toBeVisible();
    });

    await step('Keyboard navigation works', async () => {
      await tabToElement(actionButton);
      await waitForFocus(actionButton);
      await expect(actionButton).toHaveFocus();
    });
  },
};

/**
 * Muted variant - subtle empty state.
 * Used in request editors and compact spaces.
 */
export const Muted: Story = {
  args: {
    variant: 'muted',
    title: 'No query parameters',
    description: 'Add parameters to append to the URL',
  },
  render: (args) => (
    <div className="min-h-[300px] w-[500px] bg-bg-app p-6">
      <EmptyState {...args} />
    </div>
  ),
};

/**
 * Prominent variant - full-featured empty state.
 * Default variant with icon, title, description, and action.
 */
export const Prominent: Story = {
  args: {
    variant: 'prominent',
    title: 'No requests yet',
    description:
      'Send your first request to see it appear here with full response details, headers, and timing information.',
    icon: <Network className="text-text-muted/50" />,
    action: <Button>Send Request</Button>,
  },
  render: (args) => (
    <div className="min-h-[500px] w-[600px] bg-bg-app p-6">
      <EmptyState {...args} />
    </div>
  ),
};

/**
 * Minimal variant - visual placeholder only.
 * For non-user-facing states or loading placeholders.
 */
export const Minimal: Story = {
  args: {
    variant: 'minimal',
    title: '', // Minimal variant doesn't require title, but prop is required
    children: <div className="w-full h-2 bg-bg-raised rounded-full" />,
  },
  render: (args) => (
    <div className="min-h-[100px] w-[500px] bg-bg-app p-6">
      <EmptyState {...args} />
    </div>
  ),
};

/**
 * Size variants - sm, md, lg.
 * Different sizes for different contexts.
 */
export const Sizes: Story = {
  args: {
    title: 'Size Variants',
  },
  render: () => (
    <div className="space-y-12 min-h-[800px] w-[600px] bg-bg-app p-6">
      <div>
        <h3 className="text-sm font-medium text-text-muted mb-4">Small (sm)</h3>
        <EmptyState
          size="sm"
          title="Small empty state"
          description="Compact size for tight spaces"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-text-muted mb-4">Medium (md) - Default</h3>
        <EmptyState
          size="md"
          title="Medium empty state"
          description="Default size for most use cases"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-text-muted mb-4">Large (lg)</h3>
        <EmptyState
          size="lg"
          title="Large empty state"
          description="Hero size for prominent empty states"
          icon={<FileText className="text-text-muted/50" />}
        />
      </div>
    </div>
  ),
};

/**
 * Real-world example: ParamsEditor empty state.
 * Muted variant used in request parameter editor.
 */
export const ParamsEditorExample: Story = {
  args: {
    variant: 'muted',
    title: 'No query parameters',
    description: 'Add parameters to append to the URL',
  },
  render: () => (
    <div className="min-h-[300px] w-[500px] bg-bg-app p-6">
      <EmptyState
        variant="muted"
        title="No query parameters"
        description="Add parameters to append to the URL"
      />
    </div>
  ),
};

/**
 * Real-world example: HeaderEditor empty state.
 * Muted variant used in request header editor.
 */
export const HeaderEditorExample: Story = {
  args: {
    variant: 'muted',
    title: 'No headers configured',
    description: 'Add headers to customize your request',
  },
  render: () => (
    <div className="min-h-[300px] w-[500px] bg-bg-app p-6">
      <EmptyState
        variant="muted"
        title="No headers configured"
        description="Add headers to customize your request"
      />
    </div>
  ),
};

/**
 * Real-world example: AuthEditor empty state.
 * Prominent variant with icon for authentication editor.
 */
export const AuthEditorExample: Story = {
  args: {
    variant: 'prominent',
    icon: <Key className="text-text-muted/25" strokeWidth={1} />,
    title: 'No authentication configured',
    description: 'Select an authentication type above to get started',
  },
  render: () => (
    <div className="min-h-[400px] w-[500px] bg-bg-app p-6">
      <EmptyState
        variant="prominent"
        icon={<Key className="text-text-muted/25" strokeWidth={1} />}
        title="No authentication configured"
        description="Select an authentication type above to get started"
      />
    </div>
  ),
};

/**
 * Real-world example: NetworkHistoryPanel empty state.
 * Muted variant with conditional text for history panel.
 */
export const NetworkHistoryPanelExample: Story = {
  args: {
    variant: 'muted',
    size: 'sm',
    title: 'No requests yet',
  },
  render: () => (
    <div className="min-h-[200px] w-[500px] bg-bg-app p-6">
      <EmptyState variant="muted" size="sm" title="No requests yet" />
    </div>
  ),
};

/**
 * Real-world example: ConsolePanel empty state.
 * Muted variant with dynamic text for console panel.
 */
export const ConsolePanelExample: Story = {
  args: {
    variant: 'muted',
    size: 'sm',
    title: 'No logs (error only)',
  },
  render: () => (
    <div className="min-h-[200px] w-[500px] bg-bg-app p-6">
      <EmptyState variant="muted" size="sm" title="No logs (error only)" />
    </div>
  ),
};

/**
 * Real-world example: HomePage response empty state.
 * Muted variant used in main response viewer.
 */
export const HomePageResponseExample: Story = {
  args: {
    variant: 'muted',
    title: 'Response will appear here',
    description:
      'Send a request to see the response, headers, and timing information displayed in a clear, readable format.',
  },
  render: () => (
    <div className="min-h-[400px] w-[600px] bg-bg-app p-6">
      <EmptyState
        variant="muted"
        title="Response will appear here"
        description="Send a request to see the response, headers, and timing information displayed in a clear, readable format."
      />
    </div>
  ),
};

/**
 * Accessibility example: ARIA live regions.
 * Demonstrates dynamic content announcements.
 */
export const AccessibilityAriaLive: Story = {
  args: {
    title: 'Accessibility Examples',
  },
  render: () => (
    <div className="space-y-8 min-h-[600px] w-[600px] bg-bg-app p-6">
      <div>
        <h3 className="text-sm font-medium text-text-muted mb-4">Polite (default for dynamic)</h3>
        <EmptyState
          title="No matching requests"
          description="This would be announced politely to screen readers"
          ariaLive="polite"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-text-muted mb-4">
          Assertive (for critical updates)
        </h3>
        <EmptyState
          title="Error: No data available"
          description="This would be announced assertively to screen readers"
          ariaLive="assertive"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium text-text-muted mb-4">Off (static content)</h3>
        <EmptyState
          title="No items found"
          description="Static content, no live region needed"
          ariaLive="off"
        />
      </div>
    </div>
  ),
};

/**
 * Accessibility example: Custom heading levels.
 * Demonstrates proper heading hierarchy.
 */
export const AccessibilityHeadingLevels: Story = {
  args: {
    title: 'Heading Level Examples',
  },
  render: () => (
    <div className="space-y-8 min-h-[600px] w-[600px] bg-bg-app p-6">
      <div>
        <h1 className="text-lg font-semibold mb-4">Page Title (h1)</h1>
        <EmptyState
          title="Section Empty State"
          description="Uses h2 to maintain proper hierarchy"
          headingLevel={2}
        />
      </div>
      <div>
        <h2 className="text-base font-semibold mb-4">Subsection (h2)</h2>
        <EmptyState
          title="Subsection Empty State"
          description="Uses h3 to maintain proper hierarchy"
          headingLevel={3}
        />
      </div>
    </div>
  ),
};
