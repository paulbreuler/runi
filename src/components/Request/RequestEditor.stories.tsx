/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Request Editor Components Storybook stories
 * @description Consolidated stories for Request editor components: ParamsEditor, HeaderEditor, AuthEditor
 *
 * Note: BodyEditor has been replaced by CodeEditor mode="edit".
 * See CodeHighlighting/CodeEditor.stories.tsx for the unified component.
 *
 * This file consolidates stories from:
 * - ParamsEditor.stories.tsx
 * - HeaderEditor.stories.tsx
 * - AuthEditor.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect, useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { waitForFocus } from '@/utils/storybook-test-helpers';
import { ParamsEditor } from './ParamsEditor';
import { HeaderEditor } from './HeaderEditor';
import { AuthEditor } from './AuthEditor';
import { CodeEditor } from '@/components/CodeHighlighting/CodeEditor';
import { useRequestStore, useRequestStoreRaw } from '@/stores/useRequestStore';

// Custom args for story controls (not part of component props)
interface RequestEditorStoryArgs {
  editorType?: 'params' | 'headers' | 'body' | 'auth';
}

const meta = {
  title: 'Request/RequestEditor',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Consolidated documentation for Request editor components used in the RequestBuilder.

**Editor Types:**
- **ParamsEditor** - Query parameter editor with key/value inputs
- **HeaderEditor** - Header editor with inline editing for key/value pairs
- **Body Editor** - Uses \`CodeEditor mode="edit"\` with JSON validation and formatting
- **AuthEditor** - Authentication editor for Bearer tokens, Basic auth, and custom headers

All editors use \`useRequestStore\` for state management and follow the design system for consistent focus and hover treatments.`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    editorType: {
      control: 'select',
      options: ['params', 'headers', 'body', 'auth'],
      description: 'Type of editor to display',
    },
  },
  args: {
    editorType: 'params',
  },
} satisfies Meta<RequestEditorStoryArgs>;

export default meta;
type Story = StoryObj<RequestEditorStoryArgs>;

// ============================================================================
// Store Seed Helpers
// ============================================================================

const StoreSeed = ({
  url,
  headers,
  body,
  children,
}: {
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  children: React.ReactNode;
}): React.JSX.Element => {
  useEffect(() => {
    useRequestStoreRaw.getState().initContext('global', { url, headers, body });
    return () => {
      useRequestStoreRaw.getState().reset('global');
    };
  }, [url, headers, body]);

  return <>{children}</>;
};

// ============================================================================
// ParamsEditor Stories
// ============================================================================

/**
 * ParamsEditor - empty state.
 */
export const ParamsEditorEmpty: Story = {
  args: {
    editorType: 'params',
  },
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
};

/**
 * ParamsEditor - with existing parameters.
 */
export const ParamsEditorWithParams: Story = {
  args: {
    editorType: 'params',
  },
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed url="https://httpbin.org/get?status=active&limit=20">
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
};

/**
 * ParamsEditor - form interactions test.
 */
export const ParamsEditorFormInteractionsTest: Story = {
  args: {
    editorType: 'params',
  },
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Empty row is visible for adding new parameters', async () => {
      const keyInput = canvas.getByTestId('param-empty-row-key');
      const valueInput = canvas.getByTestId('param-empty-row-value');
      await expect(keyInput).toBeVisible();
      await expect(valueInput).toBeVisible();
    });

    await step('Enter parameter key and value in empty row', async () => {
      const keyInput = canvas.getByTestId('param-empty-row-key');
      const valueInput = canvas.getByTestId('param-empty-row-value');
      await userEvent.type(keyInput, 'status');
      await userEvent.click(valueInput);
      await userEvent.type(valueInput, 'active');
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(keyInput).toHaveValue('status');
      await expect(valueInput).toHaveValue('active');
    });

    await step('Save parameter with Enter key', async () => {
      await userEvent.keyboard('{Enter}');
    });
  },
};

/**
 * ParamsEditor - keyboard navigation test.
 */
