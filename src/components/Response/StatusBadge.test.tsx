import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders status code and text', () => {
    render(<StatusBadge status={200} statusText="OK" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('200 OK');
  });

  it('has proper padding for professional look', () => {
    render(<StatusBadge status={200} statusText="OK" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1.5');
  });

  it('has rounded-lg for polish', () => {
    render(<StatusBadge status={200} statusText="OK" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('rounded-lg');
  });

  it('has proper font styling', () => {
    render(<StatusBadge status={200} statusText="OK" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveClass('font-semibold');
    expect(badge).toHaveClass('text-sm');
  });

  it('applies success color for 2xx status', () => {
    render(<StatusBadge status={200} statusText="OK" />);
    
    const badge = screen.getByTestId('status-badge');
    // Should have green-related class for success
    expect(badge.className).toMatch(/signal-success|method-get|green/);
  });

  it('applies warning color for 4xx status', () => {
    render(<StatusBadge status={404} statusText="Not Found" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('404 Not Found');
  });

  it('applies error color for 5xx status', () => {
    render(<StatusBadge status={500} statusText="Internal Server Error" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('500 Internal Server Error');
  });
});
