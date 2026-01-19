import { useMemo, useEffect, useCallback, useRef } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { cn } from '@/utils/cn';
import type { NetworkHistoryEntry, HistoryFilters } from '@/types/history';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { FilterBar } from './FilterBar';
import { NetworkStatusBar } from './NetworkStatusBar';
import { VirtualDataGrid } from '@/components/DataGrid/VirtualDataGrid';
import { createNetworkColumns } from '@/components/DataGrid/columns/networkColumns';
import { EXPANDED_CONTENT_LEFT_MARGIN_PX } from '@/components/DataGrid/constants';
import { TimingWaterfall } from './TimingWaterfall';
import { calculateWaterfallSegments } from '@/types/history';
import { motion, AnimatePresence } from 'motion/react';
import type { Row } from '@tanstack/react-table';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';

/** Estimated row height for virtualization */
const ESTIMATED_ROW_HEIGHT = 48;

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
 *
 * Rebuilt from scratch to match ConsolePanel structure exactly, ensuring:
 * - Identical wrapper div structure (overflow-hidden -> overflow-x-auto)
 * - Matching VirtualDataGrid props and className patterns
 * - Expanded content spans all columns (full width) using colSpan
 * - Consistent column width patterns (32px for selection/expander, fixed widths for others)
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
    selectedIds, // Multi-select support
    expandedId,
    setFilter,
    toggleSelection, // Multi-select support
    selectAll: _selectAll, // Used via handleRowSelectionChange for select all
    deselectAll: _deselectAll, // Used via handleRowSelectionChange for deselect all
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

  const handleToggleExpand = useCallback(
    (id: string): void => {
      setExpandedId(expandedId === id ? null : id);
    },
    [expandedId, setExpandedId]
  );

  const handleSelect = useCallback(
    (id: string): void => {
      // Use toggleSelection for multi-select support (maintains backward compatibility)
      toggleSelection(id);
    },
    [toggleSelection]
  );

  const handleCompareResponses = (): void => {
    // Get the 2 selected entries from selectedIds
    const selectedArray = Array.from(selectedIds);
    if (selectedArray.length !== 2) {
      // This shouldn't happen if button is only shown when 2 are selected, but guard anyway
      return;
    }

    // Show toast message indicating comparison is not yet implemented
    globalEventBus.emit<ToastEventPayload>('toast.show', {
      type: 'info',
      message: 'Comparison feature is coming soon.',
      details: `Selected entries: ${selectedArray.join(', ')}`,
      duration: 3000,
    });
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
    if (selectedIds.size === 0) {
      return;
    }
    const selectedEntries = filteredEntries.filter((entry) => selectedIds.has(entry.id));
    await downloadJson(selectedEntries, `network-history-selected-${String(Date.now())}.json`);
  };

  const handleClearAll = async (): Promise<void> => {
    if (
      window.confirm('Are you sure you want to clear all network history? This cannot be undone.')
    ) {
      await clearHistory();
    }
  };

  const handleDelete = useCallback(
    (id: string): void => {
      // Fire and forget - errors are handled by the store
      void deleteEntry(id);
    },
    [deleteEntry]
  );

  // Container ref for height calculation (future: measure dynamically)
  const parentRef = useRef<HTMLDivElement>(null);

  // Create columns with callbacks
  const columns = useMemo(
    () =>
      createNetworkColumns({
        onReplay,
        onCopy: onCopyCurl,
        onDelete: handleDelete,
      }),
    [onReplay, onCopyCurl, handleDelete]
  );

  // Sync TanStack Table selection with store
  const handleRowSelectionChange = useCallback(
    (selection: Record<string, boolean>): void => {
      const selectedSet = new Set(Object.keys(selection).filter((id) => selection[id] === true));
      const currentSet = selectedIds;

      // Batch update: only toggle IDs that changed
      // Add new selections
      for (const id of selectedSet) {
        if (!currentSet.has(id)) {
          toggleSelection(id);
        }
      }
      // Remove deselections
      for (const id of currentSet) {
        if (!selectedSet.has(id)) {
          toggleSelection(id);
        }
      }
    },
    [selectedIds, toggleSelection]
  );

  // Sync store selection to TanStack Table (when store changes externally)
  useEffect(() => {
    // This effect ensures that when selection changes in the store (e.g., from selectAll),
    // the TanStack Table selection state is updated
    // Note: This creates a controlled component pattern
    const newSelection: Record<string, boolean> = {};
    for (const id of selectedIds) {
      newSelection[id] = true;
    }
    // The VirtualDataGrid will handle this via initialRowSelection prop updates
  }, [selectedIds]);

  // Sync TanStack Table expansion with store
  const handleExpandedChange = useCallback(
    (expanded: Record<string, boolean>): void => {
      // Find the expanded row (should be only one)
      const expandedIds = Object.keys(expanded).filter((id) => expanded[id] === true);
      const newExpandedId = expandedIds.length > 0 ? (expandedIds[0] ?? null) : null;

      if (newExpandedId !== expandedId) {
        setExpandedId(newExpandedId);
      }
    },
    [expandedId, setExpandedId]
  );

  // Convert store selection to TanStack Table format
  const initialRowSelection = useMemo(() => {
    const selection: Record<string, boolean> = {};
    for (const id of selectedIds) {
      selection[id] = true;
    }
    return selection;
  }, [selectedIds]);

  // Convert store expansion to TanStack Table format
  const initialExpanded = useMemo(() => {
    if (expandedId === null) {
      return {};
    }
    return { [expandedId]: true };
  }, [expandedId]);

  // Refs to store setRowSelection and setExpanded functions from VirtualDataGrid
  const setRowSelectionRef = useRef<((selection: Record<string, boolean>) => void) | null>(null);
  const setExpandedRef = useRef<((expanded: Record<string, boolean>) => void) | null>(null);

  // Handle when VirtualDataGrid is ready with setRowSelection
  const handleSetRowSelectionReady = useCallback(
    (setRowSelectionFn: (selection: Record<string, boolean>) => void): void => {
      setRowSelectionRef.current = setRowSelectionFn;
    },
    []
  );

  // Handle when VirtualDataGrid is ready with setExpanded
  const handleSetExpandedReady = useCallback(
    (setExpandedFn: (expanded: Record<string, boolean>) => void): void => {
      setExpandedRef.current = setExpandedFn;
    },
    []
  );

  // Custom row renderer that includes expanded content
  const renderRow = useCallback(
    (row: Row<NetworkHistoryEntry>, cells: React.ReactNode): React.ReactNode => {
      const entry = row.original;
      const isExpanded = expandedId === entry.id;
      const isSelected = selectedIds.has(entry.id);
      const segments = calculateWaterfallSegments(entry.response.timing);
      const totalMs = entry.response.timing.total_ms;

      // Handle row click for selection
      const handleRowClick = (e: React.MouseEvent): void => {
        // Don't toggle if clicking on buttons or checkboxes
        const target = e.target as HTMLElement;
        if (
          target.closest('button') !== null ||
          target.closest('[role="checkbox"]') !== null ||
          target.closest('input') !== null
        ) {
          return;
        }
        // Update both store and TanStack Table
        handleSelect(entry.id);
        if (setRowSelectionRef.current !== null) {
          const newSelection = { ...initialRowSelection };
          if (isSelected) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- ID is from row data, safe
            delete newSelection[entry.id];
          } else {
            newSelection[entry.id] = true;
          }
          setRowSelectionRef.current(newSelection);
        }
      };

      // Handle double-click for expansion
      const handleRowDoubleClick = (e: React.MouseEvent): void => {
        // Don't toggle if clicking on buttons or checkboxes
        const target = e.target as HTMLElement;
        if (
          target.closest('button') !== null ||
          target.closest('[role="checkbox"]') !== null ||
          target.closest('input') !== null
        ) {
          return;
        }
        // Update both store and TanStack Table
        handleToggleExpand(entry.id);
        if (setExpandedRef.current !== null) {
          const newExpanded: Record<string, boolean> = {};
          if (!isExpanded) {
            newExpanded[entry.id] = true;
          }
          setExpandedRef.current(newExpanded);
        }
      };

      return (
        <>
          <tr
            key={row.id}
            className={cn(
              'group border-b border-border-default hover:bg-bg-raised/50 transition-colors cursor-pointer',
              isSelected && 'bg-bg-raised'
            )}
            data-row-id={row.id}
            data-testid="history-row"
            onClick={handleRowClick}
            onDoubleClick={handleRowDoubleClick}
          >
            {cells}
          </tr>
          {/* Expanded content row - CRITICAL: spans ALL columns for full width */}
          <AnimatePresence>
            {isExpanded && (
              <tr key={`${row.id}-expanded`}>
                <td colSpan={columns.length} className="p-0">
                  <motion.div
                    data-testid="expanded-section"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div
                      className="py-3 bg-bg-elevated border-t border-border-subtle"
                      style={{ marginLeft: `${String(EXPANDED_CONTENT_LEFT_MARGIN_PX)}px` }}
                    >
                      {/* Timing waterfall */}
                      <div className="mb-4">
                        <p className="text-xs text-text-muted mb-2">Timing</p>
                        <TimingWaterfall
                          segments={segments}
                          totalMs={totalMs}
                          showLegend
                          height="h-2"
                        />
                      </div>

                      {/* Intelligence details */}
                      {entry.intelligence !== undefined && (
                        <div className="mb-4">
                          <p className="text-xs text-text-muted mb-2">Intelligence</p>
                          <div className="flex flex-wrap gap-3 text-xs">
                            {entry.intelligence.verified && (
                              <span className="text-signal-success">Verified</span>
                            )}
                            {entry.intelligence.boundToSpec && (
                              <span className="text-accent-blue">
                                Bound to {entry.intelligence.specOperation ?? 'spec'}
                              </span>
                            )}
                            {entry.intelligence.drift !== null && (
                              <span className="text-signal-warning">
                                Drift: {entry.intelligence.drift.message}
                              </span>
                            )}
                            {entry.intelligence.aiGenerated && (
                              <span className="text-signal-ai">AI Generated</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs bg-bg-raised hover:bg-bg-raised/80 rounded transition-colors"
                          onClick={(): void => {
                            onReplay(entry);
                          }}
                        >
                          Edit & Replay
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs bg-bg-raised hover:bg-bg-raised/80 rounded transition-colors"
                          onClick={(): void => {
                            onCopyCurl(entry);
                          }}
                        >
                          Copy as cURL
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </td>
              </tr>
            )}
          </AnimatePresence>
        </>
      );
    },
    [
      expandedId,
      selectedIds,
      columns.length,
      handleSelect,
      handleToggleExpand,
      onReplay,
      onCopyCurl,
      initialRowSelection,
      // setRowSelectionRef and setExpandedRef are refs, don't need to be in deps
    ]
  );

  // Note: Select all is handled via TanStack Table's header checkbox in selection column
  // The store's selectAll/deselectAll will be called via handleRowSelectionChange

  return (
    <div className="flex flex-col h-full bg-bg-surface">
      {/* Filter bar - responsive with horizontal scroll */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        selectedCount={selectedIds.size}
        onCompareResponses={handleCompareResponses}
        onSaveAll={handleSaveAll}
        onSaveSelection={handleSaveSelection}
        onClearAll={handleClearAll}
        isSaveSelectionDisabled={selectedIds.size === 0}
      />

      {/* VirtualDataGrid container - matches ConsolePanel structure exactly */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-x-auto" ref={parentRef}>
          <VirtualDataGrid
            data={filteredEntries}
            columns={columns}
            getRowId={(row) => row.id}
            enableRowSelection={true}
            enableExpanding={true}
            getRowCanExpand={() => true}
            initialRowSelection={initialRowSelection}
            initialExpanded={initialExpanded}
            initialColumnPinning={{ right: ['actions'] }}
            onRowSelectionChange={handleRowSelectionChange}
            onExpandedChange={handleExpandedChange}
            onSetRowSelectionReady={handleSetRowSelectionReady}
            onSetExpandedReady={handleSetExpandedReady}
            estimateRowHeight={ESTIMATED_ROW_HEIGHT}
            emptyMessage={entries.length === 0 ? 'No requests yet' : 'No matching requests'}
            renderRow={renderRow}
            height={600}
            className="flex-1"
          />
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
