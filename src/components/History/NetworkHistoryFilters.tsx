import { Search, GitCompare, ArrowRightLeft, Code, CheckCircle, Brain } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { HistoryFilters } from '@/types/history';
import type { FilterBarVariant } from './FilterBar';

interface NetworkHistoryFiltersProps {
  /** Display variant */
  variant?: FilterBarVariant;
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
 *
 * Supports responsive variants:
 * - full: All filters with full labels
 * - compact: Filters with shorter labels
 * - icon: Icon-only filters with tooltips
 */
export const NetworkHistoryFilters = ({
  variant = 'full',
  filters,
  onFilterChange,
  compareMode,
  onCompareModeToggle,
  compareSelectionCount = 0,
  onCompareResponses,
}: NetworkHistoryFiltersProps): React.JSX.Element => {
  const canCompare = compareMode && compareSelectionCount === 2;
  const isIconMode = variant === 'icon';
  const isCompactMode = variant === 'compact';

  // Get method filter label
  const getMethodLabel = (): string => {
    if (isIconMode) {
      return filters.method === 'ALL' ? 'All Methods' : filters.method;
    }
    if (isCompactMode) {
      return filters.method === 'ALL' ? 'Methods' : filters.method;
    }
    return filters.method === 'ALL' ? 'All Methods' : filters.method;
  };

  // Get status filter label
  const getStatusLabel = (): string => {
    if (isIconMode) {
      return filters.status === 'All' ? 'All Status' : filters.status;
    }
    if (isCompactMode) {
      return filters.status === 'All' ? 'Status' : filters.status;
    }
    return filters.status === 'All' ? 'All Status' : filters.status;
  };

  // Get intelligence filter label
  const getIntelligenceLabel = (): string => {
    if (isIconMode) {
      return filters.intelligence === 'All' ? 'All' : filters.intelligence;
    }
    if (isCompactMode) {
      return filters.intelligence === 'All' ? 'Intel' : filters.intelligence;
    }
    return filters.intelligence === 'All' ? 'All' : filters.intelligence;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Search input - always visible, can shrink */}
      <div className={cn('relative', isIconMode ? 'w-32' : 'flex-1')}>
        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => {
            onFilterChange('search', e.target.value);
          }}
          placeholder={isIconMode ? 'Search...' : 'Filter by URL...'}
          className={cn(
            'pl-7 pr-2 py-1 text-sm bg-bg-surface border border-border-subtle rounded focus:outline-none focus:border-border-emphasis text-text-secondary placeholder:text-text-muted',
            isIconMode ? 'w-full' : 'w-full'
          )}
        />
      </div>

      {/* Method filter */}
      {isIconMode ? (
        <div className="relative">
          <select
            data-testid="method-filter"
            value={filters.method}
            onChange={(e) => {
              onFilterChange('method', e.target.value);
            }}
            className="w-7 h-7 bg-bg-surface border border-border-subtle rounded focus:outline-none focus:border-border-emphasis text-transparent appearance-none cursor-pointer"
            style={{ color: 'transparent' }}
            title={getMethodLabel()}
            aria-label="Filter by HTTP method"
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
          <Code
            size={14}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
          />
        </div>
      ) : (
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
      )}

      {/* Status filter */}
      {isIconMode ? (
        <div className="relative">
          <select
            data-testid="status-filter"
            value={filters.status}
            onChange={(e) => {
              onFilterChange('status', e.target.value);
            }}
            className="w-7 h-7 bg-bg-surface border border-border-subtle rounded focus:outline-none focus:border-border-emphasis text-transparent appearance-none cursor-pointer"
            style={{ color: 'transparent' }}
            title={getStatusLabel()}
            aria-label="Filter by status code"
          >
            <option value="All">All Status</option>
            <option value="2xx">2xx Success</option>
            <option value="3xx">3xx Redirect</option>
            <option value="4xx">4xx Client Error</option>
            <option value="5xx">5xx Server Error</option>
          </select>
          <CheckCircle
            size={14}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
          />
        </div>
      ) : (
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
      )}

      {/* Intelligence filter */}
      {isIconMode ? (
        <div className="relative">
          <select
            data-testid="intelligence-filter"
            value={filters.intelligence}
            onChange={(e) => {
              onFilterChange('intelligence', e.target.value);
            }}
            className="w-7 h-7 bg-bg-surface border border-border-subtle rounded focus:outline-none focus:border-border-emphasis text-transparent appearance-none cursor-pointer"
            style={{ color: 'transparent' }}
            title={getIntelligenceLabel()}
            aria-label="Filter by intelligence"
          >
            <option value="All">All</option>
            <option value="Has Drift">Has Drift</option>
            <option value="AI Generated">AI Generated</option>
            <option value="Bound to Spec">Bound to Spec</option>
            <option value="Verified">Verified</option>
          </select>
          <Brain
            size={14}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-text-muted"
          />
        </div>
      ) : (
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
      )}

      {/* Compare mode toggle */}
      {isIconMode ? (
        <button
          data-testid="compare-toggle"
          onClick={onCompareModeToggle}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded transition-colors relative',
            compareMode
              ? 'bg-accent-blue text-white'
              : 'bg-bg-surface border border-border-subtle text-text-secondary hover:bg-bg-raised'
          )}
          title="Compare two responses"
          aria-label="Compare two responses"
        >
          <GitCompare size={14} />
          {compareSelectionCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-signal-error text-white text-[10px] rounded-full flex items-center justify-center">
              {compareSelectionCount}
            </span>
          )}
        </button>
      ) : (
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
      )}

      {/* Compare Responses button - shown when 2 entries are selected */}
      {canCompare && (
        <button
          data-testid="compare-responses-button"
          onClick={onCompareResponses}
          className={cn(
            'flex items-center gap-1.5 rounded text-xs bg-signal-ai text-white hover:bg-signal-ai/90 transition-colors',
            isIconMode ? 'w-7 h-7 justify-center' : 'px-2 py-1'
          )}
          title="Compare the selected responses"
        >
          <ArrowRightLeft size={14} />
          {!isIconMode && <span>Compare Responses</span>}
        </button>
      )}
    </div>
  );
};
