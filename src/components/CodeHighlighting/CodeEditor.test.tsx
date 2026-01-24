/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeEditor component tests
 * @description Tests for the unified CodeEditor component in display and edit modes
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CodeEditor } from './CodeEditor';

describe('CodeEditor', () => {
  describe('display mode', () => {
    it('renders code with syntax highlighting', () => {
      render(<CodeEditor mode="display" code="const x = 1;" language="javascript" />);

      expect(screen.getByTestId('code-editor')).toBeInTheDocument();
      expect(screen.getByTestId('code-box')).toBeInTheDocument();
    });

    it('renders copy button with language label', () => {
      render(<CodeEditor mode="display" code="const x = 1;" language="javascript" />);

      expect(screen.getByLabelText('Copy javascript code')).toBeInTheDocument();
    });

    it('applies language attribute', () => {
      render(<CodeEditor mode="display" code="const x = 1;" language="javascript" />);

      const codeElement = screen.getByTestId('code-editor').querySelector('[data-language]');
      expect(codeElement).toHaveAttribute('data-language', 'javascript');
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
      // Container styles are on the outer element
      expect(codeBox).toHaveClass('bg-bg-raised');
      expect(codeBox).toHaveClass('border');
    });

    it('uses borderless variant when specified', () => {
      render(
        <CodeEditor mode="display" code="const x = 1;" language="javascript" variant="borderless" />
      );

      const codeBox = screen.getByTestId('code-box');
      // No container styles on outer element for borderless
      expect(codeBox).not.toHaveClass('bg-bg-raised');
      expect(codeBox).not.toHaveClass('border');
    });

    it('auto-detects JSON language', () => {
      render(<CodeEditor mode="display" code='{"key": "value"}' />);

      const codeElement = screen.getByTestId('code-editor').querySelector('[data-language]');
      expect(codeElement).toHaveAttribute('data-language', 'json');
    });

    it('auto-detects XML language', () => {
      render(<CodeEditor mode="display" code="<note><to>Runi</to></note>" />);

      const codeElement = screen.getByTestId('code-editor').querySelector('[data-language]');
      expect(codeElement).toHaveAttribute('data-language', 'xml');
    });
  });

  describe('edit mode', () => {
    it('renders syntax layer and textarea', () => {
      render(<CodeEditor mode="edit" code='{"name":"Runi"}' />);

      expect(screen.getByTestId('code-editor-syntax-layer')).toBeInTheDocument();
      expect(screen.getByTestId('code-editor-textarea')).toHaveValue('{"name":"Runi"}');
    });

    it('calls onChange when user types', () => {
      const handleChange = vi.fn();
      render(<CodeEditor mode="edit" code="" onChange={handleChange} />);

      const textarea = screen.getByTestId('code-editor-textarea');
      fireEvent.change(textarea, { target: { value: '{"typed":true}' } });

      expect(handleChange).toHaveBeenCalledWith('{"typed":true}');
    });

    it('shows placeholder when empty', () => {
      render(<CodeEditor mode="edit" code="" placeholder="Enter request body..." />);

      const textarea = screen.getByTestId('code-editor-textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Enter request body...');
    });

    it('applies custom className', () => {
      render(<CodeEditor mode="edit" code="" className="custom-class" />);

      expect(screen.getByTestId('code-editor')).toHaveClass('custom-class');
    });

    describe('JSON validation', () => {
      it('does not show validation when disabled', () => {
        render(<CodeEditor mode="edit" code='{"key":"value"}' enableJsonValidation={false} />);

        expect(screen.queryByTestId('json-valid-indicator')).not.toBeInTheDocument();
        expect(screen.queryByTestId('json-invalid-indicator')).not.toBeInTheDocument();
      });

      it('does not show validation for empty code', () => {
        render(<CodeEditor mode="edit" code="" enableJsonValidation />);

        expect(screen.queryByTestId('json-valid-indicator')).not.toBeInTheDocument();
        expect(screen.queryByTestId('json-invalid-indicator')).not.toBeInTheDocument();
      });

      it('shows Valid JSON indicator for valid JSON', () => {
        render(<CodeEditor mode="edit" code='{"valid":true}' enableJsonValidation />);

        expect(screen.getByTestId('json-valid-indicator')).toBeInTheDocument();
        expect(screen.getByText('Valid JSON')).toBeInTheDocument();
      });

      it('shows Invalid JSON indicator for invalid JSON', () => {
        render(<CodeEditor mode="edit" code="{invalid-json" enableJsonValidation />);

        expect(screen.getByTestId('json-invalid-indicator')).toBeInTheDocument();
        expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
      });

      it('shows Invalid JSON for XML content', () => {
        render(<CodeEditor mode="edit" code="<note><to>Runi</to></note>" enableJsonValidation />);

        expect(screen.getByTestId('json-invalid-indicator')).toBeInTheDocument();
      });
    });

    describe('JSON formatting', () => {
      it('does not show format button when disabled', () => {
        render(
          <CodeEditor
            mode="edit"
            code='{"key":"value"}'
            enableJsonValidation
            enableJsonFormatting={false}
          />
        );

        expect(screen.queryByTestId('format-json-button')).not.toBeInTheDocument();
      });

      it('does not show format button for invalid JSON', () => {
        render(
          <CodeEditor mode="edit" code="{invalid json" enableJsonValidation enableJsonFormatting />
        );

        expect(screen.queryByTestId('format-json-button')).not.toBeInTheDocument();
      });

      it('shows format button for valid JSON', () => {
        render(
          <CodeEditor
            mode="edit"
            code='{"key":"value"}'
            enableJsonValidation
            enableJsonFormatting
          />
        );

        expect(screen.getByTestId('format-json-button')).toBeInTheDocument();
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

        const formatButton = screen.getByTestId('format-json-button');
        fireEvent.click(formatButton);

        await waitFor(() => {
          expect(handleChange).toHaveBeenCalled();
          const calls = handleChange.mock.calls;
          expect(calls.length).toBeGreaterThan(0);
          // Get the last call which should have the formatted value
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

        const syntaxLayer = screen.getByTestId('code-editor-syntax-layer');
        const languageDiv = syntaxLayer.querySelector('[data-language]');
        expect(languageDiv).toHaveAttribute('data-language', 'json');
      });

      it('auto-detects XML language', () => {
        render(<CodeEditor mode="edit" code="<note><to>Runi</to></note>" />);

        const syntaxLayer = screen.getByTestId('code-editor-syntax-layer');
        const languageDiv = syntaxLayer.querySelector('[data-language]');
        expect(languageDiv).toHaveAttribute('data-language', 'xml');
      });

      it('uses provided language over auto-detection', () => {
        render(<CodeEditor mode="edit" code='{"key": "value"}' language="text" />);

        const syntaxLayer = screen.getByTestId('code-editor-syntax-layer');
        const languageDiv = syntaxLayer.querySelector('[data-language]');
        expect(languageDiv).toHaveAttribute('data-language', 'text');
      });
    });
  });
});
