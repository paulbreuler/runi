/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { ArrowRightLeft, Code, CheckCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HistoryFilters } from '@/types/history';
import {
  ActionBarGroup,
  ActionBarSearch,
  ActionBarSelect,
  useOptionalActionBarContext,
} from '@/components/ActionBar';
import {
  renderMethodOption,
  renderStatusOption,
  renderIntelligenceOption,
  type MethodSelectOption,
  type StatusSelectOption,
  type IntelligenceSelectOption,
} from '@/components/ActionBar/selectRenderers';

interface NetworkHistoryFiltersProps {
  /** Current filter state */
  filters: HistoryFilters;
  /** Update a filter value */
  onFilterChange: (key: keyof HistoryFilters, value: string) => void;
  /** Number of selected entries */
  selectedCount: number;
  /** Callback when user clicks Compare Selected button */
  onCompareResponses?: () => void;
}

const METHOD_OPTIONS: MethodSelectOption[] = [
  { value: 'ALL', label: 'All Methods' },
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'HEAD', label: 'HEAD' },
  { value: 'OPTIONS', label: 'OPTIONS' },
];

const STATUS_OPTIONS: StatusSelectOption[] = [
  { value: 'All', label: 'All Status' },
  { value: '2xx', label: '2xx Success', range: '2xx' },
  { value: '3xx', label: '3xx Redirect', range: '3xx' },
  { value: '4xx', label: '4xx Client Error', range: '4xx' },
  { value: '5xx', label: '5xx Server Error', range: '5xx' },
];

const INTELLIGENCE_OPTIONS: IntelligenceSelectOption[] = [
  { value: 'All', label: 'All' },
  { value: 'Has Drift', label: 'Has Drift', signal: 'drift' },
  { value: 'AI Generated', label: 'AI Generated', signal: 'ai' },
  { value: 'Bound to Spec', label: 'Bound to Spec', signal: 'bound' },
  { value: 'Verified', label: 'Verified', signal: 'verified' },
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
  selectedCount,
  onCompareResponses,
}: NetworkHistoryFiltersProps): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const isIconMode = context?.variant === 'icon';
  const canCompare = selectedCount === 2;

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
          renderItem={renderMethodOption}
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
          renderItem={renderStatusOption}
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
          renderItem={renderIntelligenceOption}
        />
      </ActionBarGroup>

      {/* Compare controls group */}
      {canCompare && (
        <ActionBarGroup separator aria-label="Compare controls">
          {/* Compare Selected button - shown when exactly 2 entries are selected */}
          <Button
            data-testid="compare-selected-button"
            onClick={onCompareResponses}
            size={isIconMode ? 'icon-xs' : 'xs'}
            className="bg-signal-ai text-white hover:bg-signal-ai/90"
            title="Compare the selected responses"
            aria-label={isIconMode ? 'Compare the selected responses' : undefined}
          >
            <ArrowRightLeft size={14} />
            {!isIconMode && <span>Compare Selected</span>}
          </Button>
        </ActionBarGroup>
      )}
    </>
  );
};
