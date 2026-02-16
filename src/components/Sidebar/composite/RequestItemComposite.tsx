/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { Copy, Link, MoreHorizontal, Pencil, Radio, Sparkles, Trash2 } from 'lucide-react';
import { useCollectionStore } from '@/stores/useCollectionStore';
import type { CollectionRequest } from '@/types/collection';
import { isAiGenerated, isBound } from '@/types/collection';
import { methodTextColors, type HttpMethod } from '@/utils/http-colors';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { focusWithVisibility } from '@/utils/focusVisibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';
import { globalEventBus, logEventFlow } from '@/events/bus';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent } from '@/components/ui/Popover';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';

export interface RequestItemCompositeProps {
  request: CollectionRequest;
  collectionId: string;
  className?: string;
  onDelete?: (collectionId: string, requestId: string) => void;
  onRename?: (collectionId: string, requestId: string, newName: string) => void;
  onDuplicate?: (collectionId: string, requestId: string) => void;
}

const menuItemClasses =
  'flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer outline-none data-[highlighted]:bg-bg-raised/60 text-text-primary';

const menuPopupClasses =
  'min-w-[160px] rounded-md border border-border-default bg-bg-elevated p-1 shadow-lg outline-none';

/**
 * A sidebar item for API requests with a three-dot context menu for actions.
 */
