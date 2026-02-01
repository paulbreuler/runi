/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useEffect } from 'react';
import { CollectionEmptyState } from '@/components/Sidebar/CollectionEmptyState';
import { CollectionItem } from '@/components/Sidebar/CollectionItem';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { cn } from '@/utils/cn';

export const CollectionList = (): React.JSX.Element => {
  const summaries = useCollectionStore((state) => state.summaries);
  const isLoading = useCollectionStore((state) => state.isLoading);
  const error = useCollectionStore((state) => state.error);
  const loadCollections = useCollectionStore((state) => state.loadCollections);
  const addHttpbinCollection = useCollectionStore((state) => state.addHttpbinCollection);
  const showError = error !== null && error.length > 0;

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

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
    <div className="flex flex-col" data-test-id="collection-list">
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
