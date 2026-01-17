import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { NetworkHistoryEntry, HistoryFilters } from '@/types/history';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { NetworkHistoryFilters } from './NetworkHistoryFilters';
import { NetworkHistoryRow } from './NetworkHistoryRow';
import { NetworkStatusBar } from './NetworkStatusBar';
import { SignalDot } from './SignalDot';

/** Estimated row height for virtualization */
const ESTIMATED_ROW_HEIGHT = 48;
/** Threshold for enabling virtualization (only virtualize large lists) */
const VIRTUALIZATION_THRESHOLD = 50;

interface NetworkHistoryPanelProps {
  /** History entries to display (optional - uses store by default) */
  entries?: NetworkHistoryEntry[];
  /** Callback when user wants to replay a request */
  onReplay: (entry: NetworkHistoryEntry) => void;
  /** Callback when user wants to copy as cURL */
  onCopyCurl: (entry: NetworkHistoryEntry) => void;
}

/**
 * Network History Panel - shows all HTTP request history with filtering and intelligence.
 */
export const NetworkHistoryPanel = ({
  entries: entriesProp,
  onReplay,
  onCopyCurl,
}: NetworkHistoryPanelProps): React.JSX.Element => {
  // Use store state
  const {
    entries: storeEntries,
    filters,
    compareMode,
    selectedId,
    expandedId,
    setFilter,
    setCompareMode,
    setSelectedId,
    setExpandedId,
    filteredEntries: getFilteredEntries,
  } = useHistoryStore();

  // Use prop entries if provided, otherwise use store entries
  // Note: store entries are HistoryEntry but can be treated as NetworkHistoryEntry
  // (they just won't have intelligence/waterfall populated)
  const entries = (entriesProp ?? storeEntries) as NetworkHistoryEntry[];

  // Filter entries - use store's filteredEntries if using store entries, otherwise compute locally
  const filteredEntries = useMemo(() => {
    if (entriesProp === undefined) {
      // Using store entries, use store's filtered function
      return getFilteredEntries();
    }

    // Using prop entries, filter locally
    return entries.filter((entry) => {
      // Search filter
      if (
        filters.search !== '' &&
        !entry.request.url.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Method filter
      if (filters.method !== 'ALL' && entry.request.method.toUpperCase() !== filters.method) {
        return false;
      }

      // Status filter
      if (filters.status !== 'All') {
        const status = entry.response.status;
        const range = filters.status;
        if (range === '2xx' && (status < 200 || status >= 300)) {
          return false;
        }
        if (range === '3xx' && (status < 300 || status >= 400)) {
          return false;
        }
        if (range === '4xx' && (status < 400 || status >= 500)) {
          return false;
        }
        if (range === '5xx' && status < 500) {
          return false;
        }
      }

      // Intelligence filter
      if (filters.intelligence !== 'All') {
        const intel = entry.intelligence;
        // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- explicit null check needed for drift type
        if (filters.intelligence === 'Has Drift' && (intel === undefined || intel.drift === null)) {
          return false;
        }
        if (filters.intelligence === 'AI Generated' && intel?.aiGenerated !== true) {
          return false;
        }
        if (filters.intelligence === 'Bound to Spec' && intel?.boundToSpec !== true) {
          return false;
        }
        if (filters.intelligence === 'Verified' && intel?.verified !== true) {
          return false;
        }
      }

      return true;
    });
  }, [entriesProp, entries, filters, getFilteredEntries]);

  // Calculate intelligence counts
  const counts = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        const intel = entry.intelligence;
        if (intel !== undefined && intel.drift !== null) {
          acc.drift++;
        }
        if (intel?.aiGenerated === true) {
          acc.ai++;
        }
        if (intel?.boundToSpec === true) {
          acc.bound++;
        }
        return acc;
      },
      { drift: 0, ai: 0, bound: 0 }
    );
  }, [entries]);

  const handleFilterChange = (key: keyof HistoryFilters, value: string): void => {
    setFilter(key, value);
  };

  const handleToggleExpand = (id: string): void => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSelect = (id: string): void => {
    setSelectedId(id);
  };

  const handleCompareModeToggle = (): void => {
    setCompareMode(!compareMode);
  };

  // Virtualization
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-full bg-bg-surface">
      {/* Header with title and signal legend */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle">
        <h2 className="text-sm font-semibold text-text-primary">Network</h2>

        {/* Signal legend */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <SignalDot type="verified" size="sm" />
            <span className="text-text-muted">Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SignalDot type="drift" size="sm" />
            <span className="text-text-muted">Drift</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SignalDot type="ai" size="sm" />
            <span className="text-text-muted">AI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <SignalDot type="bound" size="sm" />
            <span className="text-text-muted">Bound</span>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <NetworkHistoryFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        compareMode={compareMode}
        onCompareModeToggle={handleCompareModeToggle}
      />

      {/* Table header */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border-subtle bg-bg-raised/50 text-xs font-medium text-text-muted">
        <span className="w-5" /> {/* Chevron space */}
        <span className="w-14">Method</span>
        <span className="flex-1">URL</span>
        <span className="w-12 text-right">Status</span>
        <span className="w-14 text-right">Time</span>
        <span className="w-16 text-right">Size</span>
        <span className="w-16 text-right">When</span>
        <span className="w-14" /> {/* Actions space */}
      </div>

      {/* Entry list */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        {filteredEntries.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-text-muted text-sm">
            {entries.length === 0 ? 'No requests yet' : 'No matching requests'}
          </div>
        ) : filteredEntries.length >= VIRTUALIZATION_THRESHOLD ? (
          // Virtualized rendering for large lists
          <div
            style={{
              height: `${String(virtualizer.getTotalSize())}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const entry = filteredEntries[virtualRow.index];
              if (entry === undefined) {
                return null;
              }
              return (
                <div
                  key={entry.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${String(virtualRow.start)}px)`,
                  }}
                >
                  <NetworkHistoryRow
                    entry={entry}
                    isExpanded={expandedId === entry.id}
                    isSelected={selectedId === entry.id}
                    onToggleExpand={handleToggleExpand}
                    onSelect={handleSelect}
                    onReplay={onReplay}
                    onCopyCurl={onCopyCurl}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          // Standard rendering for small lists
          filteredEntries.map((entry) => (
            <NetworkHistoryRow
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              isSelected={selectedId === entry.id}
              onToggleExpand={handleToggleExpand}
              onSelect={handleSelect}
              onReplay={onReplay}
              onCopyCurl={onCopyCurl}
            />
          ))
        )}
      </div>

      {/* Status bar */}
      <NetworkStatusBar
        totalCount={entries.length}
        driftCount={counts.drift}
        aiCount={counts.ai}
        boundCount={counts.bound}
      />
    </div>
  );
};
