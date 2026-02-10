/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { RequestListComposite } from '@/components/Sidebar/composite';
import {
  useCollection,
  useCollectionStore,
  useIsExpanded,
  useSortedRequests,
} from '@/stores/useCollectionStore';
import type { CollectionSummary } from '@/types/collection';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';

interface CollectionItemProps {
  summary: CollectionSummary;
}

export const CollectionItem = ({ summary }: CollectionItemProps): React.JSX.Element => {
  const isExpanded = useIsExpanded(summary.id);
  const selectedCollectionId = useCollectionStore((state) => state.selectedCollectionId);
  const isSelected = selectedCollectionId === summary.id;
  const toggleExpanded = useCollectionStore((state) => state.toggleExpanded);
  const loadCollection = useCollectionStore((state) => state.loadCollection);
  const selectCollection = useCollectionStore((state) => state.selectCollection);
  const collection = useCollection(summary.id);
  const sortedRequests = useSortedRequests(summary.id);
  const displayName = truncateNavLabel(summary.name);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>): void => {
    // Ensure mouse click sets focus so subsequent keyboard nav works
    e.currentTarget.focus({ preventScroll: true });
    const nextExpanded = !isExpanded;
    toggleExpanded(summary.id);
    selectCollection(summary.id);
    if (nextExpanded && collection === undefined) {
      void loadCollection(summary.id);
    }
  };

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      <button
        type="button"
        className={cn(
          focusRingClasses,
          'w-full flex items-center justify-between gap-3 px-2 py-1 text-left transition-colors',
          isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40'
        )}
        data-test-id={`collection-item-${summary.id}`}
        data-active={isSelected || undefined}
        data-nav-item="true"
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-text-muted">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <Folder size={14} className="shrink-0 text-text-muted" />
          <span className="text-sm text-text-primary truncate" title={summary.name}>
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
          <span>{summary.request_count}</span>
          <span className="text-text-muted/70">•</span>
          <span className="uppercase tracking-wider">{summary.source_type}</span>
        </div>
      </button>
      {isExpanded && (
        <div className="ml-3 border-l border-border-subtle pb-2" data-test-id="collection-requests">
          <RequestListComposite collectionId={summary.id} requests={sortedRequests} />
        </div>
      )}
    </div>
  );
};
