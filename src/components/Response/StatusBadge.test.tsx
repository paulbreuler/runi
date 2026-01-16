import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders status code and text', () => {
    render(<StatusBadge status={200} statusText="OK" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('200');
    expect(badge).toHaveTextContent('OK');
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
    expect(badge).toHaveClass('font-medium');
    expect(badge).toHaveClass('text-sm');
  });

  it('applies success styling for 2xx status with opacity-based background', () => {
    render(<StatusBadge status={200} statusText="OK" />);
    
    const badge = screen.getByTestId('status-badge');
    // Zen aesthetic: very subtle background, colored text, subtle border
    expect(badge).toHaveClass('bg-signal-success/10');
    expect(badge).toHaveClass('text-signal-success');
    expect(badge).toHaveClass('border-signal-success/20');
  });

  it('applies warning styling for 4xx status', () => {
    render(<StatusBadge status={404} statusText="Not Found" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('404');
    expect(badge).toHaveClass('bg-signal-warning/10');
    expect(badge).toHaveClass('text-signal-warning');
  });

  it('applies error styling for 5xx status', () => {
    render(<StatusBadge status={500} statusText="Internal Server Error" />);
    
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('500');
    expect(badge).toHaveClass('bg-signal-error/10');
    expect(badge).toHaveClass('text-signal-error');
  });
});
