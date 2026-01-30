/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
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

    // Base UI uses role="combobox" by default, but we override it to "button"
    expect(screen.getByRole('combobox', { name: 'Select method' })).toBeInTheDocument();
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

    await userEvent.click(screen.getByRole('combobox', { name: 'Select method' }));

    // Wait for popup to open and options to be visible
    await waitFor(
      () => {
        expect(screen.getByRole('option', { name: 'All Methods' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'GET' })).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
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

    await userEvent.click(screen.getByRole('combobox', { name: 'Select method' }));
    await userEvent.click(screen.getByRole('option', { name: 'POST' }));

    // Base UI onValueChange passes (value, eventDetails)
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenNthCalledWith(1, 'POST', expect.anything());
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
