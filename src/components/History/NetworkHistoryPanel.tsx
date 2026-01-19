import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { cn } from '@/utils/cn';
import type { NetworkHistoryEntry, HistoryFilters } from '@/types/history';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { FilterBar } from './FilterBar';
import { NetworkHistoryRow } from './NetworkHistoryRow';
import { NetworkStatusBar } from './NetworkStatusBar';
import { EmptyState } from '@/components/ui/EmptyState';

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
    compareSelection,
    selectedId,
    expandedId,
    setFilter,
    setCompareMode,
    toggleCompareSelection,
    setSelectedId,
    setExpandedId,
    deleteEntry,
    clearHistory,
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

  const handleCompareResponses = (): void => {
    // Emit event for comparison - to be implemented in future
    // For now, this is a placeholder that will be wired up when the comparison view is built
    // The compareSelection array contains the IDs of the two entries to compare
    void compareSelection;
  };

  const downloadJson = async (data: unknown, filename: string): Promise<void> => {
    const filePath = await save({
      defaultPath: filename,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (filePath !== null) {
      await writeTextFile(filePath, JSON.stringify(data, null, 2));
    }
  };

  const handleSaveAll = async (): Promise<void> => {
    await downloadJson(filteredEntries, `network-history-${String(Date.now())}.json`);
  };

  const handleSaveSelection = async (): Promise<void> => {
    if (compareSelection.length === 0) {
      return;
    }
    const selectedEntries = filteredEntries.filter((entry) => compareSelection.includes(entry.id));
    await downloadJson(selectedEntries, `network-history-selected-${String(Date.now())}.json`);
  };

  const handleClearAll = async (): Promise<void> => {
    if (
      window.confirm('Are you sure you want to clear all network history? This cannot be undone.')
    ) {
      await clearHistory();
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deleteEntry(id);
  };

  // Virtualization
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: filteredEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 5,
  });

  // Render entry list based on count and virtualization threshold
  const renderEntryList = (): React.ReactNode => {
    // Empty state
    if (filteredEntries.length === 0) {
      return (
        <EmptyState
          variant="muted"
          size="sm"
          title={entries.length === 0 ? 'No requests yet' : 'No matching requests'}
        />
      );
    }

    // Virtualized rendering for large lists
    if (filteredEntries.length >= VIRTUALIZATION_THRESHOLD) {
      return (
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
                  compareMode={compareMode}
                  isCompareSelected={compareSelection.includes(entry.id)}
                  onToggleCompare={toggleCompareSelection}
                  onDelete={handleDelete}
                />
              </div>
            );
          })}
        </div>
      );
    }

    // Standard rendering for small lists
    return filteredEntries.map((entry) => (
      <NetworkHistoryRow
        key={entry.id}
        entry={entry}
        isExpanded={expandedId === entry.id}
        isSelected={selectedId === entry.id}
        onToggleExpand={handleToggleExpand}
        onSelect={handleSelect}
        onReplay={onReplay}
        onCopyCurl={onCopyCurl}
        compareMode={compareMode}
        isCompareSelected={compareSelection.includes(entry.id)}
        onToggleCompare={toggleCompareSelection}
      />
    ));
  };

  return (
    <div className="flex flex-col h-full bg-bg-surface">
      {/* Filter bar - responsive with horizontal scroll */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        compareMode={compareMode}
        onCompareModeToggle={handleCompareModeToggle}
        compareSelectionCount={compareSelection.length}
        onCompareResponses={handleCompareResponses}
        onSaveAll={handleSaveAll}
        onSaveSelection={handleSaveSelection}
        onClearAll={handleClearAll}
        isSaveSelectionDisabled={compareSelection.length === 0}
      />

      {/* Table container - handles horizontal overflow */}
      <div className="flex-1 flex flex-col min-h-0 overflow-x-auto">
        {/* Table header - fixed widths, can overflow horizontally */}
        <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border-subtle bg-bg-raised/50 text-xs font-medium text-text-muted shrink-0 min-w-max">
          {compareMode && <span className="w-4" />} {/* Checkbox space */}
          <span className="w-5" /> {/* Chevron space */}
          <span className="w-14">Method</span>
          <span className="flex-1">URL</span>
          <span className="w-12 text-right">Status</span>
          <span className="w-14 text-right">Time</span>
          <span className="w-16 text-right">Size</span>
          <span className="w-16 text-right">When</span>
          <span className="w-14" /> {/* Actions space */}
        </div>

        {/* Entry list - vertical scroll only */}
        <div
          ref={parentRef}
          className={cn(
            'flex-1 min-h-0',
            filteredEntries.length === 0 ? 'flex flex-col' : 'overflow-y-auto'
          )}
          style={{ scrollbarGutter: 'stable' }}
        >
          {renderEntryList()}
        </div>
      </div>

      {/* Status bar - fixed, no scroll */}
      <div className="shrink-0">
        <NetworkStatusBar
          totalCount={entries.length}
          driftCount={counts.drift}
          aiCount={counts.ai}
          boundCount={counts.bound}
        />
      </div>
    </div>
  );
};
