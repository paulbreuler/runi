import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SignalDot } from './SignalDot';

describe('SignalDot', () => {
  it('renders with verified signal type', () => {
    render(<SignalDot type="verified" />);
    const dot = screen.getByTestId('signal-dot-verified');
    expect(dot).toBeInTheDocument();
  });

  it('renders with drift signal type', () => {
    render(<SignalDot type="drift" />);
    const dot = screen.getByTestId('signal-dot-drift');
    expect(dot).toBeInTheDocument();
  });

  it('renders with ai signal type', () => {
    render(<SignalDot type="ai" />);
    const dot = screen.getByTestId('signal-dot-ai');
    expect(dot).toBeInTheDocument();
  });

  it('renders with bound signal type', () => {
    render(<SignalDot type="bound" />);
    const dot = screen.getByTestId('signal-dot-bound');
    expect(dot).toBeInTheDocument();
  });

  it('applies pulse animation for drift signal', () => {
    render(<SignalDot type="drift" />);
    const dot = screen.getByTestId('signal-dot-drift');
    expect(dot).toHaveClass('animate-pulse');
  });

  it('does not apply pulse animation for other signals', () => {
    render(<SignalDot type="verified" />);
    const dot = screen.getByTestId('signal-dot-verified');
    expect(dot).not.toHaveClass('animate-pulse');
  });

  it('renders small size by default', () => {
    render(<SignalDot type="verified" />);
    const dot = screen.getByTestId('signal-dot-verified');
    expect(dot).toHaveClass('w-2');
    expect(dot).toHaveClass('h-2');
  });

  it('renders medium size when specified', () => {
    render(<SignalDot type="verified" size="md" />);
    const dot = screen.getByTestId('signal-dot-verified');
    expect(dot).toHaveClass('w-2.5');
    expect(dot).toHaveClass('h-2.5');
  });

  it('renders large size when specified', () => {
    render(<SignalDot type="verified" size="lg" />);
    const dot = screen.getByTestId('signal-dot-verified');
    expect(dot).toHaveClass('w-3');
    expect(dot).toHaveClass('h-3');
  });

  it('shows tooltip when provided', () => {
    render(<SignalDot type="verified" tooltip="Response verified" />);
    const dot = screen.getByTestId('signal-dot-verified');
    expect(dot).toHaveAttribute('title', 'Response verified');
  });

  it('applies glow effect for verified signal', () => {
    render(<SignalDot type="verified" />);
    const dot = screen.getByTestId('signal-dot-verified');
    expect(dot).toHaveClass('shadow-signal-success/40');
  });

  it('renders correct background color for each type', () => {
    const { rerender } = render(<SignalDot type="verified" />);
    expect(screen.getByTestId('signal-dot-verified')).toHaveClass('bg-signal-success');

    rerender(<SignalDot type="drift" />);
    expect(screen.getByTestId('signal-dot-drift')).toHaveClass('bg-signal-warning');

    rerender(<SignalDot type="ai" />);
    expect(screen.getByTestId('signal-dot-ai')).toHaveClass('bg-signal-ai');

    rerender(<SignalDot type="bound" />);
    expect(screen.getByTestId('signal-dot-bound')).toHaveClass('bg-accent-blue');
  });
});
