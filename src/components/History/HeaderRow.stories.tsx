/**
 * @file HeaderRow Storybook stories
 * @description Visual documentation for HeaderRow component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { HeaderRow } from './HeaderRow';

const meta: Meta<typeof HeaderRow> = {
  title: 'History/HeaderRow',
  component: HeaderRow,
  parameters: {
    docs: {
      description: {
        component:
          'Displays a single HTTP header key-value pair. Header name is shown in accent-blue, value in text-secondary, with proper formatting for readability.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HeaderRow>;

/**
 * Standard header with typical key-value pair.
 */
export const Default: Story = {
  args: {
    name: 'Content-Type',
    value: 'application/json',
  },
};

/**
 * Authorization header with bearer token.
 */
export const Authorization: Story = {
  args: {
    name: 'Authorization',
    value:
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
  },
};

/**
 * Header with long value that wraps.
 */
export const LongValue: Story = {
  args: {
    name: 'X-Custom-Header',
    value:
      'This is a very long header value that will wrap to multiple lines when the container width is constrained',
  },
};

/**
 * Header with short value.
 */
export const ShortValue: Story = {
  args: {
    name: 'X-Request-ID',
    value: 'abc123',
  },
};

/**
 * Header with URL as value.
 */
export const UrlValue: Story = {
  args: {
    name: 'Referer',
    value: 'https://example.com/api/v1/users?page=1&limit=10&sort=name',
  },
};