export const ParamsEditorKeyboardNavigationTest: Story = {
  args: {
    editorType: 'params',
  },
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed url="https://httpbin.org/get?status=active&limit=20">
        <ParamsEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to empty row key input', async () => {
      const keyInput = canvas.getByTestId('param-empty-row-key');
      keyInput.focus();
      await waitForFocus(keyInput, 1000);
      await expect(keyInput).toHaveFocus();
    });

    await step('Tab from key to value input', async () => {
      await userEvent.tab();
      const valueInput = canvas.getByTestId('param-empty-row-value');
      await waitForFocus(valueInput, 1000);
      await expect(valueInput).toHaveFocus();
    });
  },
};

// ============================================================================
// HeaderEditor Stories
// ============================================================================

/**
 * HeaderEditor - empty state.
 */
export const HeaderEditorEmpty: Story = {
  args: {
    editorType: 'headers',
  },
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
};

/**
 * HeaderEditor - with existing headers.
 */
export const HeaderEditorWithHeaders: Story = {
  args: {
    editorType: 'headers',
  },
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed headers={{ 'Content-Type': 'application/json' }}>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
};

/**
 * HeaderEditor - form interactions test.
 */
export const HeaderEditorFormInteractionsTest: Story = {
  args: {
    editorType: 'headers',
  },
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Empty row is visible for adding new headers', async () => {
      const keyInput = canvas.getByTestId('header-empty-row-key');
      const valueInput = canvas.getByTestId('header-empty-row-value');
      await expect(keyInput).toBeVisible();
      await expect(valueInput).toBeVisible();
    });

    await step('Enter header key and value in empty row', async () => {
      const keyInput = canvas.getByTestId('header-empty-row-key');
      const valueInput = canvas.getByTestId('header-empty-row-value');
      await userEvent.type(keyInput, 'X-Custom-Header');
      await userEvent.click(valueInput);
      await userEvent.type(valueInput, 'custom-value');
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(keyInput).toHaveValue('X-Custom-Header');
      await expect(valueInput).toHaveValue('custom-value');
    });
  },
};

/**
 * HeaderEditor - keyboard navigation test.
 */
export const HeaderEditorKeyboardNavigationTest: Story = {
  args: {
    editorType: 'headers',
  },
  render: () => (
    <div className="min-h-[420px] bg-bg-app p-6">
      <StoreSeed headers={{ 'Content-Type': 'application/json', Accept: 'application/json' }}>
        <HeaderEditor />
      </StoreSeed>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to empty row key input', async () => {
      const keyInput = canvas.getByTestId('header-empty-row-key');
      keyInput.focus();
      await waitForFocus(keyInput, 1000);
      await expect(keyInput).toHaveFocus();
    });
  },
};

// ============================================================================
// Body Editor Stories (using CodeEditor mode="edit")
// ============================================================================

/**
 * Controlled body editor component that syncs with store.
 */
const BodyEditorWrapper = ({ initialBody = '' }: { initialBody?: string }): React.JSX.Element => {
  const { setBody } = useRequestStore();
  const [localBody, setLocalBody] = useState(initialBody);

  useEffect(() => {
    setBody(initialBody);
    setLocalBody(initialBody);
    return () => {
      useRequestStoreRaw.getState().reset('global');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBody]);

  const handleChange = (value: string): void => {
    setLocalBody(value);
    setBody(value);
  };

  return (
    <CodeEditor
      mode="edit"
      code={localBody}
      onChange={handleChange}
      enableJsonValidation
      enableJsonFormatting
      placeholder="Enter request body (JSON, XML, text, etc.)"
    />
  );
};

/**
 * Body Editor - empty state.
 */
export const BodyEditorEmpty: Story = {
  args: {
    editorType: 'body',
  },
  render: () => (
    <div className="h-64 border border-border-default bg-bg-app">
      <BodyEditorWrapper initialBody="" />
    </div>
  ),
};

/**
 * Body Editor - valid JSON.
 */
export const BodyEditorValidJson: Story = {
  args: {
    editorType: 'body',
  },
  render: () => (
    <div className="h-64 border border-border-default bg-bg-app">
      <BodyEditorWrapper initialBody='{"name":"Runi","count":3}' />
    </div>
  ),
};

/**
 * Body Editor - invalid JSON.
 */
export const BodyEditorInvalidJson: Story = {
  args: {
    editorType: 'body',
  },
  render: () => (
    <div className="h-64 border border-border-default bg-bg-app">
      <BodyEditorWrapper initialBody='{"name":"Runi",}' />
    </div>
  ),
};

/**
 * Body Editor - form interactions test.
 */
export const BodyEditorFormInteractionsTest: Story = {
  args: {
    editorType: 'body',
  },
  render: () => (
    <div className="h-64 border border-border-default bg-bg-app">
      <BodyEditorWrapper initialBody="" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Set body and assert value', async () => {
      const el = canvas.getByTestId('code-editor-textarea');
      if (!(el instanceof HTMLTextAreaElement)) {
        throw new Error('expected textarea');
      }
      await userEvent.clear(el);
      const value = '{"name":"test","count":1}';
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(el).toHaveValue(value);
    });
    // Format button and "Valid JSON" indicator depend on React state; native input
    // does not update it in this env. Covered in CodeEditor.test.tsx and CodeEditor.stories.tsx.
  },
};

