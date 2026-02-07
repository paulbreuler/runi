/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useRequestStore } from '@/stores/useRequestStore';
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
  const selectRequest = useCollectionStore((state) => state.selectRequest);
  const setMethod = useRequestStore((state) => state.setMethod);
  const setUrl = useRequestStore((state) => state.setUrl);
  const setHeaders = useRequestStore((state) => state.setHeaders);
  const setBody = useRequestStore((state) => state.setBody);
  const [isExpanded, setIsExpanded] = useState(false);
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
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
  }, []);

  const evaluateTruncation = useCallback((): void => {
    if (textRef.current === null) {
      return;
    }
    const { scrollWidth, clientWidth } = textRef.current;
    setIsTruncated(scrollWidth > clientWidth);
  }, []);

  const showPopout = useCallback((): void => {
    if (!isTruncated) {
      return;
    }
    const position = calculatePosition();
    if (position === null) {
      return;
    }
    setPopoutPosition(position);
    setIsExpanded(true);
  }, [calculatePosition, isTruncated]);

  const hidePopout = useCallback((): void => {
    setIsExpanded(false);
    setPopoutPosition(null);
  }, []);

  const handleMouseEnter = useCallback((): void => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = window.setTimeout(showPopout, 250);
  }, [showPopout]);

  const handleMouseLeave = useCallback((): void => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    hidePopout();
  }, [hidePopout]);

  useEffect((): (() => void) | undefined => {
    evaluateTruncation();
    const handleResize = (): void => {
      evaluateTruncation();
    };
    window.addEventListener('resize', handleResize);
    return (): void => {
      window.removeEventListener('resize', handleResize);
    };
  }, [evaluateTruncation, request.name]);

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
      hidePopout();
    };
    scrollParent.addEventListener('scroll', handleScroll, { passive: true });
    return (): void => {
      scrollParent.removeEventListener('scroll', handleScroll);
    };
  }, [hidePopout, isExpanded]);

  return (
    <>
      <button
        ref={rowRef}
        type="button"
        className={cn(
          focusRingClasses,
          'w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-bg-raised/50 transition-colors'
        )}
        data-test-id={`collection-request-${request.id}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={showPopout}
        onBlur={hidePopout}
        onClick={() => {
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
      {isExpanded && popoutPosition !== null && (
        <div
          role="tooltip"
          className="pointer-events-none"
          data-test-id="request-popout"
          style={{
            position: 'fixed',
            top: popoutPosition.top,
            left: popoutPosition.left,
            minWidth: popoutPosition.width,
            maxWidth: 'min(600px, calc(100vw - 40px))',
            zIndex: 60,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border-subtle bg-bg-elevated/95 shadow-lg backdrop-blur-sm">
            {isBound(request) && (
              <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
            )}
            <span className={cn('text-xs font-semibold uppercase tracking-wider', methodClass)}>
              {request.method}
            </span>
            <span className="text-sm text-text-primary whitespace-nowrap">{request.name}</span>
            {request.is_streaming && (
              <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs text-purple-500">
                <Radio size={12} />
                Streaming
              </span>
            )}
            {isAiGenerated(request) && (
              <span className="flex items-center gap-1 rounded-full bg-[#6EB1D1]/10 px-2 py-0.5 text-xs text-[#6EB1D1]">
                <Sparkles size={12} />
                AI
              </span>
            )}
          </div>
        </div>
      )}
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
