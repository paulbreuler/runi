/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect } from 'react';
import { CollectionEmptyState } from '@/components/Sidebar/CollectionEmptyState';
import { CollectionItem } from '@/components/Sidebar/CollectionItem';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useListNavigation } from '@/hooks/useListNavigation';
import { cn } from '@/utils/cn';

export const CollectionList = (): React.JSX.Element => {
  const summaries = useCollectionStore((state) => state.summaries);
  const isLoading = useCollectionStore((state) => state.isLoading);
  const error = useCollectionStore((state) => state.error);
  const loadCollections = useCollectionStore((state) => state.loadCollections);
  const addHttpbinCollection = useCollectionStore((state) => state.addHttpbinCollection);
  const showError = error !== null && error.length > 0;
  const { enabled: collectionsEnabled } = useFeatureFlag('http', 'collectionsEnabled');

  // Roving tabindex/Arrow key navigation for the whole sidebar tree
  const { handleKeyDown } = useListNavigation({
    // Selector covers both collection headers and individual request items
    itemSelector: '[data-nav-item="true"]',
    activeItemSelector: '[data-active="true"]',
    loop: false,
  });

  useEffect(() => {
    if (!collectionsEnabled) {
      return;
    }

    void loadCollections();
  }, [collectionsEnabled, loadCollections]);

  if (!collectionsEnabled) {
    return (
      <div className="px-3 pb-3 text-xs text-text-muted" data-test-id="collection-list-disabled">
        Collections are experimental and currently disabled.
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="px-3 pb-3" data-test-id="collection-list-empty">
        <CollectionEmptyState
          isLoading={isLoading}
          error={error}
          onAddHttpbin={addHttpbinCollection}
        />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col outline-none"
      data-test-id="collection-list"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {showError && (
        <div
          className={cn('px-2 pb-2 text-xs text-signal-error')}
          data-test-id="collection-list-error"
        >
          {error}
        </div>
      )}
      <div className="flex flex-col">
        {summaries.map((summary) => (
          <CollectionItem key={summary.id} summary={summary} />
        ))}
      </div>
    </div>
  );
};
