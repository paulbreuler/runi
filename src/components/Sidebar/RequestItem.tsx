/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useRequestStore } from '@/stores/useRequestStore';
import type { CollectionRequest } from '@/types/collection';
import { isAiGenerated, isBound } from '@/types/collection';
import { methodTextColors, type HttpMethod } from '@/utils/http-colors';
import { cn } from '@/utils/cn';
import { containedFocusRingClasses } from '@/utils/accessibility';
import { focusWithVisibility } from '@/utils/focusVisibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';

interface RequestItemProps {
  request: CollectionRequest;
  collectionId: string;
}

interface CollectionItemRequestListProps {
  requests: CollectionRequest[];
  collectionId: string;
}

export const RequestItem = ({ request, collectionId }: RequestItemProps): React.JSX.Element => {
  const selectedRequestId = useCollectionStore((state) => state.selectedRequestId);
  const isSelected = selectedRequestId === request.id;
  const selectRequest = useCollectionStore((state) => state.selectRequest);
  const setMethod = useRequestStore((state) => state.setMethod);
  const setUrl = useRequestStore((state) => state.setUrl);
  const setHeaders = useRequestStore((state) => state.setHeaders);
  const setBody = useRequestStore((state) => state.setBody);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [popoutPosition, setPopoutPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const rowRef = useRef<HTMLButtonElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const methodKey = request.method as HttpMethod;
  const methodClass =
    methodKey in methodTextColors ? methodTextColors[methodKey] : 'text-text-muted';
  const displayName = truncateNavLabel(request.name);

  const calculatePosition = useCallback((): {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null => {
    if (rowRef.current === null) {
      return null;
    }
    const rect = rowRef.current.getBoundingClientRect();
    // Use Math.round to prevent sub-pixel gaps or "cutting" of the ring
    return {
      top: Math.round(rect.top),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }, []);

  const evaluateTruncation = useCallback((): void => {
    if (textRef.current === null) {
      return;
    }
    const { scrollWidth, clientWidth } = textRef.current;
    setIsTruncated(scrollWidth > clientWidth);
  }, []);

  const updatePopoutPosition = useCallback((): void => {
    const position = calculatePosition();
    if (position !== null) {
      setPopoutPosition(position);
    }
  }, [calculatePosition]);

  const showPopout = useCallback((): void => {
    if (!isTruncated) {
      return;
    }
    updatePopoutPosition();
    setIsExpanded(true);
  }, [isTruncated, updatePopoutPosition]);

  const hidePopout = useCallback((): void => {
    // Only hide if not focused
    if (!isFocused) {
      setIsExpanded(false);
      setPopoutPosition(null);
    }
  }, [isFocused]);

  const handleMouseEnter = useCallback((): void => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(showPopout, 250);
  }, [showPopout]);

  const handleMouseLeave = useCallback((): void => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = null;
    hidePopout();
  }, [hidePopout]);

  const handleFocus = useCallback((): void => {
    setIsFocused(true);
    showPopout();
  }, [showPopout]);

  const handleBlur = useCallback((): void => {
    setIsFocused(false);
    setIsExpanded(false);
    setPopoutPosition(null);
  }, []);

  // Use layout effect for truncation check to catch it before paint
  useLayoutEffect(() => {
    evaluateTruncation();
  }, [evaluateTruncation, request.name]);

  // Use layout effect for position updates to avoid visual jitter
  useLayoutEffect(() => {
    if (isExpanded) {
      updatePopoutPosition();
    }
  }, [isExpanded, updatePopoutPosition]);

  // Continuous positioning loop while focused to handle all types of scroll/shift
  useEffect(() => {
    if (!isFocused || !isExpanded) {
      return undefined;
    }

    let frameId: number;
    const update = (): void => {
      updatePopoutPosition();
      frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);

    return (): void => {
      cancelAnimationFrame(frameId);
    };
  }, [isFocused, isExpanded, updatePopoutPosition]);

  useEffect((): (() => void) | undefined => {
    const handleResize = (): void => {
      evaluateTruncation();
      if (isExpanded) {
        updatePopoutPosition();
      }
    };
    window.addEventListener('resize', handleResize);
    return (): void => {
      window.removeEventListener('resize', handleResize);
    };
  }, [evaluateTruncation, isExpanded, updatePopoutPosition]);

  useEffect((): (() => void) | undefined => {
    return (): void => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  useEffect((): (() => void) | undefined => {
    if (!isExpanded) {
      return undefined;
    }
    const scrollParent = rowRef.current?.closest('[data-scroll-container]');
    if (scrollParent === null || scrollParent === undefined) {
      return undefined;
    }
    const handleScroll = (): void => {
      if (isFocused) {
        // Position is handled by continuous loop while focused
      } else {
        hidePopout();
      }
    };
    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    return (): void => {
      scrollParent.removeEventListener('scroll', handleScroll);
    };
  }, [hidePopout, isExpanded, isFocused, updatePopoutPosition]);

  return (
    <>
      <button
        ref={rowRef}
        type="button"
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors',
          isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/50',
          !isExpanded && containedFocusRingClasses,
          // Suppress all focus ring/outline when expanded so it doesn't "cut" the popout
          isExpanded && 'outline-none ring-0 shadow-none',
          isExpanded && !isFocused && 'bg-bg-raised/30'
        )}
        data-test-id={`collection-request-${request.id}`}
        data-active={isSelected || undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={(e) => {
          focusWithVisibility(e.currentTarget);
          selectRequest(collectionId, request.id);
          setMethod(request.method);
          setUrl(request.url);
          setHeaders(request.headers);
          setBody(request.body?.content ?? '');
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isBound(request) && (
            <span
              className="h-2 w-2 rounded-full bg-green-500"
              aria-label="Bound to spec"
              data-test-id="request-bound-indicator"
            />
          )}
          <span className={cn('text-xs font-semibold uppercase tracking-wider', methodClass)}>
            {request.method}
          </span>
          <span
            ref={textRef}
            className="text-sm text-text-primary truncate"
            data-test-id="request-name"
            title={request.name}
          >
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {request.is_streaming && (
            <span
              className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-500"
              data-test-id="request-streaming-badge"
            >
              <Radio size={12} />
              Streaming
            </span>
          )}
          {isAiGenerated(request) && (
            <span
              className="flex items-center gap-1 rounded-full bg-[#6EB1D1]/10 px-2 py-0.5 text-xs text-[#6EB1D1]"
              data-test-id="request-ai-badge"
            >
              <Sparkles size={12} />
              AI
            </span>
          )}
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && popoutPosition !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            role="tooltip"
            className="pointer-events-none overflow-visible"
            data-test-id="request-popout"
            style={{
              position: 'fixed',
              top: popoutPosition.top,
              left: popoutPosition.left,
              minWidth: popoutPosition.width,
              height: popoutPosition.height,
              maxWidth: 'min(600px, calc(100vw - 40px))',
              zIndex: 60,
              willChange: 'transform, opacity, top, left',
            }}
          >
            <div
              className={cn(
                'flex items-center gap-2 px-3 h-full rounded-md border border-border-subtle bg-bg-elevated shadow-xl backdrop-blur-md min-w-0',
                isFocused && 'ring-[1.5px] ring-[color:var(--accent-a8)] border-transparent'
              )}
            >
              {isBound(request) && (
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
              )}
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-wider shrink-0',
                  methodClass
                )}
              >
                {request.method}
              </span>
              <span className="text-sm text-text-primary whitespace-nowrap overflow-hidden text-ellipsis">
                {request.name}
              </span>
              {request.is_streaming && (
                <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-500 shrink-0">
                  <Radio size={12} />
                  Streaming
                </span>
              )}
              {isAiGenerated(request) && (
                <span className="flex items-center gap-1 rounded-full bg-[#6EB1D1]/10 px-2 py-0.5 text-xs text-[#6EB1D1] shrink-0">
                  <Sparkles size={12} />
                  AI
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const CollectionItemRequestList = ({
  requests,
  collectionId,
}: CollectionItemRequestListProps): React.JSX.Element => {
  if (requests.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-text-muted" data-test-id="collection-empty-requests">
        No requests yet
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {requests.map((request) => (
        <RequestItem key={request.id} request={request} collectionId={collectionId} />
      ))}
    </div>
  );
};
