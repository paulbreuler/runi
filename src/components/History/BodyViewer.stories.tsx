/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file BodyViewer Storybook stories
 * @description Visual documentation for BodyViewer component
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BodyViewer } from './BodyViewer';

const meta: Meta<typeof BodyViewer> = {
  title: 'History/BodyViewer',
  component: BodyViewer,
  parameters: {
    docs: {
      description: {
        component:
          'Displays formatted JSON body with 2-space indentation. Falls back to displaying raw text if JSON parsing fails. Shows "No body" message for null or empty bodies.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BodyViewer>;

/**
 * Formatted JSON body display.
 */
export const FormattedJSON: Story = {
  args: {
    body: JSON.stringify(
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345',
        },
        hobbies: ['reading', 'coding', 'hiking'],
      },
      null,
      2
    ),
  },
};

/**
 * Compact JSON (single line).
 */
export const CompactJSON: Story = {
  args: {
    body: '{"name":"John","age":30,"email":"john@example.com"}',
  },
};

/**
 * Empty body state.
 */
export const EmptyBody: Story = {
  args: {
    body: null,
  },
};

/**
 * Plain text (non-JSON).
 */
export const PlainText: Story = {
  args: {
    body: 'This is plain text, not JSON',
  },
};

/**
 * Invalid JSON (falls back to raw text).
 */
export const InvalidJSON: Story = {
  args: {
    body: '{invalid json syntax}',
  },
};
