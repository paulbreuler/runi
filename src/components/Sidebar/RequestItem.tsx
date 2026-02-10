/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { globalEventBus } from '@/events/bus';
import { useCollectionStore } from '@/stores/useCollectionStore';
import type { CollectionRequest } from '@/types/collection';
import { isAiGenerated, isBound } from '@/types/collection';
import { methodTextColors, type HttpMethod } from '@/utils/http-colors';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
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

  const rowRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const methodKey = request.method as HttpMethod;
  const methodClass =
    methodKey in methodTextColors ? methodTextColors[methodKey] : 'text-text-muted';
  const displayName = truncateNavLabel(request.name);
  const isGhostNode = isAiGenerated(request) && request.intelligence.verified !== true;

  // Occlusion detection: hide popout if the item scrolls out of view
  useEffect((): (() => void) | undefined => {
    const row = rowRef.current;
    if (row === null || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const scrollParent = row.closest('[data-scroll-container]');
    if (scrollParent === null) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]): void => {
        // Only occlude if mostly hidden (less than 10% visible)
        // This prevents items at the very bottom of the scroll container from being blocked
        setIsOccluded(entry !== undefined && entry.intersectionRatio < 0.1);
      },
      {
        root: scrollParent,
        threshold: [0, 0.1, 1.0],
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
    // Bail early if selected (popout won't render) or text isn't truncated
    if (isSelected) {
      return;
    }
    evaluateTruncation();
    if (textRef.current !== null) {
      const { scrollWidth, clientWidth } = textRef.current;
      if (scrollWidth <= clientWidth + 1) {
        return;
      }
    }
    updatePopoutPosition();
    setIsExpanded(true);
  }, [evaluateTruncation, updatePopoutPosition, isSelected]);

  const hidePopout = useCallback((): void => {
    if (!isFocused) {
      setIsExpanded(false);
      setPopoutPosition(null);
    }
  }, [isFocused]);

  useEffect((): (() => void) => {
    if (isHovered || isFocused) {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = window.setTimeout(() => {
        showPopout();
      }, 250);
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

  useLayoutEffect((): void => {
    evaluateTruncation();
  }, [evaluateTruncation, request.name]);

  // Use ResizeObserver to reliably track truncation as sidebar resizes
  useLayoutEffect((): (() => void) | undefined => {
    const el = textRef.current;
    if (el === null || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver((): void => {
      evaluateTruncation();
    });
    observer.observe(el);
    return (): void => {
      observer.disconnect();
    };
  }, [evaluateTruncation]);

  const isActuallyVisible = useCallback(
    (): boolean => isExpanded && !isOccluded && isTruncated && !isSelected,
    [isExpanded, isOccluded, isTruncated, isSelected]
  );

  useEffect((): (() => void) | undefined => {
    if (!isActuallyVisible()) {
      return undefined;
    }

    let frameId: number | undefined;

    const handleUpdate = (): void => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
      frameId = requestAnimationFrame(() => {
        updatePopoutPosition();
        frameId = undefined;
      });
    };

    // Update on scroll or resize
    window.addEventListener('resize', handleUpdate);
    // Use capture for scroll to catch events from any container
    window.addEventListener('scroll', handleUpdate, true);

    return (): void => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isActuallyVisible, updatePopoutPosition]);

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

  const handleAction = (): void => {
    // Close popout immediately on selection so it doesn't obstruct the main UI
    setIsExpanded(false);
    setPopoutPosition(null);

    selectRequest(collectionId, request.id);

    // Propagate event for other components (like RequestPanel) to react
    globalEventBus.emit('collection.request-selected', {
      collectionId,
      request,
    });
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* div[role=button] avoids invalid nested <button> when Accept button is rendered inside */}
      <div
        ref={rowRef}
        role="button"
        tabIndex={0}
        aria-label={`${request.method} ${request.name}`}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-2 py-1 text-left transition-colors cursor-pointer',
          isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40',
          isActuallyVisible() ? 'outline-none ring-0 shadow-none' : focusRingClasses,
          isActuallyVisible() && !isFocused && 'bg-transparent',
          isGhostNode && 'border border-signal-ai/25 rounded-md mx-1 my-0.5',
          isGhostNode && !isSelected && 'bg-signal-ai/[0.03]'
        )}
        data-test-id={`collection-request-${request.id}`}
        data-active={isSelected || undefined}
        data-nav-item="true"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={(e): void => {
          (e.currentTarget as HTMLElement).focus({ preventScroll: true });
          handleAction();
        }}
        onKeyDown={(e): void => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAction();
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isBound(request) && (
            <div
              className="flex items-center justify-center shrink-0 w-3"
              role="img"
              aria-label="Bound to spec"
              title="Bound to spec"
            >
              <span className="h-2 w-2 rounded-full bg-signal-success" />
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
              className="flex items-center gap-1 rounded-full bg-accent-purple/10 px-2 py-0.5 text-xs text-accent-purple shrink-0"
              data-test-id="request-streaming-badge"
            >
              <Radio size={12} />
              Streaming
            </span>
          )}
          {isAiGenerated(request) && (
            <span
              className="flex items-center gap-1 rounded-full bg-signal-ai/10 px-2 py-0.5 text-xs text-signal-ai shrink-0"
              data-test-id="request-ai-badge"
            >
              <Sparkles size={12} />
              AI
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isActuallyVisible() && popoutPosition !== null && (
          <motion.div
            initial={{ width: popoutPosition.width }}
            animate={{ width: 'auto' }}
            exit={{ width: popoutPosition.width, transition: { duration: 0 } }}
            transition={
              shouldReduceMotion === true
                ? { duration: 0 }
                : { type: 'spring', stiffness: 1000, damping: 50, mass: 0.5, delay: 0.1 }
            }
            role="tooltip"
            className="pointer-events-none overflow-hidden bg-bg-elevated"
            data-test-id="request-popout"
            style={{
              position: 'fixed',
              top: popoutPosition.top,
              left: popoutPosition.left,
              height: popoutPosition.height,
              zIndex: 60,
              maxWidth: 'min(600px, calc(100vw - 40px))',
            }}
          >
            <div className="flex items-center gap-2 px-2 h-full whitespace-nowrap min-w-0">
              {isBound(request) && (
                <div
                  className="flex items-center justify-center shrink-0 w-3"
                  role="img"
                  aria-label="Bound to spec"
                  title="Bound to spec"
                >
                  <span className="h-2 w-2 rounded-full bg-signal-success" />
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
                <span className="text-sm text-text-primary truncate block">{request.name}</span>
              </div>
              {request.is_streaming && (
                <span className="flex items-center gap-1 rounded-full bg-accent-purple/10 px-2 py-0.5 text-xs text-accent-purple shrink-0">
                  <Radio size={12} />
                  Streaming
                </span>
              )}
              {isAiGenerated(request) && (
                <span className="flex items-center gap-1 rounded-full bg-signal-ai/10 px-2 py-0.5 text-xs text-signal-ai shrink-0">
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
