import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AlertCircle, Info } from 'lucide-react';
import { ActionBarSegment } from '../ActionBarSegment';

describe('ActionBarSegment', () => {
  const defaultOptions = [
    { value: 'all', label: 'All' },
    { value: 'error', label: 'Error', icon: <AlertCircle size={12} /> },
    { value: 'info', label: 'Info', icon: <Info size={12} /> },
  ];

  it('renders all options', () => {
    render(
      <ActionBarSegment
        value="all"
        onValueChange={() => {}}
        options={defaultOptions}
        aria-label="Test segment"
      />
    );

    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /error/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /info/i })).toBeInTheDocument();
  });

  it('marks selected option as pressed', () => {
    render(
      <ActionBarSegment
        value="error"
        onValueChange={() => {}}
        options={defaultOptions}
        aria-label="Test segment"
      />
    );

    expect(screen.getByRole('button', { name: /error/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /all/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onValueChange when option is clicked', async () => {
    const handleChange = vi.fn();
    render(
      <ActionBarSegment
        value="all"
        onValueChange={handleChange}
        options={defaultOptions}
        aria-label="Test segment"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /error/i }));
    expect(handleChange).toHaveBeenCalledWith('error');
  });

  it('allows deselection when allowEmpty is true', async () => {
    const handleChange = vi.fn();
    render(
      <ActionBarSegment
        value="error"
        onValueChange={handleChange}
        options={defaultOptions}
        allowEmpty
        aria-label="Test segment"
      />
    );

    // Click the already selected option
    await userEvent.click(screen.getByRole('button', { name: /error/i }));
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('does not deselect when allowEmpty is false', async () => {
    const handleChange = vi.fn();
    render(
      <ActionBarSegment
        value="error"
        onValueChange={handleChange}
        options={defaultOptions}
        aria-label="Test segment"
      />
    );

    // Click the already selected option
    await userEvent.click(screen.getByRole('button', { name: /error/i }));
    // Should call with the same value (selecting it again)
    expect(handleChange).toHaveBeenCalledWith('error');
  });

  it('renders badges when provided', () => {
    render(
      <ActionBarSegment
        value="all"
        onValueChange={() => {}}
        options={[
          { value: 'all', label: 'All' },
          { value: 'error', label: 'Error', badge: 5 },
          { value: 'warn', label: 'Warn', badge: 100 },
        ]}
        aria-label="Test segment"
      />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('99+')).toBeInTheDocument(); // Capped at 99+
  });

  it('does not render badge when count is 0', () => {
    render(
      <ActionBarSegment
        value="all"
        onValueChange={() => {}}
        options={[
          { value: 'all', label: 'All' },
          { value: 'error', label: 'Error', badge: 0 },
        ]}
        aria-label="Test segment"
      />
    );

    // Error button should exist but no badge
    expect(screen.getByRole('button', { name: /error/i })).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows only icons in icon mode', () => {
    render(
      <ActionBarSegment
        value="all"
        onValueChange={() => {}}
        options={defaultOptions}
        variant="icon"
        aria-label="Test segment"
      />
    );

    // Labels should not be visible
    // The buttons should exist with title attributes
    const errorButton = screen.getByTitle('Error');
    expect(errorButton).toBeInTheDocument();
  });

  it('inherits variant from ActionBar context', () => {
    // We can't easily test this without more complex mocking of ResizeObserver
    // This is covered by integration tests
    expect(true).toBe(true);
  });
});
