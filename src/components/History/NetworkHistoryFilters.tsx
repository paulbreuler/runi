import { Search, GitCompare, ArrowRightLeft, Code, CheckCircle, Brain } from 'lucide-react';
import { cn } from '@/utils/cn';
import * as Select from '@/components/ui/select';
import { Button } from '@/components/ui/button';
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

  // Handle method filter change
  const handleMethodChange = (value: string): void => {
    onFilterChange('method', value);
  };

  // Handle status filter change
  const handleStatusChange = (value: string): void => {
    onFilterChange('status', value);
  };

  // Handle intelligence filter change
  const handleIntelligenceChange = (value: string): void => {
    onFilterChange('intelligence', value);
  };

  // Trigger classes for icon mode
  const iconTriggerClasses = 'size-7 p-0 min-w-0 justify-center [&>svg:last-child]:hidden';

  // Trigger classes for full/compact mode
  const normalTriggerClasses = 'h-7 px-2 py-1 text-xs';

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
          aria-label="Filter history by URL"
          className={cn(
            'pl-7 pr-2 py-1 text-sm bg-bg-surface border border-border-subtle rounded focus:outline-none focus:border-border-emphasis text-text-secondary placeholder:text-text-muted',
            isIconMode ? 'w-full' : 'w-full'
          )}
        />
      </div>

      {/* Method filter */}
      <Select.Select value={filters.method} onValueChange={handleMethodChange}>
        <Select.SelectTrigger
          data-testid="method-filter"
          className={isIconMode ? iconTriggerClasses : normalTriggerClasses}
          aria-label="Filter by HTTP method"
        >
          {isIconMode ? <Code size={14} className="text-text-muted" /> : <Select.SelectValue />}
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="ALL">All Methods</Select.SelectItem>
          <Select.SelectItem value="GET">GET</Select.SelectItem>
          <Select.SelectItem value="POST">POST</Select.SelectItem>
          <Select.SelectItem value="PUT">PUT</Select.SelectItem>
          <Select.SelectItem value="PATCH">PATCH</Select.SelectItem>
          <Select.SelectItem value="DELETE">DELETE</Select.SelectItem>
          <Select.SelectItem value="HEAD">HEAD</Select.SelectItem>
          <Select.SelectItem value="OPTIONS">OPTIONS</Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>

      {/* Status filter */}
      <Select.Select value={filters.status} onValueChange={handleStatusChange}>
        <Select.SelectTrigger
          data-testid="status-filter"
          className={isIconMode ? iconTriggerClasses : normalTriggerClasses}
          aria-label="Filter by status code"
        >
          {isIconMode ? (
            <CheckCircle size={14} className="text-text-muted" />
          ) : (
            <Select.SelectValue />
          )}
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="All">All Status</Select.SelectItem>
          <Select.SelectItem value="2xx">2xx Success</Select.SelectItem>
          <Select.SelectItem value="3xx">3xx Redirect</Select.SelectItem>
          <Select.SelectItem value="4xx">4xx Client Error</Select.SelectItem>
          <Select.SelectItem value="5xx">5xx Server Error</Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>

      {/* Intelligence filter */}
      <Select.Select value={filters.intelligence} onValueChange={handleIntelligenceChange}>
        <Select.SelectTrigger
          data-testid="intelligence-filter"
          className={isIconMode ? iconTriggerClasses : normalTriggerClasses}
          aria-label="Filter by intelligence"
        >
          {isIconMode ? <Brain size={14} className="text-text-muted" /> : <Select.SelectValue />}
        </Select.SelectTrigger>
        <Select.SelectContent>
          <Select.SelectItem value="All">All</Select.SelectItem>
          <Select.SelectItem value="Has Drift">Has Drift</Select.SelectItem>
          <Select.SelectItem value="AI Generated">AI Generated</Select.SelectItem>
          <Select.SelectItem value="Bound to Spec">Bound to Spec</Select.SelectItem>
          <Select.SelectItem value="Verified">Verified</Select.SelectItem>
        </Select.SelectContent>
      </Select.Select>

      {/* Compare mode toggle */}
      {isIconMode ? (
        <div className="relative">
          <Button
            data-testid="compare-toggle"
            onClick={onCompareModeToggle}
            variant={compareMode ? 'default' : 'outline'}
            size="icon-xs"
            title={
              compareSelectionCount > 0
                ? `Compare two responses (${String(compareSelectionCount)} selected)`
                : 'Compare two responses'
            }
            aria-label={
              compareSelectionCount > 0
                ? `Compare two responses, ${String(compareSelectionCount)} of 2 selected`
                : 'Compare two responses'
            }
            aria-pressed={compareMode}
          >
            <GitCompare size={14} />
          </Button>
          {compareSelectionCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 bg-signal-error text-white text-[10px] rounded-full flex items-center justify-center pointer-events-none"
              aria-hidden="true"
            >
              {compareSelectionCount}
            </span>
          )}
        </div>
      ) : (
        <Button
          data-testid="compare-toggle"
          onClick={onCompareModeToggle}
          variant={compareMode ? 'default' : 'outline'}
          size="xs"
          title="Compare two responses"
          aria-pressed={compareMode}
        >
          <GitCompare size={14} />
          <span>Compare</span>
        </Button>
      )}

      {/* Compare Responses button - shown when 2 entries are selected */}
      {canCompare && (
        <Button
          data-testid="compare-responses-button"
          onClick={onCompareResponses}
          size={isIconMode ? 'icon-xs' : 'xs'}
          className="bg-signal-ai text-white hover:bg-signal-ai/90"
          title="Compare the selected responses"
          aria-label={isIconMode ? 'Compare the selected responses' : undefined}
        >
          <ArrowRightLeft size={14} />
          {!isIconMode && <span>Compare Responses</span>}
        </Button>
      )}
    </div>
  );
};
