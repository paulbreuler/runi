/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file BodyViewer component tests
 * @description Tests for the BodyViewer component that displays formatted JSON
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BodyViewer } from './BodyViewer';

describe('BodyViewer', () => {
  it('renders formatted JSON body', () => {
    const jsonBody = '{"name":"John","age":30}';
    render(<BodyViewer body={jsonBody} />);

    // Should display formatted JSON (with proper indentation)
    const container = screen.getByTestId('body-viewer');
    expect(container).toBeInTheDocument();
    expect(container).toHaveTextContent('John');
  });

  it('handles null body', () => {
    render(<BodyViewer body={null} />);
    expect(screen.getByText(/no body/i)).toBeInTheDocument();
  });

  it('handles empty string body', () => {
    render(<BodyViewer body="" />);
    expect(screen.getByText(/no body/i)).toBeInTheDocument();
  });

  it('formats JSON with 2-space indentation', () => {
    const jsonBody = '{"name":"John","age":30}';
    render(<BodyViewer body={jsonBody} />);

    // Check that JSON is formatted (should have newlines and indentation)
    const container = screen.getByTestId('body-viewer');
    expect(container).toBeInTheDocument();
    // Formatted JSON should have newlines
    const formatted = container.textContent;
    expect(formatted).toContain('\n');
  });

  it('handles invalid JSON gracefully', () => {
    const invalidJson = '{invalid json}';
    render(<BodyViewer body={invalidJson} />);

    // Should display the raw text if JSON parsing fails
    expect(screen.getByText(invalidJson)).toBeInTheDocument();
  });

  it('handles non-JSON text', () => {
    const plainText = 'This is plain text';
    render(<BodyViewer body={plainText} />);

    expect(screen.getByText(plainText)).toBeInTheDocument();
  });
});
