/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { SuggestionPanel } from './SuggestionPanel';
import type { Suggestion } from '@/types/generated/Suggestion';

const MOCK_SUGGESTIONS: Suggestion[] = [
  {
    id: 'sug-1',
    suggestionType: 'drift_fix',
    title: 'Schema drift on GET /users',
    description: 'Response includes undocumented field "avatar_url" not present in OpenAPI spec',
    status: 'pending',
    source: 'claude-3.5-sonnet',
    collectionId: 'col-1',
    requestId: 'req-1',
    endpoint: 'GET /users',
    action: 'Update spec to include avatar_url field',
    createdAt: '2026-01-15T10:30:00Z',
    resolvedAt: null,
  },
  {
    id: 'sug-2',
    suggestionType: 'test_gap',
    title: 'Missing authentication tests',
    description: 'The /auth/login endpoint has no test coverage for error responses (401, 403)',
    status: 'pending',
    source: 'claude-3.5-sonnet',
    collectionId: null,
    requestId: null,
    endpoint: 'POST /auth/login',
    action: 'Add Hurl test for authentication error flows',
    createdAt: '2026-01-15T11:00:00Z',
    resolvedAt: null,
  },
  {
    id: 'sug-3',
    suggestionType: 'optimization',
    title: 'N+1 query pattern detected',
    description:
      'GET /teams/{id}/members makes individual requests per member. Consider batch endpoint.',
    status: 'pending',
    source: 'runi-analysis',
    collectionId: 'col-2',
    requestId: null,
    endpoint: 'GET /teams/{id}/members',
    action: 'Create batch endpoint GET /teams/{id}/members?ids=...',
    createdAt: '2026-01-15T12:00:00Z',
    resolvedAt: null,
  },
  {
    id: 'sug-4',
    suggestionType: 'schema_update',
    title: 'Deprecated field still in use',
    description: 'Field "user.email_verified" is marked deprecated but still returned in responses',
    status: 'accepted',
    source: 'claude',
    collectionId: 'col-1',
    requestId: 'req-3',
    endpoint: 'GET /users/{id}',
    action: 'Remove deprecated field from spec',
    createdAt: '2026-01-14T09:00:00Z',
    resolvedAt: '2026-01-15T08:00:00Z',
  },
];

const meta: Meta<typeof SuggestionPanel> = {
  title: 'VigilanceMonitor/SuggestionPanel',
  component: SuggestionPanel,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Vigilance Monitor — AI Suggestion Panel. Displays actionable suggestions from AI analysis including drift fixes, schema updates, test gaps, and optimizations. Cross-context: works regardless of active canvas tab.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360, height: 500, border: '1px solid var(--color-border-subtle)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SuggestionPanel>;

/** Default panel with a mix of pending and resolved suggestions. */
export const Default: Story = {
  args: {
    suggestions: MOCK_SUGGESTIONS,
    onAccept: (id: string): void => {
      console.log('Accept:', id);
    },
    onDismiss: (id: string): void => {
      console.log('Dismiss:', id);
    },
  },
  play: async ({ canvasElement, step }): Promise<void> => {
    const canvas = within(canvasElement);

    await step('Panel renders with header and badge', async () => {
      await expect(canvas.getByTestId('suggestion-panel')).toBeInTheDocument();
      await expect(canvas.getByTestId('suggestion-panel-header')).toBeInTheDocument();
      await expect(canvas.getByTestId('suggestion-count-badge')).toBeInTheDocument();
    });

    await step('Suggestion cards are visible', async () => {
      await expect(canvas.getByTestId('suggestion-card-sug-1')).toBeInTheDocument();
      await expect(canvas.getByTestId('suggestion-card-sug-2')).toBeInTheDocument();
    });

    await step('Accept button is keyboard accessible', async () => {
      const acceptBtn = canvas.getByTestId('suggestion-accept-sug-1');
      acceptBtn.focus();
      await expect(acceptBtn).toHaveFocus();
      await userEvent.keyboard('{Enter}');
    });
  },
};

/** Empty state when no suggestions exist. */
export const Empty: Story = {
  args: {
    suggestions: [],
    onAccept: (): void => {},
    onDismiss: (): void => {},
  },
  play: async ({ canvasElement, step }): Promise<void> => {
    const canvas = within(canvasElement);

    await step('Shows empty state', async () => {
      await expect(canvas.getByTestId('suggestion-empty-state')).toBeInTheDocument();
    });
  },
};
