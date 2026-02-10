/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useRef, useState, useLayoutEffect } from 'react';
import { Check, Radio, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Popover } from '@base-ui/react/popover';
import { useCollectionStore } from '@/stores/useCollectionStore';
import type { CollectionRequest } from '@/types/collection';
import { isAiGenerated, isBound } from '@/types/collection';
import { methodTextColors, type HttpMethod } from '@/utils/http-colors';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';
import { globalEventBus } from '@/events/bus';

export interface RequestItemCompositeProps {
  request: CollectionRequest;
  collectionId: string;
  className?: string;
}

/**
 * A composite sidebar item for API requests.
 * Uses a layered hit-area pattern to avoid nested buttons while supporting
 * multiple interactive zones (Select vs. Accept AI).
 */
export const RequestItemComposite = ({
  request,
  collectionId,
  className,
}: RequestItemCompositeProps): React.JSX.Element => {
  const selectedRequestId = useCollectionStore((state) => state.selectedRequestId);
  const isSelected = selectedRequestId === request.id;
  const selectRequest = useCollectionStore((state) => state.selectRequest);

  const [isHovered, setIsHovered] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLSpanElement | null>(null);

  const methodKey = request.method as HttpMethod;
  const methodClass =
    methodKey in methodTextColors ? methodTextColors[methodKey] : 'text-text-muted';
  const displayName = truncateNavLabel(request.name);

  const isAiDraft = isAiGenerated(request) && request.intelligence.verified !== true;
  const isAiVerified = isAiGenerated(request) && request.intelligence.verified === true;

  const evaluateTruncation = useCallback((): void => {
    if (textRef.current === null) {
      return;
    }
    const { scrollWidth, clientWidth } = textRef.current;
    setIsTruncated(scrollWidth > clientWidth + 1);
  }, []);

  useLayoutEffect(() => {
    evaluateTruncation();
    const observer = new ResizeObserver(() => {
      evaluateTruncation();
    });
    if (textRef.current !== null) {
      observer.observe(textRef.current);
    }
    return (): void => {
      observer.disconnect();
    };
  }, [evaluateTruncation, request.name]);

  const handleSelect = useCallback((): void => {
    selectRequest(collectionId, request.id);
    globalEventBus.emit('collection.request-selected', { collectionId, request });
  }, [collectionId, request, selectRequest]);

  const handleAcceptAi = useCallback(
    (e: React.MouseEvent): void => {
      e.stopPropagation();
      globalEventBus.emit('request.accept-ai', {
        collectionId,
        requestId: request.id,
      });
    },
    [collectionId, request.id]
  );

  return (
    <div
      className={cn(
        'group relative flex items-center min-h-[28px] px-2 py-0.5 transition-all duration-200',
        isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40',
        isAiDraft && 'border border-signal-ai/25 bg-signal-ai/[0.03] rounded-md mx-1 my-0.5',
        className
      )}
      onMouseEnter={(): void => {
        setIsHovered(true);
      }}
      onMouseLeave={(): void => {
        setIsHovered(false);
      }}
      role="none"
    >
      {/* Primary Hit Area - Background Button */}
      <button
        type="button"
        className={cn(
          'absolute inset-0 w-full h-full text-left cursor-pointer z-0',
          focusRingClasses,
          isAiDraft && 'rounded-md'
        )}
        onClick={handleSelect}
        aria-label={`Select request ${request.method} ${request.name}`}
        data-test-id={`request-select-${request.id}`}
      />

      {/* Content Layer - Pointer Events None except for buttons */}
      <div className="relative flex items-center justify-between gap-2 w-full z-10 pointer-events-none">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isBound(request) && (
            <div className="shrink-0 w-3 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-success shadow-[0_0_4px_rgba(34,197,94,0.4)]" />
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

          <Popover open={isHovered && isTruncated}>
            <Popover.Trigger
              ref={textRef}
              className="text-sm text-text-primary truncate block pointer-events-none"
            >
              {displayName}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner side="right" sideOffset={8} align="center">
                <Popover.Content className="glass px-2 py-1 text-sm text-text-primary z-100 max-w-md break-all">
                  {request.name}
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover>
        </div>

        {/* Secondary Actions Area */}
        <div className="flex items-center gap-1.5 shrink-0">
          <AnimatePresence mode="popLayout">
            {isAiDraft && (
              <motion.button
                key="accept-button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                type="button"
                className="pointer-events-auto flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-signal-success/10 text-signal-success border border-signal-success/20 hover:bg-signal-success/20 transition-colors text-[10px] font-semibold"
                onClick={handleAcceptAi}
                title="Accept AI changes"
              >
                <Check size={10} />
                Accept
              </motion.button>
            )}

            {(isAiDraft || isAiVerified) && (
              <motion.div
                key="ai-indicator"
                className={cn(
                  'flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold shrink-0',
                  isAiDraft ? 'bg-signal-ai/10 text-signal-ai' : 'text-text-muted'
                )}
              >
                <Sparkles size={10} />
                {isAiDraft && 'AI'}
              </motion.div>
            )}

            {request.is_streaming && (
              <div className="flex items-center gap-1 rounded-full bg-accent-purple/10 px-1.5 py-0.5 text-[10px] text-accent-purple shrink-0 font-semibold">
                <Radio size={10} />
                Stream
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
