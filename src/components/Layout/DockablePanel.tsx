import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, useSpring } from 'motion/react';
import { X, Minus, ChevronUp, ChevronRight, ChevronLeft } from 'lucide-react';
import { usePanelStore, COLLAPSED_PANEL_HEIGHT, MIN_PANEL_SIZES } from '@/stores/usePanelStore';
import { DockControls } from './DockControls';
import { cn } from '@/utils/cn';

interface DockablePanelProps {
  /** Panel title */
  title: string;
  /** Panel content */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

// Spring animation config - matches MainLayout "book page turning" feel
const panelSpring = {
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Collapsed size for horizontal docks (left/right)
const COLLAPSED_PANEL_WIDTH = 24;

/**
 * DockablePanel - A DevTools-style panel that can dock to different positions.
 *
 * Supports bottom, left, and right docking with resize capability.
 * Panel can be collapsed to a thin bar.
 */
export const DockablePanel = ({
  title,
  children,
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
  const panelRef = useRef<HTMLDivElement>(null);
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

  // Handle header click (expands when collapsed)
  const handleHeaderClick = useCallback(() => {
    if (isCollapsed) {
      setCollapsed(false);
    }
  }, [isCollapsed, setCollapsed]);

  // Handle panel click for horizontal collapsed state
  // When collapsed on left/right, clicking anywhere on the panel should expand it
  const handlePanelClick = useCallback(() => {
    if (isCollapsed && isHorizontal) {
      setCollapsed(false);
    }
  }, [isCollapsed, isHorizontal, setCollapsed]);

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
      setIsDragging(false);

      const finalSize = dragCurrentSize.current;
      const startSize = dragStartSize.current;
      const minSize = isHorizontal ? MIN_PANEL_SIZES.left : MIN_PANEL_SIZES.bottom;
      const maxSize = isHorizontal ? window.innerWidth * 0.5 : window.innerHeight * 0.6;

      // Direction-based behavior: dragging smaller = collapse intent, dragging larger = resize
      if (finalSize < startSize) {
        // User dragged smaller → collapse with bounce-back animation
        setCollapsed(true);
        // Spring will animate to collapsed size via useEffect
      } else {
        // User dragged larger → resize, clamp to valid range and bounce back if needed
        const clampedSize = Math.max(minSize, Math.min(maxSize, finalSize));
        sizeSpring.set(clampedSize);

        // If was collapsed, expand it
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

  // Get collapse icon based on position and state
  const getCollapseIcon = (): React.ReactNode => {
    if (isCollapsed) {
      if (position === 'left') {
        return <ChevronRight size={14} />;
      }
      if (position === 'right') {
        return <ChevronLeft size={14} />;
      }
      return <ChevronUp size={14} />;
    }
    return <Minus size={14} />;
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  // Get resizer position classes
  const getResizerClasses = (): string => {
    const base = cn(
      'absolute z-10 bg-transparent hover:bg-border-default/50',
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
    const base = 'flex bg-bg-surface border-border-default shrink-0 relative';

    if (position === 'bottom') {
      return cn(base, 'flex-col border-t');
    }
    if (position === 'left') {
      return cn(base, 'flex-col border-r');
    }
    if (position === 'right') {
      return cn(base, 'flex-col border-l');
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
        data-testid="dockable-panel"
        className={cn(
          getPanelClasses(),
          isCollapsed && isHorizontal && 'cursor-pointer',
          className
        )}
        style={getPanelStyle()}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : panelSpring}
        onClick={handlePanelClick}
      >
        {/* Resize handle */}
        <div
          data-testid="panel-resizer"
          className={getResizerClasses()}
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
        />

        {/* Panel header */}
        <div
          data-testid="panel-header"
          className={cn(
            'flex items-center justify-between h-8 border-b border-border-default shrink-0 relative z-20',
            // Reduce padding when collapsed horizontally to fit in narrow width
            isCollapsed && isHorizontal ? 'px-1' : 'px-3',
            isCollapsed && 'cursor-pointer hover:bg-bg-elevated/50'
          )}
          onClick={handleHeaderClick}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{title}</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Dock controls - only show when not collapsed */}
            {!isCollapsed && <DockControls className="mr-2" />}

            {/* Collapse/Minimize button */}
            <button
              type="button"
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleMinimize();
              }}
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {getCollapseIcon()}
            </button>

            {/* Close button */}
            <button
              type="button"
              className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated/50 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              aria-label="Close panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Panel content (hidden when collapsed) */}
        {!isCollapsed && (
          <div className="flex-1 overflow-auto" data-testid="panel-content-area">
            {children}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
