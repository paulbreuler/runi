/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useRef, useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { X, Minus, GripHorizontal, GripVertical } from 'lucide-react';
import { ScrollArea } from '@base-ui/react/scroll-area';
import { usePanelStore, COLLAPSED_PANEL_HEIGHT, MIN_PANEL_SIZES } from '@/stores/usePanelStore';
import { focusRingClasses } from '@/utils/accessibility';
import { DOCKABLE_PANEL_Z_INDEX } from '@/utils/z-index';
import { DockControls } from './DockControls';
import { cn } from '@/utils/cn';

export interface DockablePanelProps {
  /** Panel title */
  title: string;
  /** Panel content */
  children: ReactNode;
  /** Optional header content (e.g., tabs) */
  headerContent?: ReactNode;
  /** Additional class name */
  className?: string;
}

// Spring animation config - matches MainLayout "book page turning" feel
const panelSpring = {
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Tray spring - snappy but not bouncy (100ms feel)
const trayTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// Collapsed size for horizontal docks (left/right) - 0px to occupy no layout space
const COLLAPSED_PANEL_WIDTH = 0;

// Dock controls width estimates for collapse hysteresis
// Expanded ≈ 165px (3 position buttons + divider + pop-out + gaps)
// Collapsed ≈ 26px (single ellipsis button)
const DOCK_HYSTERESIS = 165 - 26;

// ============================================================================
// Tray Variants - Unified Material Feel
// Per DESIGN_IDEOLOGY.md (read via MCP): "Components should feel like unified materials"
// All state changes orchestrated through variants, not separate animations
// ============================================================================

// Bottom tray container variants - orchestrates background, shadow, position
const trayVariantsBottom = {
  rest: {
    y: 0,
    backgroundColor: 'var(--color-bg-raised)',
    boxShadow: '0 0 0 0 rgba(0,0,0,0)',
    opacity: 0.8,
  },
  hover: {
    y: -1,
    backgroundColor: 'var(--color-bg-elevated)',
    boxShadow: '0 -2px 8px -2px rgba(0,0,0,0.3)',
    opacity: 1,
  },
  dragging: {
    y: 0,
    backgroundColor: 'var(--color-bg-elevated)',
    boxShadow: '0 -2px 8px -2px rgba(0,0,0,0.4)',
    opacity: 1,
  },
};

// Left tray container variants - centered tab
const trayVariantsLeft = {
  rest: {
    x: 0,
    backgroundColor: 'var(--color-bg-raised)',
    boxShadow: '0 0 0 0 rgba(0,0,0,0)',
    opacity: 0.8,
  },
  hover: {
    x: 1,
    backgroundColor: 'var(--color-bg-elevated)',
    boxShadow: '2px 0 8px -2px rgba(0,0,0,0.3)',
    opacity: 1,
  },
  dragging: {
    x: 0,
    backgroundColor: 'var(--color-bg-elevated)',
    boxShadow: '2px 0 8px -2px rgba(0,0,0,0.4)',
    opacity: 1,
  },
};

// Right tray container variants - centered tab
const trayVariantsRight = {
  rest: {
    x: 0,
    backgroundColor: 'var(--color-bg-raised)',
    boxShadow: '0 0 0 0 rgba(0,0,0,0)',
    opacity: 0.8,
  },
  hover: {
    x: -1,
    backgroundColor: 'var(--color-bg-elevated)',
    boxShadow: '-2px 0 8px -2px rgba(0,0,0,0.3)',
    opacity: 1,
  },
  dragging: {
    x: 0,
    backgroundColor: 'var(--color-bg-elevated)',
    boxShadow: '-2px 0 8px -2px rgba(0,0,0,0.4)',
    opacity: 1,
  },
};

// Content variants - inherits state from parent via variant prop
const trayContentVariants = {
  rest: { opacity: 0.6 },
  hover: { opacity: 1 },
  dragging: { opacity: 1 },
};

/**
 * DevTools-style panel that can dock to bottom, left, or right positions.
 *
 * Supports resizing, collapsing, and horizontal scrolling of header content.
 *
 * @example
 * ```tsx
 * <DockablePanel
 *   title="DevTools"
 *   headerContent={<PanelTabs activeTab={activeTab} onTabChange={setActiveTab} />}
 * >
 *   <PanelContent
 *     activeTab={activeTab}
 *     networkContent={<NetworkHistoryPanel />}
 *     consoleContent={<ConsolePanel />}
 *   />
 * </DockablePanel>
 * ```
 */
export const DockablePanel = ({
  title,
  children,
  headerContent,
  className,
}: DockablePanelProps): React.JSX.Element | null => {
  const {
    position,
    isVisible,
    isCollapsed,
    sizes,
    setVisible,
    setCollapsed,
    toggleCollapsed,
    setSize,
  } = usePanelStore();

  const prefersReducedMotion = useReducedMotion() === true;
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // Unified hover for collapsed tray
  const panelRef = useRef<HTMLDivElement>(null);

  // Horizontal scroll state for header
  // Base UI ScrollArea.Viewport uses a div element, so we can use HTMLDivElement
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrollIdle, setIsScrollIdle] = useState(true);
  const scrollIdleTimeout = useRef<number | undefined>(undefined);

  // Dock controls collapse state — independent of scroll overflow to avoid
  // feedback loops (collapsing frees space → no overflow → expand → overflow → collapse…).
  // Uses the scroll content's intrinsic width vs header width with hysteresis.
  const [dockCollapsed, setDockCollapsed] = useState(false);

  // Compute current variant based on state - used for orchestrated animations
  const getTrayVariant = (): 'rest' | 'hover' | 'dragging' => {
    if (isDragging) {
      return 'dragging';
    }
    if (isHovered) {
      return 'hover';
    }
    return 'rest';
  };
  const dragStartPos = useRef(0);
  const dragStartSize = useRef(0);
  const dragCurrentSize = useRef(0); // Track actual drag position (spring lags behind)

  // Determine if this is a horizontal (left/right) or vertical (bottom) dock
  const isHorizontal = position === 'left' || position === 'right';

  // Get current size based on position
  const getCurrentSize = (): number => {
    if (position === 'bottom') {
      return sizes.bottom;
    }
    if (position === 'left') {
      return sizes.left;
    }
    if (position === 'right') {
      return sizes.right;
    }
    return sizes.bottom;
  };

  const currentSize = getCurrentSize();

  // Target size for animation
  const getTargetSize = (): number => {
    if (isCollapsed) {
      return isHorizontal ? COLLAPSED_PANEL_WIDTH : COLLAPSED_PANEL_HEIGHT;
    }
    return currentSize;
  };

  const targetSize = getTargetSize();

  // Size animation using spring
  const sizeSpring = useSpring(targetSize, prefersReducedMotion ? { duration: 0 } : panelSpring);

  // Content opacity based on size - fades out as panel expands during drag
  // When collapsed, content is visible
  // As user drags to expand, content fades out smoothly
  const collapsedSize = isHorizontal ? COLLAPSED_PANEL_WIDTH : COLLAPSED_PANEL_HEIGHT;
  const contentOpacity = useTransform(sizeSpring, [collapsedSize, collapsedSize + 10], [1, 0]);

  // Update spring target when size changes
  useEffect(() => {
    if (!isDragging) {
      sizeSpring.set(targetSize);
    }
  }, [targetSize, sizeSpring, isDragging]);

  // Prevent text selection during drag
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return (): void => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, isHorizontal]);

  // Handle close button
  const handleClose = useCallback((): void => {
    setVisible(false);
  }, [setVisible]);

  // Handle collapse/minimize button
  const handleMinimize = useCallback(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  // Handle panel click for horizontal collapsed state
  // When collapsed on left/right, clicking anywhere on the panel should expand it
  const handlePanelClick = useCallback(() => {
    if (isCollapsed && isHorizontal) {
      setCollapsed(false);
    }
  }, [isCollapsed, isHorizontal, setCollapsed]);

  // Update scroll state for header
  const updateScrollState = useCallback((): void => {
    if (isCollapsed || headerScrollRef.current === null) {
      return;
    }
    const container = headerScrollRef.current;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const hasScrollableOverflow = maxScroll > 4;
    setHasOverflow(hasScrollableOverflow);
    setCanScrollLeft(container.scrollLeft > 2);
    setCanScrollRight(container.scrollLeft < maxScroll - 2);
  }, [isCollapsed]);

  // Setup scroll detection for header
  useEffect(() => {
    if (isCollapsed || headerScrollRef.current === null) {
      return;
    }

    updateScrollState();
    const container = headerScrollRef.current;

    const handleScroll = (): void => {
      updateScrollState();
      setIsScrollIdle(false);
      if (scrollIdleTimeout.current !== undefined) {
        window.clearTimeout(scrollIdleTimeout.current);
      }
      scrollIdleTimeout.current = window.setTimeout(() => {
        setIsScrollIdle(true);
      }, 220);
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });

    container.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(container);

    return (): void => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      if (scrollIdleTimeout.current !== undefined) {
        window.clearTimeout(scrollIdleTimeout.current);
      }
    };
  }, [updateScrollState, isCollapsed]);

  // Dock controls collapse detection — measures whether the tab content's
  // natural width exceeds the header's available space. Uses hysteresis:
  // the expanded dock controls are ~165px wider than the collapsed ellipsis,
  // so we only un-collapse when there's enough headroom to avoid oscillation.
  useEffect(() => {
    if (isCollapsed || headerRef.current === null || headerScrollRef.current === null) {
      return;
    }

    const header = headerRef.current;
    const viewport = headerScrollRef.current;

    const checkDockCollapse = (): void => {
      // scrollWidth = natural width the tab content wants to occupy
      // clientWidth = how much space the scroll area viewport currently has
      const contentWidth = viewport.scrollWidth;
      const viewportWidth = viewport.clientWidth;
      const overflow = contentWidth - viewportWidth;

      setDockCollapsed((wasCollapsed) => {
        if (!wasCollapsed) {
          // Collapse when content overflows (or is within 8px of overflowing)
          return overflow > -8;
        }
        // Un-collapse only when there's enough room for expanded controls + buffer
        // (the viewport is currently wider because controls are collapsed,
        //  so we need to check if it would STILL fit with expanded controls)
        return overflow + DOCK_HYSTERESIS > -8;
      });
    };

    checkDockCollapse();

    const resizeObserver = new ResizeObserver(() => {
      checkDockCollapse();
    });

    resizeObserver.observe(header);
    resizeObserver.observe(viewport);

    return (): void => {
      resizeObserver.disconnect();
    };
  }, [isCollapsed]);

  // Helper function to get overflow animation props
  const getOverflowAnimation = (
    direction: 'left' | 'right'
  ): {
    opacity: number | number[];
    x: number | number[];
  } => {
    if (prefersReducedMotion) {
      return { opacity: 0.35, x: 0 };
    }
    if (isScrollIdle) {
      const xValue = direction === 'left' ? [0, 3, 0] : [0, -3, 0];
      return { opacity: [0.2, 0.4, 0.2], x: xValue };
    }
    return { opacity: 0.25, x: 0 };
  };

  const showOverflowCue = hasOverflow && !isCollapsed;

  // Resize handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragStartPos.current = isHorizontal ? e.clientX : e.clientY;
      // Use collapsed size as start if collapsed, otherwise current size
      const collapsedSize = isHorizontal ? COLLAPSED_PANEL_WIDTH : COLLAPSED_PANEL_HEIGHT;
      const startSize = isCollapsed ? collapsedSize : currentSize;
      dragStartSize.current = startSize;
      dragCurrentSize.current = startSize;
    },
    [currentSize, isHorizontal, isCollapsed]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) {
        return;
      }

      const currentPos = isHorizontal ? e.clientX : e.clientY;
      let delta: number;

      if (position === 'bottom') {
        // Bottom: dragging up increases height
        delta = dragStartPos.current - currentPos;
      } else if (position === 'left') {
        // Left: dragging right increases width
        delta = currentPos - dragStartPos.current;
      } else {
        // Right: dragging left increases width
        delta = dragStartPos.current - currentPos;
      }

      // Allow dragging below minimum for bounce-back effect, but not below collapsed size
      const collapsedSize = isHorizontal ? COLLAPSED_PANEL_WIDTH : COLLAPSED_PANEL_HEIGHT;
      const maxSize = isHorizontal ? window.innerWidth * 0.5 : window.innerHeight * 0.6;
      const rawSize = dragStartSize.current + delta;
      const newSize = Math.max(collapsedSize, Math.min(maxSize, rawSize));

      // Track actual drag position for bounce-back logic
      dragCurrentSize.current = newSize;
      sizeSpring.set(newSize);
    },
    [isDragging, isHorizontal, position, sizeSpring]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) {
        return;
      }
      e.currentTarget.releasePointerCapture(e.pointerId);

      const finalSize = dragCurrentSize.current;
      const minSize = isHorizontal ? MIN_PANEL_SIZES.left : MIN_PANEL_SIZES.bottom;
      const maxSize = isHorizontal ? window.innerWidth * 0.5 : window.innerHeight * 0.6;

      // Collapse only when dragged below minimum size, otherwise resize
      if (finalSize < minSize) {
        // User dragged below minimum → collapse with bounce-back animation
        setCollapsed(true);
        // Spring will animate to collapsed size via useEffect
      } else {
        // User dragged larger → resize, clamp to valid range and bounce back if needed
        const clampedSize = Math.max(minSize, Math.min(maxSize, finalSize));
        sizeSpring.set(clampedSize);

        // If was collapsed, expand it - must happen BEFORE setIsDragging(false)
        // so the useEffect sees the correct isCollapsed state when computing targetSize
        if (isCollapsed) {
          setCollapsed(false);
        }

        // Save the clamped size
        if (position === 'bottom') {
          setSize('bottom', clampedSize);
        } else if (position === 'left') {
          setSize('left', clampedSize);
        } else if (position === 'right') {
          setSize('right', clampedSize);
        }
      }

      // IMPORTANT: setIsDragging must be LAST to avoid race condition
      // The useEffect reacts to isDragging change and sets sizeSpring to targetSize.
      // If we call setIsDragging(false) before setCollapsed(false), the useEffect
      // will see isCollapsed=true and reset the spring to collapsed size.
      setIsDragging(false);
    },
    [isDragging, sizeSpring, position, setSize, setCollapsed, isCollapsed, isHorizontal]
  );

  // Double-click on resizer toggles collapse
  const handleDoubleClick = useCallback(() => {
    toggleCollapsed();
  }, [toggleCollapsed]);

  // Single click on resizer expands when collapsed
  const handleResizerClick = useCallback(() => {
    if (isCollapsed) {
      setCollapsed(false);
    }
  }, [isCollapsed, setCollapsed]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Get resizer position classes
  const getResizerClasses = (): string => {
    // When collapsed, resizer is part of the unified tray - no independent hover
    // z-30 ensures resizer is above header so it can receive pointer events
    const base = cn(
      'absolute z-30 bg-transparent',
      !isCollapsed && 'hover:bg-border-default/50',
      isDragging && 'bg-border-default'
    );

    if (position === 'bottom') {
      return cn(base, 'left-0 right-0 top-0 h-[3px] cursor-row-resize');
    }
    if (position === 'left') {
      return cn(base, 'top-0 bottom-0 right-0 w-[3px] cursor-col-resize');
    }
    if (position === 'right') {
      return cn(base, 'top-0 bottom-0 left-0 w-[3px] cursor-col-resize');
    }
    return base;
  };

  // Get panel container classes
  const getPanelClasses = (): string => {
    const base = cn(
      'flex shrink-0 relative',
      !isCollapsed && 'bg-bg-surface border-border-default'
    );

    if (position === 'bottom') {
      return cn(base, 'flex-col', !isCollapsed && 'border-t');
    }
    if (position === 'left') {
      return cn(base, 'flex-col', !isCollapsed && 'border-r');
    }
    if (position === 'right') {
      return cn(base, 'flex-col', !isCollapsed && 'border-l');
    }
    return cn(base, 'flex-col');
  };

  // Get style based on position - returns style object for motion.div
  // MotionValues are correctly typed for motion component style prop
  const getPanelStyle = (): { width: typeof sizeSpring } | { height: typeof sizeSpring } => {
    if (isHorizontal) {
      return { width: sizeSpring };
    }
    return { height: sizeSpring };
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        data-test-id="dockable-panel"
        data-collapsed={isCollapsed}
        className={cn(
          getPanelClasses(),
          isCollapsed && 'overflow-visible pointer-events-none',
          className
        )}
        style={{ ...getPanelStyle(), zIndex: DOCKABLE_PANEL_Z_INDEX }}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : panelSpring}
        onClick={handlePanelClick}
      >
        {/* Resize handle */}
        <div
          data-test-id="panel-resizer"
          className={cn(getResizerClasses(), isCollapsed && 'pointer-events-none')}
          role="separator"
          aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
          aria-label="Resize panel (double-click to collapse)"
          aria-valuenow={currentSize}
          aria-valuemin={isHorizontal ? MIN_PANEL_SIZES.left : MIN_PANEL_SIZES.bottom}
          aria-valuemax={isHorizontal ? window.innerWidth * 0.5 : window.innerHeight * 0.6}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleResizerClick}
          onDoubleClick={handleDoubleClick}
          onMouseEnter={
            isCollapsed
              ? (): void => {
                  setIsHovered(true);
                }
              : undefined
          }
          onMouseLeave={
            isCollapsed
              ? (): void => {
                  setIsHovered(false);
                }
              : undefined
          }
        />

        {/* Collapsed state - Unified pull tab for bottom dock */}
        {isCollapsed && position === 'bottom' && (
          <motion.div
            data-test-id="panel-collapsed-edge"
            className={cn(
              'absolute left-1/2 -translate-x-1/2 bottom-0 h-3 w-16',
              'border border-border-default rounded-t-md border-b-0',
              'flex items-center justify-center pointer-events-auto',
              isDragging ? 'cursor-row-resize' : 'cursor-pointer'
            )}
            variants={trayVariantsBottom}
            animate={getTrayVariant()}
            transition={trayTransition}
            onMouseEnter={(): void => {
              setIsHovered(true);
            }}
            onMouseLeave={(): void => {
              setIsHovered(false);
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(): void => {
              if (!isDragging) {
                setCollapsed(false);
              }
            }}
            aria-label="Expand Tray (click or drag)"
          >
            {/* Content - inherits variant from parent, fades during drag */}
            <motion.div
              className="flex items-center select-none text-text-muted"
              variants={trayContentVariants}
              animate={getTrayVariant()}
              transition={trayTransition}
              style={isDragging ? { opacity: contentOpacity } : undefined}
            >
              <GripHorizontal size={12} />
            </motion.div>
          </motion.div>
        )}

        {/* Collapsed state - Unified pull tab for left dock */}
        {isCollapsed && position === 'left' && (
          <motion.div
            data-test-id="panel-collapsed-edge"
            className={cn(
              'absolute top-1/2 -translate-y-1/2 right-0 w-3 h-16',
              'border border-border-default rounded-r-md border-l-0',
              'flex flex-col items-center justify-center pointer-events-auto',
              isDragging ? 'cursor-col-resize' : 'cursor-pointer'
            )}
            variants={trayVariantsLeft}
            animate={getTrayVariant()}
            transition={trayTransition}
            onMouseEnter={(): void => {
              setIsHovered(true);
            }}
            onMouseLeave={(): void => {
              setIsHovered(false);
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(): void => {
              if (!isDragging) {
                setCollapsed(false);
              }
            }}
            aria-label="Expand Tray (click or drag)"
          >
            {/* Content - inherits variant from parent, fades during drag */}
            <motion.div
              className="flex flex-col items-center select-none text-text-muted"
              variants={trayContentVariants}
              animate={getTrayVariant()}
              transition={trayTransition}
              style={isDragging ? { opacity: contentOpacity } : undefined}
            >
              <GripVertical size={12} />
            </motion.div>
          </motion.div>
        )}

        {/* Collapsed state - Unified pull tab for right dock */}
        {isCollapsed && position === 'right' && (
          <motion.div
            data-test-id="panel-collapsed-edge"
            className={cn(
              'absolute top-1/2 -translate-y-1/2 left-0 w-3 h-16',
              'border border-border-default rounded-l-md border-r-0',
              'flex flex-col items-center justify-center pointer-events-auto',
              isDragging ? 'cursor-col-resize' : 'cursor-pointer'
            )}
            variants={trayVariantsRight}
            animate={getTrayVariant()}
            transition={trayTransition}
            onMouseEnter={(): void => {
              setIsHovered(true);
            }}
            onMouseLeave={(): void => {
              setIsHovered(false);
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(): void => {
              if (!isDragging) {
                setCollapsed(false);
              }
            }}
            aria-label="Expand Tray (click or drag)"
          >
            {/* Content - inherits variant from parent, fades during drag */}
            <motion.div
              className="flex flex-col items-center select-none text-text-muted"
              variants={trayContentVariants}
              animate={getTrayVariant()}
              transition={trayTransition}
              style={isDragging ? { opacity: contentOpacity } : undefined}
            >
              <GripVertical size={12} />
            </motion.div>
          </motion.div>
        )}

        {/* Expanded state - full header + content (container for @container queries) */}
        {!isCollapsed && (
          <div
            className="flex flex-col flex-1 min-h-0 min-w-0 @container [container-name:panel]"
            data-test-id="panel-expanded-container"
          >
            {/* Panel header */}
            <div
              ref={headerRef}
              data-test-id="panel-header"
              className="flex items-center h-7 pl-3 pr-0 border-b border-border-default shrink-0 relative"
            >
              {/* Scrollable header content */}
              <ScrollArea.Root className="flex-1 min-w-0 h-full relative">
                <ScrollArea.Viewport
                  ref={headerScrollRef}
                  className="scroll-area-viewport flex items-center gap-2 min-w-max h-full touch-pan-x overflow-x-auto overflow-y-hidden"
                  aria-label="Panel header content"
                >
                  <ScrollArea.Content className="flex items-center gap-2 min-w-max">
                    {headerContent ?? (
                      <span className="text-sm font-medium text-text-primary truncate">
                        {title}
                      </span>
                    )}
                  </ScrollArea.Content>
                </ScrollArea.Viewport>

                {/* Overflow gradient cues - positioned inside ScrollArea.Root */}
                {showOverflowCue && canScrollLeft && (
                  <motion.div
                    className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-bg-surface/90 to-transparent z-20"
                    data-test-id="panel-header-overflow-left"
                    initial={false}
                    animate={getOverflowAnimation('left')}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                {showOverflowCue && canScrollRight && (
                  <motion.div
                    className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-bg-surface/90 to-transparent z-20"
                    data-test-id="panel-header-overflow-right"
                    initial={false}
                    animate={getOverflowAnimation('right')}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                <ScrollArea.Scrollbar
                  orientation="horizontal"
                  className="scroll-area-scrollbar flex touch-none select-none transition-colors h-1"
                >
                  <ScrollArea.Thumb className="scroll-area-thumb flex-1 rounded-full" />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>

              {/* Control buttons - opaque bg with separator edge; tabs slide behind */}
              <div className="flex items-center gap-1 shrink-0 pl-2 pr-3 relative z-10 bg-bg-surface self-stretch border-l border-border-default">
                {/* Dock controls */}
                <DockControls collapsed={dockCollapsed} />

                {/* Collapse/Minimize button */}
                <button
                  type="button"
                  className={cn(
                    focusRingClasses,
                    'p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-raised/50 transition-colors'
                  )}
                  onClick={handleMinimize}
                  aria-label="Collapse panel"
                >
                  <Minus size={14} />
                </button>

                {/* Close button */}
                <button
                  type="button"
                  className={cn(
                    focusRingClasses,
                    'p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-raised/50 transition-colors'
                  )}
                  onClick={handleClose}
                  aria-label="Close panel"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Panel content - children handle their own scrolling (e.g., VirtualDataGrid) */}
            <div className="flex-1 min-h-0 overflow-hidden" data-test-id="panel-content">
              {children}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
