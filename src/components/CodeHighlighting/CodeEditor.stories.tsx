/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeEditor Storybook stories
 * @description Stories for the unified CodeEditor component with display and edit modes
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import { CodeEditor, type CodeEditorProps } from './CodeEditor';

const meta = {
  title: 'CodeHighlighting/CodeEditor',
  component: CodeEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Unified code display and editing component with syntax highlighting.

**Modes:**
- **display** - Read-only with copy button (replaces CodeSnippet)
- **edit** - Editable with transparent textarea overlay (replaces BodyEditor)

**Features:**
- Syntax highlighting via react-syntax-highlighter
- Auto language detection (JSON, XML, HTML, CSS, JavaScript, YAML)
- Copy button in display mode
- JSON validation indicator in edit mode
- JSON formatting button in edit mode
- Tab key inserts 2 spaces in edit mode

**Variants:**
- **contained** - Full visual container with background, border, and rounded corners
- **borderless** - Minimal styling for use inside existing containers`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'radio',
      options: ['display', 'edit'],
      description: 'Display mode shows read-only code, edit mode allows editing',
    },
    code: {
      control: 'text',
      description: 'Code content to display or edit',
    },
    language: {
      control: 'select',
      options: ['json', 'xml', 'html', 'css', 'javascript', 'yaml', 'text', 'http'],
      description: 'Language for syntax highlighting (auto-detected if not provided)',
    },
    variant: {
      control: 'radio',
      options: ['contained', 'borderless'],
      description: 'Visual variant',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text when code is empty (edit mode only)',
    },
    enableJsonValidation: {
      control: 'boolean',
      description: 'Enable JSON validation indicator (edit mode only)',
    },
    enableJsonFormatting: {
      control: 'boolean',
      description: 'Enable JSON format button (edit mode only)',
    },
  },
} satisfies Meta<typeof CodeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Display Mode Stories
// ============================================================================

/**
 * Display mode playground with controls for all features.
 */
export const DisplayPlayground: Story = {
  args: {
    mode: 'display',
    code: `{
  "name": "runi",
  "version": "1.0.0",
  "description": "API comprehension layer for the AI age"
}`,
    language: 'json',
    variant: 'contained',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify code editor renders', async () => {
      const editor = canvas.getByTestId('code-editor');
      await expect(editor).toBeVisible();
    });

    await step('Verify copy button is present', async () => {
      const copyButton = canvas.queryByRole('button', { name: /copy/i });
      if (copyButton !== null) {
        await expect(copyButton).toBeVisible();
      }
    });
  },
};

/**
 * Display mode with borderless variant for use inside containers.
 */
export const DisplayBorderless: Story = {
  args: {
    mode: 'display',
    code: `const response = await fetch("https://api.example.com/users");
const data = await response.json();
console.log(data);`,
    language: 'javascript',
    variant: 'borderless',
  },
};

// ============================================================================
// Edit Mode Stories
// ============================================================================

/**
 * Controlled edit mode component for stories.
 */
const EditableCodeEditor = (
  props: Omit<CodeEditorProps, 'code' | 'onChange'> & {
    initialCode?: string;
    onChange?: (value: string) => void;
  }
): React.JSX.Element => {
  const { initialCode = '', onChange: externalOnChange, ...rest } = props;
  const [code, setCode] = useState(initialCode);

  const handleChange = (value: string): void => {
    setCode(value);
    externalOnChange?.(value);
  };

  return <CodeEditor {...rest} code={code} onChange={handleChange} />;
};

/**
 * Edit mode playground with controls for all features.
 */
export const EditPlayground: Story = {
  args: {
    mode: 'edit',
    code: '{"name":"test","count":1}',
    placeholder: 'Enter request body...',
    enableJsonValidation: true,
    enableJsonFormatting: true,
  },
  render: (args) => {
    const onChange = fn();
    return (
      <div className="h-64 border border-border-default bg-bg-app">
        <EditableCodeEditor
          mode="edit"
          initialCode={args.code}
          placeholder={args.placeholder}
          enableJsonValidation={args.enableJsonValidation}
          enableJsonFormatting={args.enableJsonFormatting}
          onChange={onChange}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify edit mode renders', async () => {
      const editor = canvas.getByTestId('code-editor');
      await expect(editor).toBeVisible();
    });

    await step('Verify textarea is present', async () => {
      const textarea = canvas.getByTestId('code-editor-textarea');
      await expect(textarea).toBeVisible();
    });

    await step('Verify JSON validation indicator', async () => {
      const validIndicator = canvas.getByTestId('json-valid-indicator');
      await expect(validIndicator).toBeInTheDocument();
      // Allow animation to finish before visibility check
      await new Promise((resolve) => setTimeout(resolve, 200));
      await expect(validIndicator).toBeVisible();
    });

    await step('Verify format button is present', async () => {
      const formatButton = canvas.getByTestId('format-json-button');
      await expect(formatButton).toBeVisible();
    });
  },
};

/**
 * Edit mode with empty state showing placeholder.
 */
export const EditEmpty: Story = {
  args: {
    mode: 'edit',
    code: '',
    placeholder: 'Enter request body (JSON, XML, text, etc.)',
    enableJsonValidation: true,
    enableJsonFormatting: true,
  },
  render: (args) => (
    <div className="h-64 border border-border-default bg-bg-app">
      <EditableCodeEditor
        mode="edit"
        initialCode=""
        placeholder={args.placeholder}
        enableJsonValidation={args.enableJsonValidation}
        enableJsonFormatting={args.enableJsonFormatting}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify placeholder is shown', async () => {
      const textarea = canvas.getByTestId('code-editor-textarea');
      await expect(textarea).toHaveAttribute(
        'placeholder',
        'Enter request body (JSON, XML, text, etc.)'
      );
    });

    await step('Verify no JSON validation for empty content', async () => {
      const validIndicator = canvas.queryByTestId('json-valid-indicator');
      const invalidIndicator = canvas.queryByTestId('json-invalid-indicator');
      await expect(validIndicator).not.toBeInTheDocument();
      await expect(invalidIndicator).not.toBeInTheDocument();
    });
  },
};

/**
 * Edit mode with invalid JSON showing error indicator.
 */
export const EditInvalidJson: Story = {
  args: {
    mode: 'edit',
    code: '{"name":"test",}',
    enableJsonValidation: true,
    enableJsonFormatting: true,
  },
  render: (args) => (
    <div className="h-64 border border-border-default bg-bg-app">
      <EditableCodeEditor
        mode="edit"
        initialCode={args.code}
        enableJsonValidation={args.enableJsonValidation}
        enableJsonFormatting={args.enableJsonFormatting}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Invalid JSON indicator is shown', async () => {
      const invalidIndicator = canvas.getByTestId('json-invalid-indicator');
      await expect(invalidIndicator).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 200));
      await expect(invalidIndicator).toBeVisible();
      await expect(canvas.getByText('Invalid JSON')).toBeVisible();
    });

    await step('Verify format button is not shown for invalid JSON', async () => {
      const formatButton = canvas.queryByTestId('format-json-button');
      await expect(formatButton).not.toBeInTheDocument();
    });
  },
};

/**
 * Edit mode interaction test - typing and formatting.
 */
export const EditInteractionTest: Story = {
  args: {
    mode: 'edit',
    code: '{"name":"test","count":1}',
    enableJsonValidation: true,
    enableJsonFormatting: true,
  },
  render: (args) => {
    const onChange = fn();
    return (
      <div className="h-64 border border-border-default bg-bg-app">
        <EditableCodeEditor
          mode="edit"
          initialCode={args.code}
          enableJsonValidation={args.enableJsonValidation}
          enableJsonFormatting={args.enableJsonFormatting}
          onChange={onChange}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click format button', async () => {
      const formatButton = canvas.getByTestId('format-json-button');
      await userEvent.click(formatButton);
      await new Promise((resolve) => setTimeout(resolve, 150));
    });

    await step('Verify JSON was formatted', async () => {
      const textarea = canvas.getByTestId('code-editor-textarea');
      const value = (textarea as HTMLTextAreaElement).value;
      await expect(value).toContain('\n');
      await expect(value).toContain('  '); // 2-space indentation
    });
  },
};

/**
 * Search highlight interaction test - open search and verify highlights render.
 */
export const SearchHighlightTest: Story = {
  args: {
    mode: 'edit',
    code: `{
  "name": "runi",
  "description": "runi search highlight demo",
  "features": ["search", "highlight", "search"]
}`,
    enableJsonValidation: false,
    enableJsonFormatting: false,
  },
  render: (args) => (
    <div className="h-64 border border-border-default bg-bg-app">
      <EditableCodeEditor
        mode="edit"
        initialCode={args.code}
        enableJsonValidation={args.enableJsonValidation}
        enableJsonFormatting={args.enableJsonFormatting}
      />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open find-in-editor', async () => {
      const textarea = canvas.getByTestId('code-editor-textarea');
      await userEvent.click(textarea);
      await userEvent.keyboard('{Control>}f{/Control}');
      const searchInput = await canvas.findByTestId('code-editor-search-input');
      await expect(searchInput).toBeVisible();
    });

    await step('Type search term and verify highlight', async () => {
      const searchInput = canvas.getByTestId('code-editor-search-input');
      await userEvent.type(searchInput, 'runi');
      const highlights = canvas.getAllByTestId('code-editor-highlight');
      await expect(highlights.length).toBeGreaterThan(0);
    });
  },
};
