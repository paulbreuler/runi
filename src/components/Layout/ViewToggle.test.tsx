import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ViewToggle } from './ViewToggle';

describe('ViewToggle', () => {
  it('renders both view options', () => {
    render(<ViewToggle viewMode="builder" onViewChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /builder/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /history/i })).toBeInTheDocument();
  });

  it('highlights the builder button when in builder mode', () => {
    render(<ViewToggle viewMode="builder" onViewChange={vi.fn()} />);

    const builderButton = screen.getByRole('button', { name: /builder/i });
    const historyButton = screen.getByRole('button', { name: /history/i });

    expect(builderButton).toHaveAttribute('data-active', 'true');
    expect(historyButton).toHaveAttribute('data-active', 'false');
  });

  it('highlights the history button when in history mode', () => {
    render(<ViewToggle viewMode="history" onViewChange={vi.fn()} />);

    const builderButton = screen.getByRole('button', { name: /builder/i });
    const historyButton = screen.getByRole('button', { name: /history/i });

    expect(builderButton).toHaveAttribute('data-active', 'false');
    expect(historyButton).toHaveAttribute('data-active', 'true');
  });

  it('calls onViewChange with "builder" when builder is clicked', () => {
    const onViewChange = vi.fn();
    render(<ViewToggle viewMode="history" onViewChange={onViewChange} />);

    const builderButton = screen.getByRole('button', { name: /builder/i });
    fireEvent.click(builderButton);

    expect(onViewChange).toHaveBeenCalledWith('builder');
  });

  it('calls onViewChange with "history" when history is clicked', () => {
    const onViewChange = vi.fn();
    render(<ViewToggle viewMode="builder" onViewChange={onViewChange} />);

    const historyButton = screen.getByRole('button', { name: /history/i });
    fireEvent.click(historyButton);

    expect(onViewChange).toHaveBeenCalledWith('history');
  });

  it('does not call onViewChange when clicking already active mode', () => {
    const onViewChange = vi.fn();
    render(<ViewToggle viewMode="builder" onViewChange={onViewChange} />);

    const builderButton = screen.getByRole('button', { name: /builder/i });
    fireEvent.click(builderButton);

    expect(onViewChange).not.toHaveBeenCalled();
  });
});
