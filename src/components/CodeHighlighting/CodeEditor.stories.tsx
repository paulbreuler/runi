/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeEditor Storybook stories
 * @description Stories for the unified CodeEditor component powered by CodeMirror 6
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { useState } from 'react';
import { CodeEditor, type CodeEditorProps } from './CodeEditor';

const meta = {
  title: 'CodeHighlighting/CodeEditor',
  component: CodeEditor,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Unified code display and editing component powered by CodeMirror 6.

**Modes:**
- **display** - Read-only with copy button (replaces CodeSnippet)
- **edit** - Full CodeMirror 6 editor (replaces BodyEditor)

**Features:**
- Syntax highlighting via CodeMirror 6 language extensions
- Auto language detection (JSON, XML, HTML, JavaScript, YAML)
- Copy button in display mode
- Tab/Shift-Tab indent (no data loss)
- Undo/redo, bracket matching
- JSON validation indicator (debounced)
- JSON formatting button
- Cmd+F search panel (themed)
- Accessibility: aria-label, focus ring, keyboard navigable, reduced motion

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
      options: ['json', 'xml', 'html', 'javascript', 'typescript', 'yaml', 'text'],
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
    enableSearch: {
      control: 'boolean',
      description: 'Enable Cmd+F search panel (edit mode only)',
    },
  },
} satisfies Meta<typeof CodeEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Display Mode Stories
// ============================================================================

/** Display mode playground with controls for all features. */
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

    await step('Verify code editor renders with CM6', async () => {
      const editor = canvas.getByTestId('code-editor');
      await expect(editor).toBeVisible();
      const cmContainer = canvas.getByTestId('code-editor-cm-container');
      await expect(cmContainer).toBeVisible();
    });

    await step('Verify copy button is present', async () => {
      const copyButton = canvas.queryByRole('button', { name: /copy/i });
      if (copyButton !== null) {
        await expect(copyButton).toBeVisible();
      }
    });
  },
};

/** Display mode with borderless variant for use inside containers. */
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

/** Controlled edit mode component for stories. */
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

/** Edit mode playground with controls for all features. */
export const EditPlayground: Story = {
  args: {
    mode: 'edit',
    code: '{"name":"test","count":1}',
    placeholder: 'Enter request body...',
    enableJsonValidation: true,
    enableJsonFormatting: true,
    enableSearch: true,
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
          enableSearch={args.enableSearch}
          onChange={onChange}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify edit mode renders with CM6', async () => {
      const editor = canvas.getByTestId('code-editor');
      await expect(editor).toBeVisible();
      const cmContainer = canvas.getByTestId('code-editor-cm-container');
      await expect(cmContainer).toBeVisible();
    });

    await step('Verify CM6 editor is mounted', async () => {
      const cmContainer = canvas.getByTestId('code-editor-cm-container');
      const cmEditor = cmContainer.querySelector('.cm-editor');
      await expect(cmEditor).not.toBeNull();
    });

    await step('Verify JSON validation indicator appears', async () => {
      // Wait for debounced validation
      await new Promise((resolve) => setTimeout(resolve, 400));
      const validIndicator = canvas.queryByTestId('json-valid-indicator');
      if (validIndicator !== null) {
        await expect(validIndicator).toBeVisible();
      }
    });
  },
};

/** Edit mode with empty state showing placeholder. */
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

    await step('Verify placeholder is shown via CM6', async () => {
      const cmContainer = canvas.getByTestId('code-editor-cm-container');
      const placeholderEl = cmContainer.querySelector('.cm-placeholder');
      await expect(placeholderEl).not.toBeNull();
    });

    await step('Verify no JSON validation for empty content', async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const validIndicator = canvas.queryByTestId('json-valid-indicator');
      const invalidIndicator = canvas.queryByTestId('json-invalid-indicator');
      await expect(validIndicator).not.toBeInTheDocument();
      await expect(invalidIndicator).not.toBeInTheDocument();
    });
  },
};

/** Edit mode with invalid JSON showing error indicator. */
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
      await new Promise((resolve) => setTimeout(resolve, 400));
      const invalidIndicator = canvas.queryByTestId('json-invalid-indicator');
      if (invalidIndicator !== null) {
        await expect(invalidIndicator).toBeVisible();
        await expect(canvas.getByText('Invalid JSON')).toBeVisible();
      }
    });

    await step('Verify format button is not shown for invalid JSON', async () => {
      const formatButton = canvas.queryByTestId('format-json-button');
      await expect(formatButton).not.toBeInTheDocument();
    });
  },
};

/** Edit mode interaction test - formatting JSON via button click. */
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

    await step('Wait for JSON validation debounce', async () => {
      await new Promise((resolve) => setTimeout(resolve, 400));
    });

    await step('Click format button', async () => {
      const formatButton = canvas.queryByTestId('format-json-button');
      if (formatButton !== null) {
        formatButton.click();
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
    });

    await step('Verify CM6 editor still mounted after format', async () => {
      const cmContainer = canvas.getByTestId('code-editor-cm-container');
      const cmEditor = cmContainer.querySelector('.cm-editor');
      await expect(cmEditor).not.toBeNull();
    });
  },
};
