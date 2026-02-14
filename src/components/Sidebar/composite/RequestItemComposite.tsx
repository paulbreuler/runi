/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useRef, useState } from 'react';
import { Pencil, Radio, Sparkles, Trash2 } from 'lucide-react';
import { useCollectionStore } from '@/stores/useCollectionStore';
import type { CollectionRequest } from '@/types/collection';
import { isAiGenerated, isBound } from '@/types/collection';
import { methodTextColors, type HttpMethod } from '@/utils/http-colors';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';
import { globalEventBus, logEventFlow } from '@/events/bus';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';

export interface RequestItemCompositeProps {
  request: CollectionRequest;
  collectionId: string;
  className?: string;
  onDelete?: (collectionId: string, requestId: string) => void;
  onRename?: (collectionId: string, requestId: string, newName: string) => void;
}

/**
 * A sidebar item for API requests with hover-revealed rename and delete actions.
 */
export const RequestItemComposite = ({
  request,
  collectionId,
  className,
  onDelete,
  onRename,
}: RequestItemCompositeProps): React.JSX.Element => {
  const selectedRequestId = useCollectionStore((state) => state.selectedRequestId);
  const isSelected = selectedRequestId === request.id;
  const selectRequest = useCollectionStore((state) => state.selectRequest);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

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
      renameInputRef.current?.select();
    });
  }, [request.name]);

  const commitRename = useCallback((): void => {
    const trimmed = renameValue.trim();
    if (trimmed.length > 0 && trimmed !== request.name) {
      onRename?.(collectionId, request.id, trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, request.name, request.id, collectionId, onRename]);

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
      <div className={cn('relative w-full px-1 group/request', className)}>
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

            {isBound(request) && (
              <div className="shrink-0 w-3 flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-signal-success" />
              </div>
            )}

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
            {request.is_streaming && (
              <div className="flex items-center gap-1 rounded-full bg-accent-purple/10 px-1.5 py-0.5 text-[10px] text-accent-purple shrink-0 font-semibold">
                <Radio size={10} />
                Stream
              </div>
            )}

            {/* Hover-revealed action buttons — far right, siblings of the select button */}
            <div
              className="flex items-center gap-0.5 opacity-0 group-hover/request:opacity-100 transition-opacity duration-150"
              data-test-id={`request-actions-${request.id}`}
            >
              <Button
                variant="ghost"
                size="icon-xs"
                noScale
                className="size-5 text-text-muted hover:text-text-primary"
                onClick={startRename}
                data-test-id={`request-rename-${request.id}`}
                aria-label={`Rename ${request.name}`}
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
                      data-test-id={`request-delete-${request.id}`}
                      aria-label={`Delete ${request.name}`}
                    />
                  }
                >
                  <Trash2 size={10} />
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
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
          </div>
        </div>
      </div>
    </Tooltip>
  );
};
