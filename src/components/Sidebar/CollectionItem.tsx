/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Folder,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
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
import { focusWithVisibility } from '@/utils/focusVisibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent } from '@/components/ui/Popover';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';

interface CollectionItemProps {
  summary: CollectionSummary;
  onDelete?: (collectionId: string) => void;
  onRename?: (collectionId: string, newName: string) => void;
  onDuplicate?: (collectionId: string) => void;
  onAddRequest?: (collectionId: string) => void;
  /** When true, the item mounts in inline-rename mode immediately. */
  startInRenameMode?: boolean;
  /** Called after the component has consumed the startInRenameMode flag. */
  onRenameStarted?: () => void;
}

export const CollectionItem = ({
  summary,
  onDelete,
  onRename,
  onDuplicate,
  onAddRequest,
  startInRenameMode = false,
  onRenameStarted,
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

  const [isRenaming, setIsRenaming] = useState(startInRenameMode);
  const [renameValue, setRenameValue] = useState(startInRenameMode ? summary.name : '');
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const didCancelRef = useRef(false);

  // Reset cancel flag when entering rename mode
  useEffect(() => {
    if (isRenaming) {
      didCancelRef.current = false;
    }
  }, [isRenaming]);

  // Auto-focus and select when mounting in rename mode
  useEffect(() => {
    if (startInRenameMode) {
      if (renameInputRef.current !== null) {
        focusWithVisibility(renameInputRef.current);
        renameInputRef.current.select();
      }
      onRenameStarted?.();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (renameInputRef.current !== null) {
        focusWithVisibility(renameInputRef.current);
        renameInputRef.current.select();
      }
    });
  }, [summary.name]);

  const commitRename = useCallback((): void => {
    if (didCancelRef.current) {
      return;
    }
    const trimmed = renameValue.trim();
    if (trimmed.length > 0 && trimmed !== summary.name) {
      onRename?.(summary.id, trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, summary.name, summary.id, onRename]);

  const cancelRename = useCallback((): void => {
    didCancelRef.current = true;
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

  const handleContextMenu = useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
    setMenuOpen(true);
  }, []);

  const handleMenuRename = useCallback((): void => {
    setMenuOpen(false);
    startRename();
  }, [startRename]);

  const handleMenuDuplicate = useCallback((): void => {
    setMenuOpen(false);
    onDuplicate?.(summary.id);
  }, [summary.id, onDuplicate]);

  const handleMenuAddRequest = useCallback((): void => {
    setMenuOpen(false);
    onAddRequest?.(summary.id);
  }, [summary.id, onAddRequest]);

  const handleMenuDelete = useCallback((): void => {
    setMenuOpen(false);
    setDeletePopoverOpen(true);
  }, []);

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
        <div ref={rowRef} className="group/collection" onContextMenu={handleContextMenu}>
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
              <span
                className="text-sm text-text-primary truncate"
                title={summary.name}
                data-test-id={`collection-name-${summary.id}`}
              >
                {displayName}
              </span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span data-test-id={`collection-count-${summary.id}`}>{summary.request_count}</span>
                <span className="text-text-muted/70">•</span>
                <span
                  className="uppercase tracking-wider"
                  data-test-id={`collection-source-${summary.id}`}
                >
                  {summary.source_type}
                </span>
              </div>

              {/* Three-dot menu button — hover-revealed */}
              <div
                className="flex items-center invisible pointer-events-none group-hover/collection:visible group-hover/collection:pointer-events-auto group-focus-within/collection:visible group-focus-within/collection:pointer-events-auto motion-safe:transition-[visibility,opacity] motion-safe:duration-150"
                data-test-id={`collection-actions-${summary.id}`}
              >
                <Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
                  <Menu.Trigger
                    nativeButton={false}
                    render={(props) => (
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon-xs"
                        noScale
                        className="size-5 text-text-muted hover:text-text-primary"
                        data-test-id={`collection-menu-trigger-${summary.id}`}
                        aria-label={`Actions for ${summary.name}`}
                      >
                        <MoreHorizontal size={12} />
                      </Button>
                    )}
                  />
                  <Menu.Portal>
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: OVERLAY_Z_INDEX,
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ pointerEvents: 'auto' }}>
                        <Menu.Positioner sideOffset={4} align="start">
                          <Menu.Popup
                            style={{ zIndex: OVERLAY_Z_INDEX }}
                            className="min-w-[140px] bg-bg-elevated border border-border-default rounded-lg shadow-lg overflow-hidden py-1 animate-in fade-in-0 zoom-in-95"
                            data-test-id={`collection-context-menu-${summary.id}`}
                          >
                            <Menu.Item
                              label="Add Request"
                              className={cn(
                                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer outline-none transition-colors',
                                'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus-visible:bg-bg-raised focus-visible:text-text-primary'
                              )}
                              onClick={handleMenuAddRequest}
                              closeOnClick={true}
                              data-test-id={`collection-menu-add-request-${summary.id}`}
                            >
                              <Plus size={12} className="shrink-0" />
                              <span>Add Request</span>
                            </Menu.Item>
                            <div className="my-1 h-px bg-border-subtle" role="separator" />
                            <Menu.Item
                              label="Rename"
                              className={cn(
                                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer outline-none transition-colors',
                                'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus-visible:bg-bg-raised focus-visible:text-text-primary'
                              )}
                              onClick={handleMenuRename}
                              closeOnClick={true}
                              data-test-id={`collection-menu-rename-${summary.id}`}
                            >
                              <Pencil size={12} className="shrink-0" />
                              <span>Rename</span>
                              <span className="ml-auto text-text-muted text-[10px]">F2</span>
                            </Menu.Item>
                            <Menu.Item
                              label="Duplicate"
                              className={cn(
                                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer outline-none transition-colors',
                                'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus-visible:bg-bg-raised focus-visible:text-text-primary'
                              )}
                              onClick={handleMenuDuplicate}
                              closeOnClick={true}
                              data-test-id={`collection-menu-duplicate-${summary.id}`}
                            >
                              <Copy size={12} className="shrink-0" />
                              <span>Duplicate</span>
                            </Menu.Item>
                            <div className="my-1 h-px bg-border-subtle" role="separator" />
                            <Menu.Item
                              label="Delete"
                              className={cn(
                                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer outline-none transition-colors',
                                'text-signal-error hover:bg-signal-error/10 focus-visible:bg-signal-error/10'
                              )}
                              onClick={handleMenuDelete}
                              closeOnClick={true}
                              data-test-id={`collection-menu-delete-${summary.id}`}
                            >
                              <Trash2 size={12} className="shrink-0" />
                              <span>Delete</span>
                              <span className="ml-auto text-text-muted text-[10px]">Del</span>
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </div>
                    </div>
                  </Menu.Portal>
                </Menu.Root>
              </div>
            </div>
          </div>

          {/* Delete confirmation popover — rendered outside the menu */}
          <Popover open={deletePopoverOpen} onOpenChange={setDeletePopoverOpen}>
            <PopoverContent
              side="right"
              align="start"
              anchor={rowRef}
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
      )}
      {isExpanded && (
        <div className="ml-3 border-l border-border-subtle pb-2" data-test-id="collection-requests">
          <RequestListComposite collectionId={summary.id} requests={sortedRequests} />
        </div>
      )}
    </div>
  );
};
