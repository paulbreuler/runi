/**
 * @file CodeSnippet Storybook stories
 * @description Visual documentation for CodeSnippet component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { CodeSnippet } from './CodeSnippet';

const meta: Meta<typeof CodeSnippet> = {
  title: 'History/CodeSnippet',
  component: CodeSnippet,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Component for displaying code with syntax highlighting and copy functionality.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CodeSnippet>;

/**
 * Basic code snippet with JavaScript code.
 */
export const Default: Story = {
  args: {
    code: 'const response = await fetch("https://api.example.com/users");\nconst data = await response.json();',
    language: 'javascript',
  },
};

/**
 * Python code snippet.
 */
export const Python: Story = {
  args: {
    code: 'import requests\n\nresponse = requests.get("https://api.example.com/users")\nprint(response.json())',
    language: 'python',
  },
};

/**
 * Go code snippet.
 */
export const Go: Story = {
  args: {
    code: 'package main\n\nimport "net/http"\n\nfunc main() {\n    resp, err := http.Get("https://api.example.com/users")\n    // ...\n}',
    language: 'go',
  },
};

/**
 * cURL command snippet.
 */
export const Curl: Story = {
  args: {
    code: 'curl -X GET \\\n  -H "Authorization: Bearer token123" \\\n  "https://api.example.com/users"',
    language: 'bash',
  },
};
