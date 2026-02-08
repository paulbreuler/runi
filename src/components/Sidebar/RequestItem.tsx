/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useRequestStore } from '@/stores/useRequestStore';
import type { CollectionRequest } from '@/types/collection';
import { isAiGenerated, isBound } from '@/types/collection';
import { methodTextColors, type HttpMethod } from '@/utils/http-colors';
import { cn } from '@/utils/cn';
import { containedFocusRingClasses } from '@/utils/accessibility';
import { focusWithVisibility } from '@/utils/focusVisibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';
import { Tooltip } from '@/components/ui/Tooltip';

interface RequestItemProps {
  request: CollectionRequest;
  collectionId: string;
}

interface CollectionItemRequestListProps {
  requests: CollectionRequest[];
  collectionId: string;
}

const MAX_EXPANDED_CHARS = 80;

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
  const [isHovered, setIsHovered] = useState(false);
  const [isOccluded, setIsOccluded] = useState(false);
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
  const shouldReduceMotion = useReducedMotion();

  const methodKey = request.method as HttpMethod;
  const methodClass =
    methodKey in methodTextColors ? methodTextColors[methodKey] : 'text-text-muted';
  const displayName = truncateNavLabel(request.name);

  // Expansion triggers if name.length > 100
  const isTooLong = request.name.length > MAX_EXPANDED_CHARS;
  const expandedDisplayName = truncateNavLabel(request.name, MAX_EXPANDED_CHARS);

  // Occlusion detection: hide popout if the item scrolls out of view
  useEffect(() => {
    const row = rowRef.current;
    if (row === null) {
      return undefined;
    }

    const scrollParent = row.closest('[data-scroll-container]');
    if (scrollParent === null) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]): void => {
        setIsOccluded(entry !== undefined && entry.intersectionRatio < 0.95);
      },
      {
        root: scrollParent,
        threshold: [0, 0.95, 1.0],
      }
    );

    observer.observe(row);
    return (): void => {
      observer.disconnect();
    };
  }, []);

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
    // Use 1px buffer for robustness against subpixel rounding
    setIsTruncated(scrollWidth > clientWidth + 1);
  }, []);

  const updatePopoutPosition = useCallback((): void => {
    const position = calculatePosition();
    if (position !== null) {
      setPopoutPosition(position);
    }
  }, [calculatePosition]);

  const showPopout = useCallback((): void => {
    evaluateTruncation();
    updatePopoutPosition();
    setIsExpanded(true);
  }, [evaluateTruncation, updatePopoutPosition]);

  const hidePopout = useCallback((): void => {
    if (!isFocused) {
      setIsExpanded(false);
      setPopoutPosition(null);
    }
  }, [isFocused]);

  useEffect(() => {
    if (isHovered || isFocused) {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = window.setTimeout(() => {
        showPopout();
      }, 150);
    } else {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      hidePopout();
    }
    return (): void => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [isHovered, isFocused, showPopout, hidePopout]);

  const handleMouseEnter = useCallback((): void => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback((): void => {
    setIsHovered(false);
  }, []);

  const handleFocus = useCallback((): void => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((): void => {
    setIsFocused(false);
    setIsExpanded(false);
    setPopoutPosition(null);
  }, []);

  useLayoutEffect(() => {
    evaluateTruncation();
  }, [evaluateTruncation, request.name]);

  // Use ResizeObserver to reliably track truncation as sidebar resizes
  useLayoutEffect(() => {
    const el = textRef.current;
    if (el === null) {
      return undefined;
    }
    const observer = new ResizeObserver(() => {
      evaluateTruncation();
    });
    observer.observe(el);
    return (): void => {
      observer.disconnect();
    };
  }, [evaluateTruncation]);

  useLayoutEffect(() => {
    if (isExpanded) {
      updatePopoutPosition();
    }
  }, [isExpanded, updatePopoutPosition]);

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
      if (!isFocused) {
        hidePopout();
      }
    };
    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    return (): void => {
      scrollParent.removeEventListener('scroll', handleScroll);
    };
  }, [hidePopout, isExpanded, isFocused]);

  const actuallyVisible = isExpanded && !isOccluded && isTruncated;

  const handleAction = (): void => {
    selectRequest(collectionId, request.id);
    setMethod(request.method);
    setUrl(request.url);
    setHeaders(request.headers);
    setBody(request.body?.content ?? '');
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={rowRef}
        type="button"
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-1 text-left transition-colors',
          isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40',
          !actuallyVisible && containedFocusRingClasses,
          actuallyVisible && 'outline-none ring-0 shadow-none',
          actuallyVisible && !isFocused && 'bg-transparent'
        )}
        data-test-id={`collection-request-${request.id}`}
        data-active={isSelected || undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={(e) => {
          focusWithVisibility(e.currentTarget);
          handleAction();
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isBound(request) && (
            <div className="flex items-center justify-center shrink-0 w-3" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-green-500" />
            </div>
          )}
          <span
            className={cn(
              'text-xs font-semibold uppercase tracking-wider shrink-0 min-w-[28px]',
              methodClass
            )}
          >
            {request.method}
          </span>
          <span
            ref={textRef}
            className="text-sm text-text-primary truncate"
            data-test-id="request-name"
          >
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {request.is_streaming && (
            <span
              className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-500 shrink-0"
              data-test-id="request-streaming-badge"
            >
              <Radio size={12} />
              Streaming
            </span>
          )}
          {isAiGenerated(request) && (
            <span
              className="flex items-center gap-1 rounded-full bg-[#6EB1D1]/10 px-2 py-0.5 text-xs text-[#6EB1D1] shrink-0"
              data-test-id="request-ai-badge"
            >
              <Sparkles size={12} />
              AI
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {actuallyVisible && popoutPosition !== null && (
          <motion.div
            initial={{ width: popoutPosition.width }}
            animate={{ width: 'auto' }}
            exit={{ width: popoutPosition.width, transition: { duration: 0 } }}
            transition={
              shouldReduceMotion === true
                ? { duration: 0 }
                : { type: 'spring', stiffness: 1000, damping: 50, mass: 0.5 }
            }
            role="tooltip"
            className="pointer-events-none overflow-hidden"
            data-test-id="request-popout"
            style={{
              position: 'fixed',
              top: popoutPosition.top,
              left: popoutPosition.left,
              height: popoutPosition.height,
              zIndex: 60,
              maxWidth: 'min(600px, calc(100vw - 40px))',
              backgroundColor: isSelected ? '#1C2C3E' : '#1E1E1E',
            }}
            onClick={(e) => {
              e.stopPropagation();
              rowRef.current?.focus();
              handleAction();
            }}
          >
            <div className="flex items-center gap-2 px-3 h-full whitespace-nowrap min-w-0">
              {isBound(request) && (
                <div className="flex items-center justify-center shrink-0 w-3" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </div>
              )}
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-wider shrink-0 min-w-[28px]',
                  methodClass
                )}
              >
                {request.method}
              </span>
              <div className="flex-1 min-w-0">
                {isTooLong ? (
                  <Tooltip content={request.name} delayDuration={250}>
                    <span className="text-sm text-text-primary truncate block">
                      {expandedDisplayName}
                    </span>
                  </Tooltip>
                ) : (
                  <span className="text-sm text-text-primary truncate block">{request.name}</span>
                )}
              </div>
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

            {isFocused && (
              <div className="absolute inset-0 pointer-events-none ring-[1.5px] ring-[color:var(--accent-a8)] ring-inset" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
