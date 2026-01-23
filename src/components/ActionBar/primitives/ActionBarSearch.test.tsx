/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ActionBarSearch } from '../ActionBarSearch';

describe('ActionBarSearch', () => {
  it('renders with placeholder', () => {
    render(
      <ActionBarSearch
        value=""
        onChange={() => {}}
        placeholder="Search here..."
        aria-label="Search input"
      />
    );

    expect(screen.getByPlaceholderText('Search here...')).toBeInTheDocument();
  });

  it('displays current value', () => {
    render(<ActionBarSearch value="test query" onChange={() => {}} aria-label="Search input" />);

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const handleChange = vi.fn();
    render(<ActionBarSearch value="" onChange={handleChange} aria-label="Search input" />);

    await userEvent.type(screen.getByRole('textbox'), 'hello');

    // Should be called for each character typed
    // Since this is a controlled component with value="" not being updated,
    // each keystroke passes the new character only
    expect(handleChange).toHaveBeenCalledTimes(5);
    expect(handleChange).toHaveBeenNthCalledWith(1, 'h');
    expect(handleChange).toHaveBeenNthCalledWith(2, 'e');
  });

  it('has correct aria-label', () => {
    render(<ActionBarSearch value="" onChange={() => {}} aria-label="Filter by URL" />);

    expect(screen.getByLabelText('Filter by URL')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ActionBarSearch value="" onChange={() => {}} aria-label="Search" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses shorter placeholder in icon mode', () => {
    render(
      <ActionBarSearch
        value=""
        onChange={() => {}}
        placeholder="Filter by URL..."
        variant="icon"
        aria-label="Search"
      />
    );

    // In icon mode, placeholder should be "Search..." instead of full placeholder
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('shows collapsed button when expandable and in icon mode with empty value', () => {
    render(
      <ActionBarSearch
        value=""
        onChange={() => {}}
        variant="icon"
        expandable
        aria-label="Search"
        placeholder="Filter by URL..."
      />
    );

    // Should show a button instead of input
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('expands when collapsed button is clicked', async () => {
    render(
      <ActionBarSearch value="" onChange={() => {}} variant="icon" expandable aria-label="Search" />
    );

    // Click the collapsed button
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    // Should now show the input
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