export const RequestItemComposite = ({
  request,
  collectionId,
  className,
  onDelete,
  onRename,
  onDuplicate,
}: RequestItemCompositeProps): React.JSX.Element => {
  const selectedRequestId = useCollectionStore((state) => state.selectedRequestId);
  const isSelected = selectedRequestId === request.id;
  const selectRequest = useCollectionStore((state) => state.selectRequest);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<{
    getBoundingClientRect: () => DOMRect;
  } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const didCancelRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Reset cancel flag when entering rename mode
  useEffect(() => {
    if (isRenaming) {
      didCancelRef.current = false;
    }
  }, [isRenaming]);

  const methodKey = request.method as HttpMethod;
  const methodClass =
    methodKey in methodTextColors ? methodTextColors[methodKey] : 'text-text-muted';
  const displayName = truncateNavLabel(request.name);

  const isAiDraft = isAiGenerated(request) && request.intelligence.verified !== true;

  const handleSelect = useCallback((): void => {
    selectRequest(collectionId, request.id);

    const event = globalEventBus.emit(
      'collection.request-selected',
      {
        collectionId,
        request,
      },
      'RequestItemComposite'
    );

    logEventFlow('emit', 'collection.request-selected', event.correlationId, {
      requestId: request.id,
      collectionId,
      requestName: request.name,
    });
  }, [collectionId, request, selectRequest]);

  const startRename = useCallback((): void => {
    setRenameValue(request.name);
    setIsRenaming(true);
    requestAnimationFrame(() => {
      if (renameInputRef.current !== null) {
        focusWithVisibility(renameInputRef.current);
        renameInputRef.current.select();
      }
    });
  }, [request.name]);

  const commitRename = useCallback((): void => {
    if (didCancelRef.current) {
      return;
    }
    const trimmed = renameValue.trim();
    if (trimmed.length > 0 && trimmed !== request.name) {
      onRename?.(collectionId, request.id, trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, request.name, request.id, collectionId, onRename]);

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
    onDelete?.(collectionId, request.id);
    setDeletePopoverOpen(false);
  }, [collectionId, request.id, onDelete]);

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
    e.stopPropagation();
    const x = e.clientX;
    const y = e.clientY;
    setContextMenuAnchor({
      getBoundingClientRect: () => new DOMRect(x, y, 0, 0),
    });
    setMenuOpen(true);
  }, []);

  const handleMenuRename = useCallback((): void => {
    setMenuOpen(false);
    setContextMenuAnchor(null);
    // Defer startRename so the menu fully unmounts before rename mode activates
    requestAnimationFrame(() => {
      startRename();
    });
  }, [startRename]);

  const handleMenuDuplicate = useCallback((): void => {
    setMenuOpen(false);
    setContextMenuAnchor(null);
    onDuplicate?.(collectionId, request.id);
  }, [collectionId, request.id, onDuplicate]);

  const handleMenuDelete = useCallback((): void => {
    setMenuOpen(false);
    setContextMenuAnchor(null);
    setDeletePopoverOpen(true);
  }, []);

  const handleMenuOpenChange = useCallback((open: boolean): void => {
    setMenuOpen(open);
    if (!open) {
      setContextMenuAnchor(null);
    }
  }, []);

  if (isRenaming) {
    return (
      <div className={cn('relative w-full px-1', className)}>
        <div className="flex items-center gap-2 px-2 py-1 min-h-[28px]">
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-widest shrink-0 min-w-[28px]',
              methodClass
            )}
          >
            {request.method}
          </span>
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
            data-test-id={`request-rename-input-${request.id}`}
            aria-label={`Rename request ${request.name}`}
          />
        </div>
      </div>
    );
  }

  return (
    <Tooltip
      content={request.name}
      delayDuration={100}
      data-test-id={`request-tooltip-${request.id}`}
    >
      <div
        ref={rowRef}
        className={cn('relative w-full px-1 group/request', className)}
        onContextMenu={handleContextMenu}
      >
        <div
          className={cn(
            'w-full flex items-center justify-between gap-2 px-2 py-1 transition-colors min-h-[28px] rounded-md',
            isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40'
          )}
        >
          <button
            type="button"
            aria-label={`Select request ${request.method} ${request.name}`}
            className={cn(
              'flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer bg-transparent border-none p-0',
              focusRingClasses
            )}
            data-test-id={`request-select-${request.id}`}
            data-active={isSelected || undefined}
            data-nav-item="true"
            onClick={(e): void => {
              (e.currentTarget as HTMLElement).focus({ preventScroll: true });
              handleSelect();
            }}
            onKeyDown={handleRowKeyDown}
          >
            {isAiGenerated(request) && (
              <Sparkles
                size={10}
                className={cn('shrink-0', isAiDraft ? 'text-signal-ai' : 'text-text-muted')}
              />
            )}

            {isBound(request) && <Link size={10} className="shrink-0 text-accent-blue" />}

            {request.is_streaming && <Radio size={10} className="shrink-0 text-accent-purple" />}

            <span
              className={cn(
                'text-[10px] font-bold uppercase tracking-widest shrink-0 min-w-[28px]',
                methodClass
              )}
            >
              {request.method}
            </span>

            <span
              className="text-sm text-text-primary truncate block flex-1 min-w-0"
              data-test-id="request-name"
            >
              {displayName}
            </span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Three-dot menu trigger — visible on hover/focus */}
            <div
              className={cn(
                'flex items-center',
                menuOpen
                  ? 'visible pointer-events-auto'
                  : 'invisible pointer-events-none group-hover/request:visible group-hover/request:pointer-events-auto group-focus-within/request:visible group-focus-within/request:pointer-events-auto',
                'motion-safe:transition-[visibility,opacity] motion-safe:duration-150'
              )}
              data-test-id={`request-actions-${request.id}`}
            >
              <Menu.Root open={menuOpen} onOpenChange={handleMenuOpenChange}>
                <Menu.Trigger
                  ref={triggerRef}
                  nativeButton={false}
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      noScale
                      className="size-5 text-text-muted hover:text-text-primary"
                      data-test-id={`request-menu-trigger-${request.id}`}
                      aria-label={`Actions for ${request.name}`}
                    />
                  }
                >
                  <MoreHorizontal size={12} />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner
                    side={contextMenuAnchor !== null ? 'bottom' : 'right'}
                    align="start"
                    sideOffset={4}
                    anchor={contextMenuAnchor ?? undefined}
                  >
                    <Menu.Popup
                      className={menuPopupClasses}
                      style={{ zIndex: OVERLAY_Z_INDEX }}
                      data-test-id={
                        contextMenuAnchor !== null
                          ? `request-context-menu-${request.id}`
                          : `request-menu-${request.id}`
                      }
                    >
                      <Menu.Item
                        className={menuItemClasses}
                        onClick={handleMenuRename}
                        data-test-id={`request-menu-rename-${request.id}`}
                      >
                        <Pencil size={14} className="text-text-muted" />
                        Rename
                      </Menu.Item>
                      <Menu.Item
                        className={menuItemClasses}
                        onClick={handleMenuDuplicate}
                        data-test-id={`request-menu-duplicate-${request.id}`}
                      >
                        <Copy size={14} className="text-text-muted" />
                        Duplicate
                      </Menu.Item>
                      <Menu.Item
                        className={cn(menuItemClasses, 'text-signal-error')}
                        onClick={handleMenuDelete}
                        data-test-id={`request-menu-delete-${request.id}`}
                      >
                        <Trash2 size={14} />
                        Delete
                      </Menu.Item>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>
          </div>
        </div>

        {/* Delete confirmation popover — shared between menu and keyboard shortcut */}
        <Popover open={deletePopoverOpen} onOpenChange={setDeletePopoverOpen}>
          <PopoverContent
            side="right"
            align="start"
            anchor={rowRef}
            className="w-56 p-3"
            data-test-id={`request-delete-confirm-${request.id}`}
          >
            <p className="text-sm text-text-primary mb-3">
              Delete <span className="font-medium">{request.name}</span>?
            </p>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="xs"
                noScale
                onClick={() => {
                  setDeletePopoverOpen(false);
                }}
                data-test-id={`request-delete-cancel-${request.id}`}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="xs"
                noScale
                onClick={handleDelete}
                data-test-id={`request-delete-confirm-btn-${request.id}`}
              >
                Delete
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </Tooltip>
  );
};
