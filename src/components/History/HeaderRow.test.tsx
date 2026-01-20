/**
 * @file HeaderRow component tests
 * @description Tests for the HeaderRow component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderRow } from './HeaderRow';

describe('HeaderRow', () => {
  it('renders header name and value', () => {
    render(<HeaderRow name="Content-Type" value="application/json" />);

    expect(screen.getByText('Content-Type')).toBeInTheDocument();
    expect(screen.getByText('application/json')).toBeInTheDocument();
  });

  it('renders with test id', () => {
    render(<HeaderRow name="Authorization" value="Bearer token123" />);

    expect(screen.getByTestId('header-row')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <HeaderRow name="X-Custom" value="value" className="custom-class" />
    );

    const row = container.querySelector('.custom-class');
    expect(row).toBeInTheDocument();
  });

  it('handles long header values with word breaking', () => {
    const longValue = 'a'.repeat(100);
    render(<HeaderRow name="Long-Header" value={longValue} />);

    const valueElement = screen.getByText(longValue);
    expect(valueElement).toBeInTheDocument();
    expect(valueElement).toHaveClass('break-words');
  });
});
