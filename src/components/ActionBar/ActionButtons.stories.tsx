/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { ActionButtons } from './ActionButtons';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const meta = {
  title: 'Components/ActionBar/ActionButtons',
  component: ActionButtons,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Icon button group for common actions. Muted by default with emphasis on hover (Zen aesthetic). Context-aware states with visual indicators.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onCode: { action: 'code clicked' },
    onDocs: { action: 'docs clicked' },
    onSave: { action: 'save clicked' },
    onHistory: { action: 'history clicked' },
    hasUrl: { control: 'boolean' },
    isDirty: { control: 'boolean' },
    historyCount: { control: 'number' },
  },
} satisfies Meta<typeof ActionButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with all buttons enabled and no indicators.
 */
export const Default: Story = {
  args: {
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    hasUrl: true,
    isDirty: false,
    historyCount: 0,
  },
};

/**
 * Disabled state when no URL is available.
 */
export const Disabled: Story = {
  args: {
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    hasUrl: false,
    isDirty: false,
    historyCount: 0,
  },
};

/**
 * With dirty indicator on Save button (unsaved changes).
 */
export const WithDirtyIndicator: Story = {
  args: {
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    hasUrl: true,
    isDirty: true,
    historyCount: 0,
  },
};

/**
 * With history count badge.
 */
export const WithHistoryCount: Story = {
  args: {
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    hasUrl: true,
    isDirty: false,
    historyCount: 5,
  },
};

/**
 * Full state with all indicators visible.
 */
export const AllIndicators: Story = {
  args: {
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    hasUrl: true,
    isDirty: true,
    historyCount: 12,
  },
};

/**
 * Playground with all controls for interactive testing.
 */
export const Playground: Story = {
  args: {
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    hasUrl: true,
    isDirty: false,
    historyCount: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all buttons are present
    const codeButton = canvas.getByTestId('action-code');
    const docsButton = canvas.getByTestId('action-docs');
    const saveButton = canvas.getByTestId('action-save');
    const historyButton = canvas.getByTestId('action-history');

    await expect(codeButton).toBeInTheDocument();
    await expect(docsButton).toBeInTheDocument();
    await expect(saveButton).toBeInTheDocument();
    await expect(historyButton).toBeInTheDocument();

    // Verify all buttons have aria-labels
    await expect(codeButton).toHaveAttribute('aria-label');
    await expect(docsButton).toHaveAttribute('aria-label');
    await expect(saveButton).toHaveAttribute('aria-label');
    await expect(historyButton).toHaveAttribute('aria-label');
  },
};

/**
 * Keyboard navigation test.
 */
export const KeyboardNavigation: Story = {
  args: {
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    hasUrl: true,
    isDirty: false,
    historyCount: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Tab through all buttons
    await userEvent.tab();
    const codeButton = canvas.getByTestId('action-code');
    await expect(codeButton).toHaveFocus();

    await userEvent.tab();
    const docsButton = canvas.getByTestId('action-docs');
    await expect(docsButton).toHaveFocus();

    await userEvent.tab();
    const saveButton = canvas.getByTestId('action-save');
    await expect(saveButton).toHaveFocus();

    await userEvent.tab();
    const historyButton = canvas.getByTestId('action-history');
    await expect(historyButton).toHaveFocus();
  },
};