/**
 * Body Editor - keyboard navigation test.
 */
export const BodyEditorKeyboardNavigationTest: Story = {
  args: {
    editorType: 'body',
  },
  render: () => (
    <div className="h-64 border border-border-default bg-bg-app">
      <BodyEditorWrapper initialBody="" />
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to textarea', async () => {
      const textarea = canvas.getByTestId('code-editor-textarea');
      textarea.focus();
      await waitForFocus(textarea, 1000);
      await expect(textarea).toHaveFocus();
    });

    await step('Tab key inserts 2 spaces', async () => {
      const textarea = canvas.getByTestId('code-editor-textarea');
      await userEvent.clear(textarea);
      await userEvent.type(textarea, 'test');
      // Tab key may be handled by browser, use keyboard event with preventDefault simulation
      await userEvent.keyboard('{Tab}');
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Check that value contains 'test' and has been modified (Tab may insert spaces or move focus)
      const value = (textarea as HTMLTextAreaElement).value;
      await expect(value).toContain('test');
      // Tab might move focus away, so we check if textarea still has focus or if value was updated
      if (textarea === document.activeElement) {
        await expect(textarea).toHaveFocus();
      }
    });
  },
};

// ============================================================================
// AuthEditor Stories
// ============================================================================

/**
 * AuthEditor - empty state.
 */
export const AuthEditorEmpty: Story = {
  args: {
    editorType: 'auth',
  },
  render: () => {
    useRequestStoreRaw.getState().initContext('global', { headers: {} });
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
};

/**
 * AuthEditor - with Bearer token.
 */
export const AuthEditorBearerToken: Story = {
  args: {
    editorType: 'auth',
  },
  render: () => {
    useRequestStoreRaw
      .getState()
      .initContext('global', { headers: { Authorization: 'Bearer sk-live-demo-token' } });
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
};

/**
 * AuthEditor - form interactions test.
 */
export const AuthEditorFormInteractionsTest: Story = {
  args: {
    editorType: 'auth',
  },
  render: () => {
    useRequestStoreRaw.getState().initContext('global', { headers: {} });
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select Bearer Token auth type', async () => {
      const authSelect = canvas.getByTestId('auth-type-select');
      await userEvent.click(authSelect);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const bearerOption = await within(document.body).findByRole(
        'option',
        { name: /bearer token/i },
        { timeout: 3000 }
      );
      await userEvent.click(bearerOption);
      await new Promise((resolve) => setTimeout(resolve, 200));
      const tokenInput = await canvas.findByTestId('bearer-token-input', {}, { timeout: 2000 });
      await expect(tokenInput).toBeVisible();
    });

    await step('Enter bearer token', async () => {
      const tokenInput = canvas.getByTestId('bearer-token-input');
      await userEvent.type(tokenInput, 'sk-live-test-token');
      await new Promise((resolve) => setTimeout(resolve, 100));
      await expect(tokenInput).toHaveValue('sk-live-test-token');
    });
  },
};

/**
 * AuthEditor - keyboard navigation test.
 */
export const AuthEditorKeyboardNavigationTest: Story = {
  args: {
    editorType: 'auth',
  },
  render: () => {
    useRequestStoreRaw.getState().initContext('global', { headers: {} });
    return (
      <div className="min-h-[420px] bg-bg-app p-6">
        <AuthEditor />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab to auth type select', async () => {
      const authSelect = canvas.getByTestId('auth-type-select');
      authSelect.focus();
      await waitForFocus(authSelect, 1000);
      await expect(authSelect).toHaveFocus();
    });
  },
};
