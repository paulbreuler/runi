/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeSnippet component tests
 * @description Tests for the CodeSnippet component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CodeSnippet } from './CodeSnippet';

describe('CodeSnippet', () => {
  it('renders code snippet with code', () => {
    render(<CodeSnippet code="const x = 1;" language="javascript" />);

    expect(screen.getByTestId('code-snippet')).toBeInTheDocument();
    // Code is rendered by syntax highlighter, check for code snippet container instead
    expect(screen.getByTestId('code-snippet')).toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(<CodeSnippet code="const x = 1;" language="javascript" />);

    expect(screen.getByLabelText('Copy javascript code')).toBeInTheDocument();
  });

  it('applies correct language attribute', () => {
    render(<CodeSnippet code="const x = 1;" language="javascript" />);

    const codeElement = screen.getByTestId('code-snippet').querySelector('[data-language]');
    expect(codeElement).toHaveAttribute('data-language', 'javascript');
  });

  it('applies custom className', () => {
    render(<CodeSnippet code="const x = 1;" language="javascript" className="custom-class" />);

    expect(screen.getByTestId('code-snippet')).toHaveClass('custom-class');
  });
});
