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
    onTest: { action: 'test clicked' },
    onCode: { action: 'code clicked' },
    onDocs: { action: 'docs clicked' },
    onSave: { action: 'save clicked' },
    onHistory: { action: 'history clicked' },
    onEnv: { action: 'env clicked' },
    hasResponse: { control: 'boolean' },
    hasUrl: { control: 'boolean' },
    isDirty: { control: 'boolean' },
    historyCount: { control: 'number' },
    envName: { control: 'text' },
  },
} satisfies Meta<typeof ActionButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state with all buttons enabled and no indicators.
 */
export const Default: Story = {
  args: {
    onTest: noop,
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    onEnv: noop,
    hasResponse: true,
    hasUrl: true,
    isDirty: false,
    historyCount: 0,
    envName: undefined,
  },
};

/**
 * Disabled state when no response or URL is available.
 */
export const Disabled: Story = {
  args: {
    onTest: noop,
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    onEnv: noop,
    hasResponse: false,
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
    onTest: noop,
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    onEnv: noop,
    hasResponse: true,
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
    onTest: noop,
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    onEnv: noop,
    hasResponse: true,
    hasUrl: true,
    isDirty: false,
    historyCount: 5,
  },
};

/**
 * With environment name displayed.
 */
export const WithEnvironment: Story = {
  args: {
    onTest: noop,
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    onEnv: noop,
    hasResponse: true,
    hasUrl: true,
    isDirty: false,
    historyCount: 0,
    envName: 'Production',
  },
};

/**
 * Full state with all indicators visible.
 */
export const AllIndicators: Story = {
  args: {
    onTest: noop,
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    onEnv: noop,
    hasResponse: true,
    hasUrl: true,
    isDirty: true,
    historyCount: 12,
    envName: 'Staging',
  },
};

/**
 * Playground with all controls for interactive testing.
 */
export const Playground: Story = {
  args: {
    onTest: noop,
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    onEnv: noop,
    hasResponse: true,
    hasUrl: true,
    isDirty: false,
    historyCount: 0,
    envName: 'Development',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all buttons are present
    const testButton = canvas.getByTestId('action-test');
    const codeButton = canvas.getByTestId('action-code');
    const docsButton = canvas.getByTestId('action-docs');
    const saveButton = canvas.getByTestId('action-save');
    const historyButton = canvas.getByTestId('action-history');
    const envButton = canvas.getByTestId('action-env');

    await expect(testButton).toBeInTheDocument();
    await expect(codeButton).toBeInTheDocument();
    await expect(docsButton).toBeInTheDocument();
    await expect(saveButton).toBeInTheDocument();
    await expect(historyButton).toBeInTheDocument();
    await expect(envButton).toBeInTheDocument();

    // Verify all buttons have aria-labels
    await expect(testButton).toHaveAttribute('aria-label');
    await expect(codeButton).toHaveAttribute('aria-label');
    await expect(docsButton).toHaveAttribute('aria-label');
    await expect(saveButton).toHaveAttribute('aria-label');
    await expect(historyButton).toHaveAttribute('aria-label');
    await expect(envButton).toHaveAttribute('aria-label');
  },
};

/**
 * Keyboard navigation test.
 */
export const KeyboardNavigation: Story = {
  args: {
    onTest: noop,
    onCode: noop,
    onDocs: noop,
    onSave: noop,
    onHistory: noop,
    onEnv: noop,
    hasResponse: true,
    hasUrl: true,
    isDirty: false,
    historyCount: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const testButton = canvas.getByTestId('action-test');

    // Tab to first button and verify focus
    await userEvent.tab();
    await expect(testButton).toHaveFocus();

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

    await userEvent.tab();
    const envButton = canvas.getByTestId('action-env');
    await expect(envButton).toHaveFocus();
  },
};
