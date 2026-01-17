import { Search, GitCompare, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { HistoryFilters } from '@/types/history';

interface NetworkHistoryFiltersProps {
  /** Current filter state */
  filters: HistoryFilters;
  /** Update a filter value */
  onFilterChange: (key: keyof HistoryFilters, value: string) => void;
  /** Whether compare mode is active */
  compareMode: boolean;
  /** Toggle compare mode */
  onCompareModeToggle: () => void;
  /** Number of selected entries for comparison */
  compareSelectionCount?: number;
  /** Callback when user clicks Compare Responses button */
  onCompareResponses?: () => void;
}

const selectClasses =
  'bg-bg-surface border border-border-subtle rounded px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-border-emphasis';

/**
 * Filter controls for the Network History Panel.
 * URL search, method filter, status filter, intelligence filter, and compare mode toggle.
 */
export const NetworkHistoryFilters = ({
  filters,
  onFilterChange,
  compareMode,
  onCompareModeToggle,
  compareSelectionCount = 0,
  onCompareResponses,
}: NetworkHistoryFiltersProps): React.JSX.Element => {
  const canCompare = compareMode && compareSelectionCount === 2;

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b border-border-subtle">
      {/* Search input */}
      <div className="flex-1 relative">
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => {
            onFilterChange('search', e.target.value);
          }}
          placeholder="Filter by URL..."
          className="w-full pl-7 pr-2 py-1 text-sm bg-bg-surface border border-border-subtle rounded focus:outline-none focus:border-border-emphasis text-text-secondary placeholder:text-text-muted"
        />
      </div>

      {/* Method filter */}
      <select
        data-testid="method-filter"
        value={filters.method}
        onChange={(e) => {
          onFilterChange('method', e.target.value);
        }}
        className={selectClasses}
      >
        <option value="ALL">All Methods</option>
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
        <option value="HEAD">HEAD</option>
        <option value="OPTIONS">OPTIONS</option>
      </select>

      {/* Status filter */}
      <select
        data-testid="status-filter"
        value={filters.status}
        onChange={(e) => {
          onFilterChange('status', e.target.value);
        }}
        className={selectClasses}
      >
        <option value="All">All Status</option>
        <option value="2xx">2xx Success</option>
        <option value="3xx">3xx Redirect</option>
        <option value="4xx">4xx Client Error</option>
        <option value="5xx">5xx Server Error</option>
      </select>

      {/* Intelligence filter */}
      <select
        data-testid="intelligence-filter"
        value={filters.intelligence}
        onChange={(e) => {
          onFilterChange('intelligence', e.target.value);
        }}
        className={selectClasses}
      >
        <option value="All">All</option>
        <option value="Has Drift">Has Drift</option>
        <option value="AI Generated">AI Generated</option>
        <option value="Bound to Spec">Bound to Spec</option>
        <option value="Verified">Verified</option>
      </select>

      {/* Compare mode toggle */}
      <button
        data-testid="compare-toggle"
        onClick={onCompareModeToggle}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
          compareMode
            ? 'bg-accent-blue text-white'
            : 'bg-bg-surface border border-border-subtle text-text-secondary hover:bg-bg-raised'
        )}
        title="Compare two responses"
      >
        <GitCompare size={14} />
        <span>Compare</span>
      </button>

      {/* Compare Responses button - shown when 2 entries are selected */}
      {canCompare && (
        <button
          data-testid="compare-responses-button"
          onClick={onCompareResponses}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-signal-ai text-white hover:bg-signal-ai/90 transition-colors"
          title="Compare the selected responses"
        >
          <ArrowRightLeft size={14} />
          <span>Compare Responses</span>
        </button>
      )}
    </div>
  );
};
