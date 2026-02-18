/**
 * @file DriftActionCard stories
 * @description Storybook stories for the standalone drift action card component.
 */

import { useState, useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { DriftActionCard, type DriftActionCardProps } from './DriftActionCard';
import type { DriftSuggestedAction } from '@/types/generated/DriftSuggestedAction';

const changedActions: DriftSuggestedAction[] = [
  {
    actionType: 'update_spec',
    label: 'Update Spec',
    description: 'Update the spec to match the new version',
  },
  {
    actionType: 'fix_request',
    label: 'Fix Request',
    description: 'Update the request to match the spec',
  },
  {
    actionType: 'ignore',
    label: 'Ignore',
    description: 'Suppress this drift warning',
  },
];

const addedActions: DriftSuggestedAction[] = [
  {
    actionType: 'update_spec',
    label: 'Update Spec',
    description: 'Accept this new endpoint into the spec',
  },
  {
    actionType: 'ignore',
    label: 'Ignore',
    description: 'Suppress this drift warning',
  },
];

const noop = (): void => {
  /* intentionally empty */
};

const defaultArgs: DriftActionCardProps = {
  method: 'GET',
  path: '/users',
  severity: 'warning',
  description: 'Parameters changed: added "limit" query parameter',
  actions: changedActions,
  onAction: noop,
};

const meta = {
  title: 'DriftActionCard',
  component: DriftActionCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `DriftActionCard — Standalone card showing a detected API drift with actionable resolution buttons.

**Features:**
- Displays drift severity (info, warning, breaking) with signal colors
- Action buttons for resolving drift (Update Spec, Fix Request, Ignore)
- Resolved state with visual indicator and disabled actions
- Fully keyboard accessible with ARIA labels

**Architecture:**
- Standalone component, designed for placement in the Vigilance Monitor
- Uses generated types from Rust domain (DriftActionType, DriftSeverity, DriftSuggestedAction)
- Actions trigger the \`resolve_drift\` MCP tool on the backend
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    severity: {
      control: 'select',
      options: ['info', 'warning', 'breaking'],
      description: 'Drift severity level',
    },
    resolved: {
      control: 'boolean',
      description: 'Whether the drift has been resolved',
    },
    method: {
      control: 'text',
      description: 'HTTP method',
    },
    path: {
      control: 'text',
      description: 'URL path',
    },
    description: {
      control: 'text',
      description: 'Drift description',
    },
  },
  args: defaultArgs,
} satisfies Meta<DriftActionCardProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive playground with controls for all props. */
export const Playground: Story = {
  args: defaultArgs,
  render: function PlaygroundStory(args) {
    const [resolved, setResolved] = useState(args.resolved ?? false);

    // Sync resolved state when the Storybook control changes
    useEffect(() => {
      setResolved(args.resolved ?? false);
    }, [args.resolved]);

    return (
      <div className="max-w-lg">
        <DriftActionCard
          {...args}
          resolved={resolved}
          onAction={(actionType): void => {
            setResolved(true);
            args.onAction(actionType);
          }}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify card renders with drift info', async () => {
      await expect(canvas.getByTestId('drift-action-card')).toBeInTheDocument();
      await expect(canvas.getByTestId('drift-method')).toHaveTextContent('GET');
      await expect(canvas.getByTestId('drift-path')).toHaveTextContent('/users');
      await expect(canvas.getByTestId('drift-severity')).toHaveTextContent('warning');
    });

    await step('Verify action buttons are present', async () => {
      await expect(canvas.getByTestId('drift-action-update_spec')).toBeInTheDocument();
      await expect(canvas.getByTestId('drift-action-fix_request')).toBeInTheDocument();
      await expect(canvas.getByTestId('drift-action-ignore')).toBeInTheDocument();
    });

    await step('Tab to first action button', async () => {
      // Anchor focus explicitly on the card rather than relying on tab order
      // from an indeterminate document position
      canvas.getByTestId('drift-action-card').focus();
      await expect(canvas.getByTestId('drift-action-card')).toHaveFocus();
      await userEvent.tab(); // tab from card container to first action button
      const updateBtn = canvas.getByTestId('drift-action-update_spec');
      await expect(updateBtn).toHaveFocus();
    });

    await step('Click Update Spec to resolve', async () => {
      const updateBtn = canvas.getByTestId('drift-action-update_spec');
      await userEvent.click(updateBtn);
      await expect(canvas.getByTestId('drift-resolved-indicator')).toBeInTheDocument();
    });
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive playground. Click an action button to resolve the drift. Use controls to change severity, method, and path.',
      },
    },
  },
};

/** Breaking severity — removed endpoint. */
export const Breaking: Story = {
  args: {
    method: 'DELETE',
    path: '/users/{id}',
    severity: 'breaking',
    description: 'Endpoint removed from spec — consumers may break',
    actions: addedActions,
    onAction: noop,
  },
  render: (args) => (
    <div className="max-w-lg">
      <DriftActionCard {...args} />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify breaking severity', async () => {
      await expect(canvas.getByTestId('drift-severity')).toHaveTextContent('breaking');
      await expect(canvas.getByTestId('drift-method')).toHaveTextContent('DELETE');
    });
  },
};
