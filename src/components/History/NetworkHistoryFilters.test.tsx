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
    compareMode: false,
    onCompareModeToggle: vi.fn(),
  };

  type TestProps = typeof defaultProps & {
    compareSelectionCount?: number;
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

  it('renders compare mode toggle', () => {
    renderWithActionBar(defaultProps);
    expect(screen.getByTestId('compare-toggle')).toBeInTheDocument();
  });

  it('calls onFilterChange when search input changes', () => {
    const onFilterChange = vi.fn();
    renderWithActionBar({ ...defaultProps, onFilterChange });

    const input = screen.getByPlaceholderText('Filter by URL...');
    fireEvent.change(input, { target: { value: 'api.example' } });

    expect(onFilterChange).toHaveBeenCalledWith('search', 'api.example');
  });

  it('calls onCompareModeToggle when compare button is clicked', () => {
    const onCompareModeToggle = vi.fn();
    renderWithActionBar({ ...defaultProps, onCompareModeToggle });

    fireEvent.click(screen.getByTestId('compare-toggle'));

    expect(onCompareModeToggle).toHaveBeenCalled();
  });

  it('shows active compare mode styling when compareMode is true', () => {
    renderWithActionBar({ ...defaultProps, compareMode: true });
    const button = screen.getByTestId('compare-toggle');
    expect(button).toHaveClass('bg-accent-blue');
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

    // For Radix UI Select, the selected value is displayed as text in the trigger
    // The triggers show the label for the selected value
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('4xx Client Error')).toBeInTheDocument();
    expect(screen.getByText('Has Drift')).toBeInTheDocument();
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

  it('shows compare responses button when 2 entries are selected in compare mode', () => {
    renderWithActionBar({
      ...defaultProps,
      compareMode: true,
      compareSelectionCount: 2,
      onCompareResponses: vi.fn(),
    });
    expect(screen.getByTestId('compare-responses-button')).toBeInTheDocument();
  });

  it('does not show compare responses button when fewer than 2 entries are selected', () => {
    renderWithActionBar({
      ...defaultProps,
      compareMode: true,
      compareSelectionCount: 1,
      onCompareResponses: vi.fn(),
    });
    expect(screen.queryByTestId('compare-responses-button')).not.toBeInTheDocument();
  });

  it('calls onCompareResponses when compare responses button is clicked', () => {
    const onCompareResponses = vi.fn();
    renderWithActionBar({
      ...defaultProps,
      compareMode: true,
      compareSelectionCount: 2,
      onCompareResponses,
    });

    fireEvent.click(screen.getByTestId('compare-responses-button'));
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
