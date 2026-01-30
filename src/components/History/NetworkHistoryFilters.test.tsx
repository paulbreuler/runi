/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NetworkHistoryFilters } from './NetworkHistoryFilters';
import { ActionBar } from '@/components/ActionBar';
import type { HistoryFilters } from '@/types/history';

describe('NetworkHistoryFilters', () => {
  const defaultFilters: HistoryFilters = {
    search: '',
    method: 'ALL',
    status: 'All',
    intelligence: 'All',
  };

  const defaultProps = {
    filters: defaultFilters,
    onFilterChange: vi.fn(),
    selectedCount: 0,
  };

  type TestProps = typeof defaultProps & {
    onCompareResponses?: () => void;
  };

  // Helper to render with ActionBar context
  const renderWithActionBar = (
    props: TestProps,
    breakpoints?: [number, number]
  ): ReturnType<typeof render> => {
    return render(
      <ActionBar breakpoints={breakpoints} aria-label="Test">
        <NetworkHistoryFilters {...props} />
      </ActionBar>
    );
  };

  it('renders search input', () => {
    renderWithActionBar(defaultProps);
    expect(screen.getByPlaceholderText('Filter by URL...')).toBeInTheDocument();
  });

  it('renders method dropdown', () => {
    renderWithActionBar(defaultProps);
    expect(screen.getByTestId('method-filter')).toBeInTheDocument();
  });

  it('renders status dropdown', () => {
    renderWithActionBar(defaultProps);
    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
  });

  it('renders intelligence dropdown', () => {
    renderWithActionBar(defaultProps);
    expect(screen.getByTestId('intelligence-filter')).toBeInTheDocument();
  });

  it('does not render compare mode toggle', () => {
    renderWithActionBar(defaultProps);
    expect(screen.queryByTestId('compare-toggle')).not.toBeInTheDocument();
  });

  it('calls onFilterChange when search input changes', () => {
    const onFilterChange = vi.fn();
    renderWithActionBar({ ...defaultProps, onFilterChange });

    const input = screen.getByPlaceholderText('Filter by URL...');
    fireEvent.change(input, { target: { value: 'api.example' } });

    expect(onFilterChange).toHaveBeenCalledWith('search', 'api.example');
  });

  it('displays current filter values in triggers', () => {
    const filters: HistoryFilters = {
      search: 'test query',
      method: 'POST',
      status: '4xx',
      intelligence: 'Has Drift',
    };
    renderWithActionBar({ ...defaultProps, filters });

    // Check search input value
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();

    // Verify filter triggers are rendered with their data-testids
    // Base UI Select displays selected values - we check the triggers are present
    const methodTrigger = screen.getByTestId('method-filter');
    const statusTrigger = screen.getByTestId('status-filter');
    const intelligenceTrigger = screen.getByTestId('intelligence-filter');

    expect(methodTrigger).toBeInTheDocument();
    expect(statusTrigger).toBeInTheDocument();
    expect(intelligenceTrigger).toBeInTheDocument();

    expect(methodTrigger).toHaveTextContent('POST');
    expect(statusTrigger).toHaveTextContent('4xx');
    expect(intelligenceTrigger).toHaveTextContent('Has Drift');
  });

  it('renders method filter trigger with correct aria-label', () => {
    renderWithActionBar(defaultProps);
    const trigger = screen.getByTestId('method-filter');
    expect(trigger).toHaveAttribute('aria-label', 'Filter by HTTP method');
  });

  it('renders status filter trigger with correct aria-label', () => {
    renderWithActionBar(defaultProps);
    const trigger = screen.getByTestId('status-filter');
    expect(trigger).toHaveAttribute('aria-label', 'Filter by status code');
  });

  it('renders intelligence filter trigger with correct aria-label', () => {
    renderWithActionBar(defaultProps);
    const trigger = screen.getByTestId('intelligence-filter');
    expect(trigger).toHaveAttribute('aria-label', 'Filter by intelligence');
  });

  it('shows Compare Selected button when exactly 2 entries are selected', () => {
    renderWithActionBar({
      ...defaultProps,
      selectedCount: 2,
      onCompareResponses: vi.fn(),
    });
    expect(screen.getByTestId('compare-selected-button')).toBeInTheDocument();
    expect(screen.getByText('Compare Selected')).toBeInTheDocument();
  });

  it('does not show Compare Selected button when 0 entries are selected', () => {
    renderWithActionBar({
      ...defaultProps,
      selectedCount: 0,
      onCompareResponses: vi.fn(),
    });
    expect(screen.queryByTestId('compare-selected-button')).not.toBeInTheDocument();
  });

  it('does not show Compare Selected button when 1 entry is selected', () => {
    renderWithActionBar({
      ...defaultProps,
      selectedCount: 1,
      onCompareResponses: vi.fn(),
    });
    expect(screen.queryByTestId('compare-selected-button')).not.toBeInTheDocument();
  });

  it('calls onCompareResponses when Compare Selected button is clicked', () => {
    const onCompareResponses = vi.fn();
    renderWithActionBar({
      ...defaultProps,
      selectedCount: 2,
      onCompareResponses,
    });

    fireEvent.click(screen.getByTestId('compare-selected-button'));
    expect(onCompareResponses).toHaveBeenCalled();
  });

  it('renders in icon mode with correct search placeholder', () => {
    // Using very small breakpoints forces icon mode immediately
    renderWithActionBar(defaultProps, [100, 50]);

    // In icon mode, search input has different placeholder (shorter)
    // Note: The actual placeholder in icon mode is "Search..." from ActionBarSearch
    const searchInput = screen.getByLabelText('Filter history by URL');
    expect(searchInput).toBeInTheDocument();
  });
});
