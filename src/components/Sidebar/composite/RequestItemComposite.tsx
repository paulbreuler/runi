/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
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
 * Uses a fixed-position overlay pattern (matching production RequestItem)
 * to expand truncated names on hover without ghosting artifacts.
 */
export const RequestItemComposite = ({
  request,
  collectionId,
  className,
}: RequestItemCompositeProps): React.JSX.Element => {
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

  const isAiDraft = isAiGenerated(request) && request.intelligence.verified !== true;
  const isAiVerified = isAiGenerated(request) && request.intelligence.verified === true;

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
    setIsTruncated(scrollWidth > clientWidth + 1);
  }, []);

  const updatePopoutPosition = useCallback((): void => {
    const position = calculatePosition();
    if (position !== null) {
      setPopoutPosition(position);
    }
  }, [calculatePosition]);

  const showPopout = useCallback((): void => {
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

  // 250ms hover delay
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

  useLayoutEffect((): void => {
    evaluateTruncation();
  }, [evaluateTruncation, request.name]);

  // ResizeObserver for truncation tracking
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

  // Scroll/resize position tracking
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

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, true);

    return (): void => {
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId);
      }
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, true);
    };
  }, [isActuallyVisible, updatePopoutPosition]);

  // Cleanup timeout on unmount
  useEffect((): (() => void) | undefined => {
    return (): void => {
      if (hoverTimeoutRef.current !== null) {
        window.clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Scroll-dismiss
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

  const handleSelect = useCallback((): void => {
    setIsExpanded(false);
    setPopoutPosition(null);
    selectRequest(collectionId, request.id);
    globalEventBus.emit('collection.request-selected', { collectionId, request });
  }, [collectionId, request, selectRequest]);

  const handleFocus = useCallback((): void => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((): void => {
    setIsFocused(false);
    setIsExpanded(false);
    setPopoutPosition(null);
  }, []);

  const renderContent = (isPopout = false): React.JSX.Element => (
    <div
      className={cn('flex items-center gap-2 w-full h-full px-2', isPopout && 'whitespace-nowrap')}
    >
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

        <span
          ref={isPopout ? null : textRef}
          className={cn('text-sm text-text-primary', !isPopout && 'truncate block')}
        >
          {isPopout ? request.name : displayName}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {(isAiDraft || isAiVerified) && (
          <Sparkles size={10} className={isAiDraft ? 'text-signal-ai' : 'text-text-muted'} />
        )}

        {request.is_streaming && (
          <div className="flex items-center gap-1 rounded-full bg-accent-purple/10 px-1.5 py-0.5 text-[10px] text-accent-purple shrink-0 font-semibold">
            <Radio size={10} />
            Stream
          </div>
        )}
      </div>
    </div>
  );

  const actuallyVisible = isActuallyVisible();

  return (
    <div
      className={cn('relative w-full', className)}
      onMouseEnter={(): void => {
        setIsHovered(true);
      }}
      onMouseLeave={(): void => {
        setIsHovered(false);
      }}
    >
      {/* div[role=button] avoids invalid nested <button> when action slot contains a <button> */}
      <div
        ref={rowRef}
        role="button"
        tabIndex={0}
        aria-label={`Select request ${request.method} ${request.name}`}
        className={cn(
          'w-full flex items-center justify-between gap-2 py-1 text-left transition-colors min-h-[28px] cursor-pointer',
          isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40',
          // Suppress focus ring when popout is visible — the popout visually replaces the row,
          // so a double ring would be confusing.
          actuallyVisible ? 'outline-none ring-0 shadow-none' : focusRingClasses,
          actuallyVisible && !isFocused && 'bg-transparent',
          isAiDraft && 'border border-signal-ai/25 bg-signal-ai/[0.03] rounded-md mx-1 my-0.5'
        )}
        data-test-id={`request-select-${request.id}`}
        data-active={isSelected || undefined}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={(e): void => {
          (e.currentTarget as HTMLElement).focus({ preventScroll: true });
          handleSelect();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect();
          }
        }}
      >
        <div className={cn('flex items-center w-full', actuallyVisible && 'invisible')}>
          {renderContent()}
        </div>
      </div>

      <AnimatePresence>
        {actuallyVisible && popoutPosition !== null && (
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
            className={cn(
              'pointer-events-none overflow-hidden bg-bg-elevated',
              isAiDraft && 'border border-signal-ai/40 rounded-md'
            )}
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
            <div className="flex items-center h-full">{renderContent(true)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
