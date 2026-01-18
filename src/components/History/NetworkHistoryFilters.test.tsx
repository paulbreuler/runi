import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NetworkHistoryFilters } from './NetworkHistoryFilters';
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

  it('renders search input', () => {
    render(<NetworkHistoryFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText('Filter by URL...')).toBeInTheDocument();
  });

  it('renders method dropdown', () => {
    render(<NetworkHistoryFilters {...defaultProps} />);
    expect(screen.getByTestId('method-filter')).toBeInTheDocument();
  });

  it('renders status dropdown', () => {
    render(<NetworkHistoryFilters {...defaultProps} />);
    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
  });

  it('renders intelligence dropdown', () => {
    render(<NetworkHistoryFilters {...defaultProps} />);
    expect(screen.getByTestId('intelligence-filter')).toBeInTheDocument();
  });

  it('renders compare mode toggle', () => {
    render(<NetworkHistoryFilters {...defaultProps} />);
    expect(screen.getByTestId('compare-toggle')).toBeInTheDocument();
  });

  it('calls onFilterChange when search input changes', () => {
    const onFilterChange = vi.fn();
    render(<NetworkHistoryFilters {...defaultProps} onFilterChange={onFilterChange} />);

    const input = screen.getByPlaceholderText('Filter by URL...');
    fireEvent.change(input, { target: { value: 'api.example' } });

    expect(onFilterChange).toHaveBeenCalledWith('search', 'api.example');
  });

  it('calls onFilterChange when method is selected', () => {
    const onFilterChange = vi.fn();
    render(<NetworkHistoryFilters {...defaultProps} onFilterChange={onFilterChange} />);

    const select = screen.getByTestId('method-filter');
    fireEvent.change(select, { target: { value: 'POST' } });

    expect(onFilterChange).toHaveBeenCalledWith('method', 'POST');
  });

  it('calls onFilterChange when status is selected', () => {
    const onFilterChange = vi.fn();
    render(<NetworkHistoryFilters {...defaultProps} onFilterChange={onFilterChange} />);

    const select = screen.getByTestId('status-filter');
    fireEvent.change(select, { target: { value: '4xx' } });

    expect(onFilterChange).toHaveBeenCalledWith('status', '4xx');
  });

  it('calls onFilterChange when intelligence filter is selected', () => {
    const onFilterChange = vi.fn();
    render(<NetworkHistoryFilters {...defaultProps} onFilterChange={onFilterChange} />);

    const select = screen.getByTestId('intelligence-filter');
    fireEvent.change(select, { target: { value: 'Has Drift' } });

    expect(onFilterChange).toHaveBeenCalledWith('intelligence', 'Has Drift');
  });

  it('calls onCompareModeToggle when compare button is clicked', () => {
    const onCompareModeToggle = vi.fn();
    render(<NetworkHistoryFilters {...defaultProps} onCompareModeToggle={onCompareModeToggle} />);

    fireEvent.click(screen.getByTestId('compare-toggle'));

    expect(onCompareModeToggle).toHaveBeenCalled();
  });

  it('shows active compare mode styling when compareMode is true', () => {
    render(<NetworkHistoryFilters {...defaultProps} compareMode={true} />);
    const button = screen.getByTestId('compare-toggle');
    expect(button).toHaveClass('bg-accent-blue');
  });

  it('displays current filter values', () => {
    const filters: HistoryFilters = {
      search: 'test query',
      method: 'POST',
      status: '4xx',
      intelligence: 'Has Drift',
    };
    render(<NetworkHistoryFilters {...defaultProps} filters={filters} />);

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    // Check select values by looking for selected option text
    expect(screen.getByDisplayValue('POST')).toBeInTheDocument();
    expect(screen.getByDisplayValue('4xx Client Error')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Has Drift')).toBeInTheDocument();
  });

  it('renders method options', () => {
    render(<NetworkHistoryFilters {...defaultProps} />);
    const select = screen.getByTestId('method-filter');

    expect(select).toContainHTML('<option value="ALL">All Methods</option>');
    expect(select).toContainHTML('<option value="GET">GET</option>');
    expect(select).toContainHTML('<option value="POST">POST</option>');
    expect(select).toContainHTML('<option value="PUT">PUT</option>');
    expect(select).toContainHTML('<option value="PATCH">PATCH</option>');
    expect(select).toContainHTML('<option value="DELETE">DELETE</option>');
  });

  it('renders status options', () => {
    render(<NetworkHistoryFilters {...defaultProps} />);
    const select = screen.getByTestId('status-filter');

    expect(select).toContainHTML('<option value="All">All Status</option>');
    expect(select).toContainHTML('<option value="2xx">2xx Success</option>');
    expect(select).toContainHTML('<option value="3xx">3xx Redirect</option>');
    expect(select).toContainHTML('<option value="4xx">4xx Client Error</option>');
    expect(select).toContainHTML('<option value="5xx">5xx Server Error</option>');
  });

  it('renders intelligence options', () => {
    render(<NetworkHistoryFilters {...defaultProps} />);
    const select = screen.getByTestId('intelligence-filter');

    expect(select).toContainHTML('<option value="All">All</option>');
    expect(select).toContainHTML('<option value="Has Drift">Has Drift</option>');
    expect(select).toContainHTML('<option value="AI Generated">AI Generated</option>');
    expect(select).toContainHTML('<option value="Bound to Spec">Bound to Spec</option>');
    expect(select).toContainHTML('<option value="Verified">Verified</option>');
  });
});
