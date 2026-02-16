/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeEditor component tests
 * @description Tests for the unified CodeEditor component powered by CodeMirror 6
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EditorView } from '@codemirror/view';
import { CodeEditor } from './CodeEditor';

/** Helper: get the CM6 EditorView from the container test-id */
const getCmContent = (): HTMLElement | null =>
  screen.getByTestId('code-editor-cm-container').querySelector('.cm-content');

describe('CodeEditor', () => {
  describe('display mode', () => {
    it('renders code with CM6', () => {
      render(<CodeEditor mode="display" code="const x = 1;" language="javascript" />);

      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
      expect(screen.getByTestId('code-box')).toBeInTheDocument();
      expect(screen.getByTestId('code-editor-cm-container')).toBeInTheDocument();
    });

    it('renders copy button with language label', () => {
      render(<CodeEditor mode="display" code="const x = 1;" language="javascript" />);

      expect(screen.getByLabelText('Copy javascript code')).toBeInTheDocument();
    });

    it('applies language attribute', () => {
      render(<CodeEditor mode="display" code="const x = 1;" language="javascript" />);

      const container = screen.getByTestId('code-editor-cm-container');
      expect(container).toHaveAttribute('data-language', 'javascript');
    });

    it('applies custom className', () => {
      render(
        <CodeEditor
          mode="display"
          code="const x = 1;"
          language="javascript"
          className="custom-class"
        />
      );

      expect(screen.getByTestId('code-editor')).toHaveClass('custom-class');
    });

    it('uses contained variant by default', () => {
      render(<CodeEditor mode="display" code="const x = 1;" language="javascript" />);

      const codeBox = screen.getByTestId('code-box');
      expect(codeBox).toHaveClass('bg-bg-raised');
      expect(codeBox).toHaveClass('border');
    });

    it('uses borderless variant when specified', () => {
      render(
        <CodeEditor mode="display" code="const x = 1;" language="javascript" variant="borderless" />
      );

      const codeBox = screen.getByTestId('code-box');
      expect(codeBox).not.toHaveClass('bg-bg-raised');
      expect(codeBox).not.toHaveClass('border');
    });

    it('auto-detects JSON language', () => {
      render(<CodeEditor mode="display" code='{"key": "value"}' />);

      const container = screen.getByTestId('code-editor-cm-container');
      expect(container).toHaveAttribute('data-language', 'json');
    });

    it('auto-detects XML language', () => {
      render(<CodeEditor mode="display" code="<note><to>Runi</to></note>" />);

      const container = screen.getByTestId('code-editor-cm-container');
      expect(container).toHaveAttribute('data-language', 'xml');
    });

    it('sets content as readOnly', () => {
      render(<CodeEditor mode="display" code="readonly content" language="text" />);

      const cmContainer = screen.getByTestId('code-editor-cm-container');
      const cmEditor = cmContainer.querySelector('.cm-editor');
      expect(cmEditor).not.toBeNull();
      // CM6 content should contain the text
      const cmContent = cmContainer.querySelector('.cm-content');
      expect(cmContent?.textContent).toContain('readonly content');
    });
  });

  describe('edit mode', () => {
    it('renders CM6 editor container', () => {
      render(<CodeEditor mode="edit" code='{"name":"Runi"}' />);

      expect(screen.getByTestId('code-editor-cm-container')).toBeInTheDocument();
      const cmContent = getCmContent();
      expect(cmContent).not.toBeNull();
    });

    it('renders code content in the editor', () => {
      render(<CodeEditor mode="edit" code='{"name":"Runi"}' />);

      const cmContent = getCmContent();
      expect(cmContent?.textContent).toContain('"name"');
      expect(cmContent?.textContent).toContain('"Runi"');
    });

    it('calls onChange when user types', () => {
      const handleChange = vi.fn();
      render(<CodeEditor mode="edit" code="" onChange={handleChange} />);

      // Get the CM6 EditorView and simulate a user edit via dispatch
      const cmContainer = screen.getByTestId('code-editor-cm-container');
      const cmEditor = cmContainer.querySelector<HTMLElement>('.cm-editor');
      expect(cmEditor).not.toBeNull();

      // Access the EditorView through CM6's internals
      const view = EditorView.findFromDOM(cmEditor!);
      expect(view).not.toBeNull();

      act(() => {
        view!.dispatch({
          changes: { from: 0, insert: '{"typed":true}' },
        });
      });

      expect(handleChange).toHaveBeenCalledWith('{"typed":true}');
    });

    it('shows placeholder when empty', () => {
      render(<CodeEditor mode="edit" code="" placeholder="Enter request body..." />);

      const cmContainer = screen.getByTestId('code-editor-cm-container');
      const placeholderEl = cmContainer.querySelector('.cm-placeholder');
      expect(placeholderEl).not.toBeNull();
      expect(placeholderEl?.textContent).toBe('Enter request body...');
    });

    it('applies custom className', () => {
      render(<CodeEditor mode="edit" code="" className="custom-class" />);

      expect(screen.getByTestId('code-editor')).toHaveClass('custom-class');
    });

    it('exposes EditorView via editorRef', () => {
      const editorRef = { current: null as EditorView | null };
      render(<CodeEditor mode="edit" code="test" editorRef={editorRef} />);

      expect(editorRef.current).toBeInstanceOf(EditorView);
      expect(editorRef.current?.state.doc.toString()).toBe('test');
    });

    it('applies aria-label to content', () => {
      render(<CodeEditor mode="edit" code="test" aria-label="Request body editor" />);

      const cmContent = getCmContent();
      expect(cmContent).toHaveAttribute('aria-label', 'Request body editor');
    });

    describe('JSON validation', () => {
      it('does not show validation when disabled', () => {
        render(<CodeEditor mode="edit" code='{"key":"value"}' enableJsonValidation={false} />);

        expect(screen.queryByTestId('json-valid-indicator')).not.toBeInTheDocument();
        expect(screen.queryByTestId('json-invalid-indicator')).not.toBeInTheDocument();
      });

      it('does not show validation for empty code', async () => {
        render(<CodeEditor mode="edit" code="" enableJsonValidation />);

        // Wait for debounce
        await act(async () => {
          await new Promise((r) => setTimeout(r, 350));
        });

        expect(screen.queryByTestId('json-valid-indicator')).not.toBeInTheDocument();
        expect(screen.queryByTestId('json-invalid-indicator')).not.toBeInTheDocument();
      });

      it('shows Valid JSON indicator for valid JSON after debounce', async () => {
        render(<CodeEditor mode="edit" code='{"valid":true}' enableJsonValidation />);

        await waitFor(() => {
          expect(screen.getByTestId('json-valid-indicator')).toBeInTheDocument();
        });
        expect(screen.getByText('Valid JSON')).toBeInTheDocument();
      });

      it('shows Invalid JSON indicator for invalid JSON after debounce', async () => {
        render(<CodeEditor mode="edit" code="{invalid-json" enableJsonValidation />);

        await waitFor(() => {
          expect(screen.getByTestId('json-invalid-indicator')).toBeInTheDocument();
        });
        expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      });

      it('shows Invalid JSON for XML content', async () => {
        render(<CodeEditor mode="edit" code="<note><to>Runi</to></note>" enableJsonValidation />);

        await waitFor(() => {
          expect(screen.getByTestId('json-invalid-indicator')).toBeInTheDocument();
        });
      });
    });

    describe('JSON formatting', () => {
      it('does not show format button when disabled', async () => {
        render(
          <CodeEditor
            mode="edit"
            code='{"key":"value"}'
            enableJsonValidation
            enableJsonFormatting={false}
          />
        );

        await waitFor(() => {
          expect(screen.getByTestId('json-valid-indicator')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('format-json-button')).not.toBeInTheDocument();
      });

      it('does not show format button for invalid JSON', async () => {
        render(
          <CodeEditor mode="edit" code="{invalid json" enableJsonValidation enableJsonFormatting />
        );

        await waitFor(() => {
          expect(screen.getByTestId('json-invalid-indicator')).toBeInTheDocument();
        });
        expect(screen.queryByTestId('format-json-button')).not.toBeInTheDocument();
      });

      it('shows format button for valid JSON', async () => {
        render(
          <CodeEditor
            mode="edit"
            code='{"key":"value"}'
            enableJsonValidation
            enableJsonFormatting
          />
        );

        await waitFor(() => {
          expect(screen.getByTestId('format-json-button')).toBeInTheDocument();
        });
      });

      it('formats JSON when format button is clicked', async () => {
        const handleChange = vi.fn();
        render(
          <CodeEditor
            mode="edit"
            code='{"key":"value","nested":{"a":1}}'
            onChange={handleChange}
            enableJsonValidation
            enableJsonFormatting
          />
        );

        await waitFor(() => {
          expect(screen.getByTestId('format-json-button')).toBeInTheDocument();
        });

        const formatButton = screen.getByTestId('format-json-button');
        fireEvent.click(formatButton);

        await waitFor(() => {
          expect(handleChange).toHaveBeenCalled();
          const calls = handleChange.mock.calls;
          expect(calls.length).toBeGreaterThan(0);
          const lastCall = calls[calls.length - 1] as [string];
          const formattedValue = lastCall[0];
          expect(formattedValue).toContain('\n');
          expect(formattedValue).toContain('  '); // 2-space indentation
        });
      });
    });

    describe('language detection', () => {
      it('auto-detects JSON language', () => {
        render(<CodeEditor mode="edit" code='{"key": "value"}' />);

        const container = screen.getByTestId('code-editor-cm-container');
        expect(container).toHaveAttribute('data-language', 'json');
      });

      it('auto-detects XML language', () => {
        render(<CodeEditor mode="edit" code="<note><to>Runi</to></note>" />);

        const container = screen.getByTestId('code-editor-cm-container');
        expect(container).toHaveAttribute('data-language', 'xml');
      });

      it('uses provided language over auto-detection', () => {
        render(<CodeEditor mode="edit" code='{"key": "value"}' language="text" />);

        const container = screen.getByTestId('code-editor-cm-container');
        expect(container).toHaveAttribute('data-language', 'text');
      });
    });

    describe('variant', () => {
      it('applies contained variant styles', () => {
        render(<CodeEditor mode="edit" code="test" variant="contained" />);

        const editor = screen.getByTestId('code-editor');
        expect(editor).toHaveClass('bg-bg-raised');
        expect(editor).toHaveClass('border');
      });

      it('does not apply contained styles for borderless variant', () => {
        render(<CodeEditor mode="edit" code="test" variant="borderless" />);

        const editor = screen.getByTestId('code-editor');
        expect(editor).not.toHaveClass('bg-bg-raised');
      });
    });
  });
});
