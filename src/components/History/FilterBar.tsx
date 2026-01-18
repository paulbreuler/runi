import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { HistoryFilters } from '@/types/history';
import { NetworkHistoryFilters } from './NetworkHistoryFilters';
import { FilterBarActions } from './FilterBarActions';

export type FilterBarVariant = 'full' | 'compact' | 'icon';

interface FilterBarProps {
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
  /** Callback to save all entries */
  onSaveAll: () => void;
  /** Callback to save selected entries */
  onSaveSelection: () => void;
  /** Callback to clear all history */
  onClearAll: () => Promise<void>;
  /** Whether save selection is disabled */
  isSaveSelectionDisabled: boolean;
}

/**
 * FilterBar - Responsive filter bar with horizontal scroll and collapsing.
 *
 * Features:
 * - Responsive breakpoints: full (>800px), compact (600-800px), icon (<600px)
 * - Horizontal scroll when content overflows
 * - Touch/swipe gesture support
 * - Scroll gradient cues
 */
export const FilterBar = ({
  filters,
  onFilterChange,
  compareMode,
  onCompareModeToggle,
  compareSelectionCount = 0,
  onCompareResponses,
  onSaveAll,
  onSaveSelection,
  onClearAll,
  isSaveSelectionDisabled,
}: FilterBarProps): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion() === true;
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<FilterBarVariant>('full');
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollIdle, setIsScrollIdle] = useState(true);
  const scrollIdleTimeout = useRef<number | undefined>(undefined);

  // Detect container width and set variant
  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) {
        return;
      }
      const { width } = entry.contentRect;
      if (width > 800) {
        setVariant('full');
      } else if (width > 600) {
        setVariant('compact');
      } else {
        setVariant('icon');
      }
    });

    observer.observe(container);
    return (): void => {
      observer.disconnect();
    };
  }, []);

  // Update scroll state
  const updateScrollState = useCallback((): void => {
    if (scrollRef.current === null) {
      return;
    }
    const container = scrollRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const hasScrollableOverflow = maxScroll > 4;
    setHasOverflow(hasScrollableOverflow);
    setCanScrollLeft(container.scrollLeft > 2);
    setCanScrollRight(container.scrollLeft < maxScroll - 2);
  }, []);

  // Setup scroll detection
  useEffect(() => {
    if (scrollRef.current === null) {
      return;
    }

    updateScrollState();
    const container = scrollRef.current;

    const handleScroll = (): void => {
      updateScrollState();
      setIsScrollIdle(false);
      if (scrollIdleTimeout.current !== undefined) {
        window.clearTimeout(scrollIdleTimeout.current);
      }
      scrollIdleTimeout.current = window.setTimeout(() => {
        setIsScrollIdle(true);
      }, 220);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    container.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(container);

    return (): void => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (scrollIdleTimeout.current !== undefined) {
        window.clearTimeout(scrollIdleTimeout.current);
      }
    };
  }, [updateScrollState]);

  // Helper function to get overflow animation props
  const getOverflowAnimation = (
    direction: 'left' | 'right'
  ): {
    opacity: number | number[];
    x: number | number[];
  } => {
    if (prefersReducedMotion) {
      return { opacity: 0.35, x: 0 };
    }
    if (isScrollIdle) {
      const xValue = direction === 'left' ? [0, 3, 0] : [0, -3, 0];
      return { opacity: [0.2, 0.4, 0.2], x: xValue };
    }
    return { opacity: 0.25, x: 0 };
  };

  const showOverflowCue = hasOverflow;

  return (
    <div
      ref={containerRef}
      className="flex items-center py-1.5 border-b border-border-subtle bg-bg-raised/30 shrink-0 relative"
    >
      {/* Scrollable content container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hidden touch-pan-x min-w-0"
        aria-label="Filter bar content"
      >
        <div className="flex items-center gap-3 min-w-max px-3">
          <NetworkHistoryFilters
            variant={variant}
            filters={filters}
            onFilterChange={onFilterChange}
            compareMode={compareMode}
            onCompareModeToggle={onCompareModeToggle}
            compareSelectionCount={compareSelectionCount}
            onCompareResponses={onCompareResponses}
          />
          <FilterBarActions
            variant={variant}
            onSaveAll={onSaveAll}
            onSaveSelection={onSaveSelection}
            onClearAll={onClearAll}
            isSaveSelectionDisabled={isSaveSelectionDisabled}
          />
        </div>
      </div>

      {/* Overflow gradient cues */}
      {showOverflowCue && canScrollLeft && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-bg-raised/30 to-transparent"
          data-testid="filter-bar-overflow-left"
          initial={false}
          animate={getOverflowAnimation('left')}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {showOverflowCue && canScrollRight && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-bg-raised/30 to-transparent"
          data-testid="filter-bar-overflow-right"
          initial={false}
          animate={getOverflowAnimation('right')}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
};
