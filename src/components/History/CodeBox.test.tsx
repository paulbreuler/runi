/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CodeBox component tests
 * @description Tests for the CodeBox component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeBox } from './CodeBox';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('CodeBox', () => {
  it('renders children content', () => {
    render(
      <CodeBox>
        <pre>
          <code>const x = 1;</code>
        </pre>
      </CodeBox>
    );

    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('shows copy button when copyText is provided', () => {
    render(
      <CodeBox copyText="const x = 1;">
        <pre>
          <code>const x = 1;</code>
        </pre>
      </CodeBox>
    );

    expect(screen.getByLabelText('Copy to clipboard')).toBeInTheDocument();
  });

  it('does not show copy button when copyText is not provided', () => {
    render(
      <CodeBox>
        <pre>
          <code>const x = 1;</code>
        </pre>
      </CodeBox>
    );

    expect(screen.queryByLabelText('Copy to clipboard')).not.toBeInTheDocument();
  });

  it('uses custom copy button label', () => {
    render(
      <CodeBox copyText="const x = 1;" copyButtonLabel="Copy code">
        <pre>
          <code>const x = 1;</code>
        </pre>
      </CodeBox>
    );

    expect(screen.getByLabelText('Copy code')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <CodeBox className="custom-class">
        <pre>
          <code>test</code>
        </pre>
      </CodeBox>
    );

    const codeBox = screen.getByTestId('code-box');
    expect(codeBox.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('applies custom containerClassName', () => {
    render(
      <CodeBox containerClassName="custom-container">
        <pre>
          <code>test</code>
        </pre>
      </CodeBox>
    );

    const codeBox = screen.getByTestId('code-box');
    expect(codeBox).toHaveClass('custom-container');
  });

  it('applies data-language attribute', () => {
    render(
      <CodeBox data-language="javascript">
        <pre>
          <code>test</code>
        </pre>
      </CodeBox>
    );

    const codeBox = screen.getByTestId('code-box');
    const innerBox = codeBox.querySelector('[data-language]');
    expect(innerBox).toHaveAttribute('data-language', 'javascript');
  });

  it('uses custom data-testid', () => {
    render(
      <CodeBox data-testid="custom-test-id">
        <pre>
          <code>test</code>
        </pre>
      </CodeBox>
    );

    expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
  });

  it('applies contained variant styles by default', () => {
    render(
      <CodeBox>
        <pre>
          <code>test</code>
        </pre>
      </CodeBox>
    );

    const codeBox = screen.getByTestId('code-box');
    // Container styles are on the outer element
    expect(codeBox).toHaveClass('bg-bg-raised');
    expect(codeBox).toHaveClass('border');
    expect(codeBox).toHaveClass('rounded');
    // Content padding is on the inner element
    const contentBox =
      codeBox.querySelector('div[data-language]') ?? codeBox.querySelector('div:last-child');
    expect(contentBox).toHaveClass('px-3');
  });

  it('applies contained variant styles when explicitly set', () => {
    render(
      <CodeBox variant="contained">
        <pre>
          <code>test</code>
        </pre>
      </CodeBox>
    );

    const codeBox = screen.getByTestId('code-box');
    // Container styles are on the outer element
    expect(codeBox).toHaveClass('bg-bg-raised');
    expect(codeBox).toHaveClass('border');
    expect(codeBox).toHaveClass('rounded');
    // Content padding is on the inner element
    const contentBox =
      codeBox.querySelector('div[data-language]') ?? codeBox.querySelector('div:last-child');
    expect(contentBox).toHaveClass('px-3');
  });

  it('applies borderless variant styles when set', () => {
    render(
      <CodeBox variant="borderless">
        <pre>
          <code>test</code>
        </pre>
      </CodeBox>
    );

    const codeBox = screen.getByTestId('code-box');
    // No container styles on outer element for borderless
    expect(codeBox).not.toHaveClass('bg-bg-raised');
    expect(codeBox).not.toHaveClass('border');
    expect(codeBox).not.toHaveClass('rounded');
    // Content has minimal padding
    const contentBox =
      codeBox.querySelector('div[data-language]') ?? codeBox.querySelector('div:last-child');
    expect(contentBox).toHaveClass('px-2');
  });

  it('copy button works in borderless variant', () => {
    render(
      <CodeBox variant="borderless" copyText="test code">
        <pre>
          <code>test code</code>
        </pre>
      </CodeBox>
    );

    expect(screen.getByLabelText('Copy to clipboard')).toBeInTheDocument();
  });
});
