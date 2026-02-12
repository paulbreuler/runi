/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { useCollectionStore } from '@/stores/useCollectionStore';
import type { CollectionRequest } from '@/types/collection';
import { isAiGenerated, isBound } from '@/types/collection';
import { methodTextColors, type HttpMethod } from '@/utils/http-colors';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';
import { globalEventBus, logEventFlow } from '@/events/bus';
import { Tooltip } from '@/components/ui/Tooltip';

export interface RequestItemCompositeProps {
  request: CollectionRequest;
  collectionId: string;
  className?: string;
}

/**
 * A simplified sidebar item for API requests.
 * Removed over-engineered hover expansion in favor of standard tooltips.
 */
export const RequestItemComposite = ({
  request,
  collectionId,
  className,
}: RequestItemCompositeProps): React.JSX.Element => {
  const selectedRequestId = useCollectionStore((state) => state.selectedRequestId);
  const isSelected = selectedRequestId === request.id;
  const selectRequest = useCollectionStore((state) => state.selectRequest);

  const methodKey = request.method as HttpMethod;
  const methodClass =
    methodKey in methodTextColors ? methodTextColors[methodKey] : 'text-text-muted';
  const displayName = truncateNavLabel(request.name);

  const isAiDraft = isAiGenerated(request) && request.intelligence.verified !== true;

  const handleSelect = useCallback((): void => {
    selectRequest(collectionId, request.id);

    // Propagate event for other components (like RequestPanel) to react
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

  return (
    <Tooltip
      content={request.name}
      delayDuration={100}
      data-test-id={`request-tooltip-${request.id}`}
    >
      <div className={cn('relative w-full px-1', className)}>
        <button
          type="button"
          aria-label={`Select request ${request.method} ${request.name}`}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-2 py-1 text-left transition-colors min-h-[28px] cursor-pointer rounded-md',
            isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40',
            focusRingClasses,
            isAiDraft && 'border border-signal-ai/25 bg-signal-ai/[0.03] my-0.5'
          )}
          data-test-id={`request-select-${request.id}`}
          data-active={isSelected || undefined}
          data-nav-item="true"
          onClick={(e): void => {
            (e.currentTarget as HTMLElement).focus({ preventScroll: true });
            handleSelect();
          }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
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
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isAiGenerated(request) && (
              <Sparkles size={10} className={isAiDraft ? 'text-signal-ai' : 'text-text-muted'} />
            )}

            {request.is_streaming && (
              <div className="flex items-center gap-1 rounded-full bg-accent-purple/10 px-1.5 py-0.5 text-[10px] text-accent-purple shrink-0 font-semibold">
                <Radio size={10} />
                Stream
              </div>
            )}
          </div>
        </button>
      </div>
    </Tooltip>
  );
};
