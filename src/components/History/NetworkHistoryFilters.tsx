import { GitCompare, ArrowRightLeft, Code, CheckCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HistoryFilters } from '@/types/history';
import {
  ActionBarGroup,
  ActionBarSearch,
  ActionBarSelect,
  useOptionalActionBarContext,
} from '@/components/ActionBar';

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

const METHOD_OPTIONS = [
  { value: 'ALL', label: 'All Methods' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'HEAD', label: 'HEAD' },
  { value: 'OPTIONS', label: 'OPTIONS' },
];

const STATUS_OPTIONS = [
  { value: 'All', label: 'All Status' },
  { value: '2xx', label: '2xx Success' },
  { value: '3xx', label: '3xx Redirect' },
  { value: '4xx', label: '4xx Client Error' },
  { value: '5xx', label: '5xx Server Error' },
];

const INTELLIGENCE_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Has Drift', label: 'Has Drift' },
  { value: 'AI Generated', label: 'AI Generated' },
  { value: 'Bound to Spec', label: 'Bound to Spec' },
  { value: 'Verified', label: 'Verified' },
];

/**
 * Filter controls for the Network History Panel.
 * URL search, method filter, status filter, intelligence filter, and compare mode toggle.
 *
 * Now built on ActionBar primitives for consistent responsive behavior.
 */
export const NetworkHistoryFilters = ({
  filters,
  onFilterChange,
  compareMode,
  onCompareModeToggle,
  compareSelectionCount = 0,
  onCompareResponses,
}: NetworkHistoryFiltersProps): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const isIconMode = context?.variant === 'icon';
  const canCompare = compareMode && compareSelectionCount === 2;

  return (
    <>
      {/* Filters group */}
      <ActionBarGroup aria-label="Filters">
        <ActionBarSearch
          value={filters.search}
          onChange={(value) => {
            onFilterChange('search', value);
          }}
          placeholder="Filter by URL..."
          aria-label="Filter history by URL"
        />
        <ActionBarSelect
          value={filters.method}
          onValueChange={(value) => {
            onFilterChange('method', value);
          }}
          options={METHOD_OPTIONS}
          icon={<Code size={14} />}
          aria-label="Filter by HTTP method"
          data-testid="method-filter"
        />
        <ActionBarSelect
          value={filters.status}
          onValueChange={(value) => {
            onFilterChange('status', value);
          }}
          options={STATUS_OPTIONS}
          icon={<CheckCircle size={14} />}
          aria-label="Filter by status code"
          data-testid="status-filter"
        />
        <ActionBarSelect
          value={filters.intelligence}
          onValueChange={(value) => {
            onFilterChange('intelligence', value);
          }}
          options={INTELLIGENCE_OPTIONS}
          icon={<Brain size={14} />}
          aria-label="Filter by intelligence"
          data-testid="intelligence-filter"
        />
      </ActionBarGroup>

      {/* Compare controls group */}
      <ActionBarGroup separator aria-label="Compare controls">
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
      </ActionBarGroup>
    </>
  );
};
