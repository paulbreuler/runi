/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';
import { cn } from '@/utils/cn';

interface SidebarDividerProps {
  /** Called continuously during drag with cumulative deltaY from drag start. */
  onDrag: (deltaY: number) => void;
  /** Called when drag starts (before first move). */
  onDragStart?: () => void;
  /** Called when drag ends. */
  onDragEnd?: () => void;
  testId?: string;
}

/**
 * Draggable horizontal divider between sidebar sections.
 * Uses pointer events with capture for smooth drag tracking.
 */
export const SidebarDivider = ({
  onDrag,
  onDragStart,
  onDragEnd,
  testId = 'sidebar-divider',
}: SidebarDividerProps): React.JSX.Element => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);

  // Manage body styles during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'row-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return (): void => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      startY.current = e.clientY;
      onDragStart?.();
    },
    [onDragStart]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) {
        return;
      }
      const deltaY = e.clientY - startY.current;
      onDrag(deltaY);
    },
    [isDragging, onDrag]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) {
        return;
      }
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      onDragEnd?.();
    },
    [isDragging, onDragEnd]
  );

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize sidebar sections"
      tabIndex={0}
      data-test-id={testId}
      className={cn(
        'shrink-0 h-[3px] cursor-row-resize touch-none select-none transition-colors',
        'bg-transparent hover:bg-border-subtle/50',
        isDragging && 'bg-border-default'
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
};
