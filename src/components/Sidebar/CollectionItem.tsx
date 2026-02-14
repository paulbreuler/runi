/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Folder, Pencil, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';

interface CollectionItemProps {
  summary: CollectionSummary;
  onDelete?: (collectionId: string) => void;
  onRename?: (collectionId: string, newName: string) => void;
}

export const CollectionItem = ({
  summary,
  onDelete,
  onRename,
}: CollectionItemProps): React.JSX.Element => {
  const isExpanded = useIsExpanded(summary.id);
  const selectedCollectionId = useCollectionStore((state) => state.selectedCollectionId);
  const isSelected = selectedCollectionId === summary.id;
  const toggleExpanded = useCollectionStore((state) => state.toggleExpanded);
  const loadCollection = useCollectionStore((state) => state.loadCollection);
  const selectCollection = useCollectionStore((state) => state.selectCollection);
  const collection = useCollection(summary.id);
  const sortedRequests = useSortedRequests(summary.id);
  const displayName = truncateNavLabel(summary.name);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.focus({ preventScroll: true });
    const nextExpanded = !isExpanded;
    toggleExpanded(summary.id);
    selectCollection(summary.id);
    if (nextExpanded && collection === undefined) {
      void loadCollection(summary.id);
    }
  };

  const startRename = useCallback((): void => {
    setRenameValue(summary.name);
    setIsRenaming(true);
    requestAnimationFrame(() => {
      renameInputRef.current?.select();
    });
  }, [summary.name]);

  const commitRename = useCallback((): void => {
    const trimmed = renameValue.trim();
    if (trimmed.length > 0 && trimmed !== summary.name) {
      onRename?.(summary.id, trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, summary.name, summary.id, onRename]);

  const cancelRename = useCallback((): void => {
    setIsRenaming(false);
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitRename();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelRename();
      }
    },
    [commitRename, cancelRename]
  );

  const handleDelete = useCallback((): void => {
    onDelete?.(summary.id);
    setDeletePopoverOpen(false);
  }, [summary.id, onDelete]);

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (e.key === 'F2') {
        e.preventDefault();
        startRename();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        setDeletePopoverOpen(true);
      }
    },
    [startRename]
  );

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      {isRenaming ? (
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="text-text-muted">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <Folder size={14} className="shrink-0 text-text-muted" />
          <Input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => {
              setRenameValue(e.target.value);
            }}
            onKeyDown={handleRenameKeyDown}
            onBlur={commitRename}
            className="flex-1 text-sm h-6 py-0 px-1"
            noScale
            autoFocus
            data-test-id={`collection-rename-input-${summary.id}`}
            aria-label={`Rename collection ${summary.name}`}
          />
        </div>
      ) : (
        <div className="group/collection">
          <div
            className={cn(
              'w-full flex items-center justify-between gap-3 px-2 py-1 transition-colors',
              isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40'
            )}
          >
            <button
              type="button"
              className={cn(
                focusRingClasses,
                'flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer bg-transparent border-none p-0'
              )}
              data-test-id={`collection-item-${summary.id}`}
              data-active={isSelected || undefined}
              data-nav-item="true"
              onClick={handleToggle}
              onKeyDown={handleRowKeyDown}
              aria-expanded={isExpanded}
            >
              <span className="text-text-muted">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <Folder size={14} className="shrink-0 text-text-muted" />
              <span className="text-sm text-text-primary truncate" title={summary.name}>
                {displayName}
              </span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span>{summary.request_count}</span>
                <span className="text-text-muted/70">•</span>
                <span className="uppercase tracking-wider">{summary.source_type}</span>
              </div>

              {/* Hover-revealed action buttons — far right, siblings of the toggle button */}
              <div
                className="flex items-center gap-0.5 opacity-0 group-hover/collection:opacity-100 transition-opacity duration-150"
                data-test-id={`collection-actions-${summary.id}`}
              >
                <Button
                  variant="ghost"
                  size="icon-xs"
                  noScale
                  className="size-5 text-text-muted hover:text-text-primary"
                  onClick={startRename}
                  data-test-id={`collection-rename-${summary.id}`}
                  aria-label={`Rename ${summary.name}`}
                >
                  <Pencil size={10} />
                </Button>

                <Popover open={deletePopoverOpen} onOpenChange={setDeletePopoverOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        noScale
                        className="size-5 text-text-muted hover:text-signal-error"
                        data-test-id={`collection-delete-${summary.id}`}
                        aria-label={`Delete ${summary.name}`}
                      />
                    }
                  >
                    <Trash2 size={10} />
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    align="start"
                    className="w-56 p-3"
                    data-test-id={`collection-delete-confirm-${summary.id}`}
                  >
                    <p className="text-sm text-text-primary mb-3">
                      Delete <span className="font-medium">{summary.name}</span>?
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="xs"
                        noScale
                        onClick={() => {
                          setDeletePopoverOpen(false);
                        }}
                        data-test-id={`collection-delete-cancel-${summary.id}`}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="xs"
                        noScale
                        onClick={handleDelete}
                        data-test-id={`collection-delete-confirm-btn-${summary.id}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      )}
      {isExpanded && (
        <div className="ml-3 border-l border-border-subtle pb-2" data-test-id="collection-requests">
          <RequestListComposite collectionId={summary.id} requests={sortedRequests} />
        </div>
      )}
    </div>
  );
};
