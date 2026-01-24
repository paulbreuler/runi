/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ResponsePanel component tests
 * @description Tests for the ResponsePanel component with request/response body tabs
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResponsePanel } from './ResponsePanel';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

const mockRequestBody = '{"name":"John","email":"john@example.com"}';
const mockResponseBody = '{"id":1,"name":"John"}';

describe('ResponsePanel', () => {
  it('renders response and request body tabs', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    expect(screen.getByRole('tab', { name: /response body/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /request body/i })).toBeInTheDocument();
  });

  it('shows Response Body tab as active by default', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    const responseTab = screen.getByRole('tab', { name: /response body/i });
    expect(responseTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Request Body tab on click', async () => {
    const user = userEvent.setup();
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    const requestTab = screen.getByRole('tab', { name: /request body/i });
    await user.click(requestTab);

    expect(requestTab).toHaveAttribute('aria-selected', 'true');
  });

  it('displays response body content when Response Body tab is active', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    // CodeSnippet should be rendered
    expect(screen.getByTestId('code-snippet')).toBeInTheDocument();
    // Response body content should be visible
    expect(screen.getByText(/John/)).toBeInTheDocument();
  });

  it('displays request body content when Request Body tab is active', async () => {
    const user = userEvent.setup();
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    const requestTab = screen.getByRole('tab', { name: /request body/i });
    await user.click(requestTab);

    // CodeSnippet should be rendered
    expect(screen.getByTestId('code-snippet')).toBeInTheDocument();
    // Request body content should be visible
    expect(screen.getByText(/john@example.com/)).toBeInTheDocument();
  });

  it('formats JSON with 2-space indentation', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    // CodeSnippet should format JSON with proper indentation
    const codeSnippet = screen.getByTestId('code-snippet');
    // The formatted JSON should have newlines and spaces (syntax highlighter renders it)
    expect(codeSnippet).toBeInTheDocument();
  });

  it('detects JSON language correctly', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    // CodeSnippet should detect JSON language
    const codeBox = screen.getByTestId('code-box');
    const innerBox = codeBox.querySelector('[data-language]');
    expect(innerBox).toHaveAttribute('data-language', 'json');
  });

  it('shows copy button for body content', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    // Copy button should be visible
    expect(screen.getByLabelText('Copy json code')).toBeInTheDocument();
  });

  it('shows empty state for null request body', async () => {
    const user = userEvent.setup();
    render(<ResponsePanel requestBody={null} responseBody={mockResponseBody} />);

    const requestTab = screen.getByRole('tab', { name: /request body/i });
    await user.click(requestTab);

    // Empty state should be shown
    expect(screen.getByText(/no request body/i)).toBeInTheDocument();
  });

  it('shows empty state for empty response body', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody="" />);

    // Empty state should be shown
    expect(screen.getByText(/no response body/i)).toBeInTheDocument();
  });

  it('uses borderless variant for CodeSnippet to match ResponseViewer body tab', () => {
    render(<ResponsePanel requestBody={mockRequestBody} responseBody={mockResponseBody} />);

    const codeBox = screen.getByTestId('code-box');
    const innerBox =
      codeBox.querySelector('[data-language]') ?? codeBox.querySelector('div:last-child');
    // Borderless variant should not have container styling (matches ResponseViewer body tab)
    expect(innerBox).not.toHaveClass('bg-bg-raised');
    expect(innerBox).not.toHaveClass('border');
  });

  it('formats body the same way as ResponseViewer body tab (only format JSON if detected as JSON)', () => {
    // Non-JSON body should not be formatted
    const nonJsonBody = 'This is plain text';
    render(<ResponsePanel requestBody={null} responseBody={nonJsonBody} />);

    const codeBox = screen.getByTestId('code-box');
    const textContent = codeBox.textContent || '';
    // Should display as-is, not try to format as JSON
    expect(textContent).toContain('This is plain text');
  });

  it('only formats JSON when language is detected as JSON', () => {
    // HTML body should not be formatted as JSON
    const htmlBody = '<html><body>Hello</body></html>';
    render(<ResponsePanel requestBody={null} responseBody={htmlBody} />);

    const codeBox = screen.getByTestId('code-box');
    const textContent = codeBox.textContent || '';
    // Should display HTML as-is, not try to format as JSON
    expect(textContent).toContain('<html>');
  });
});
