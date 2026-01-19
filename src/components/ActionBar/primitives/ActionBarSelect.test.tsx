import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { Code } from 'lucide-react';
import { ActionBarSelect } from '../ActionBarSelect';

// Mock scrollIntoView for Radix Select (not available in jsdom)
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('ActionBarSelect', () => {
  const defaultOptions = [
    { value: 'ALL', label: 'All Methods' },
    { value: 'GET', label: 'GET' },
    { value: 'POST', label: 'POST' },
    { value: 'DELETE', label: 'DELETE' },
  ];

  it('renders trigger button', () => {
    render(
      <ActionBarSelect
        value="ALL"
        onValueChange={() => {}}
        options={defaultOptions}
        icon={<Code size={14} />}
        aria-label="Select method"
      />
    );

    expect(screen.getByRole('button', { name: 'Select method' })).toBeInTheDocument();
  });

  it('displays selected value in full mode', () => {
    render(
      <ActionBarSelect
        value="GET"
        onValueChange={() => {}}
        options={defaultOptions}
        icon={<Code size={14} />}
        aria-label="Select method"
        variant="full"
      />
    );

    expect(screen.getByText('GET')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    render(
      <ActionBarSelect
        value="ALL"
        onValueChange={() => {}}
        options={defaultOptions}
        icon={<Code size={14} />}
        aria-label="Select method"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Select method' }));

    // Check that options are visible
    expect(screen.getByRole('option', { name: 'All Methods' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'GET' })).toBeInTheDocument();
  });

  it('calls onValueChange when option is selected', async () => {
    const handleChange = vi.fn();
    render(
      <ActionBarSelect
        value="ALL"
        onValueChange={handleChange}
        options={defaultOptions}
        icon={<Code size={14} />}
        aria-label="Select method"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Select method' }));
    await userEvent.click(screen.getByRole('option', { name: 'POST' }));

    expect(handleChange).toHaveBeenCalledWith('POST');
  });

  it('uses data-testid when provided', () => {
    render(
      <ActionBarSelect
        value="ALL"
        onValueChange={() => {}}
        options={defaultOptions}
        icon={<Code size={14} />}
        aria-label="Select method"
        data-testid="method-select"
      />
    );

    expect(screen.getByTestId('method-select')).toBeInTheDocument();
  });

  it('shows icon only in icon mode', () => {
    const { container } = render(
      <ActionBarSelect
        value="GET"
        onValueChange={() => {}}
        options={defaultOptions}
        icon={<Code size={14} data-testid="select-icon" />}
        aria-label="Select method"
        variant="icon"
      />
    );

    // Icon should be visible
    expect(screen.getByTestId('select-icon')).toBeInTheDocument();

    // The SelectValue text should not be rendered in icon mode
    // We can check that the trigger has the icon-specific classes
    const trigger = container.querySelector('[class*="size-7"]');
    expect(trigger).toBeInTheDocument();
  });
});
