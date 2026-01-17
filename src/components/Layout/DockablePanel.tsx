import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion, useSpring } from 'motion/react';
import { X, Minus, ChevronUp } from 'lucide-react';
import { usePanelStore, COLLAPSED_PANEL_HEIGHT, MIN_PANEL_SIZES } from '@/stores/usePanelStore';
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

/**
 * DockablePanel - A DevTools-style panel that can dock to different positions.
 *
 * Currently supports bottom docking with resize capability.
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
  const dragStartY = useRef(0);
  const dragStartSize = useRef(0);

  // Get current size based on position
  const currentSize = position === 'bottom' ? sizes.bottom : sizes.bottom;

  // Height animation using spring
  const targetHeight = isCollapsed ? COLLAPSED_PANEL_HEIGHT : currentSize;
  const heightSpring = useSpring(
    targetHeight,
    prefersReducedMotion ? { duration: 0 } : panelSpring
  );

  // Update spring target when height changes
  useEffect(() => {
    if (!isDragging) {
      heightSpring.set(targetHeight);
    }
  }, [targetHeight, heightSpring, isDragging]);

  // Prevent text selection during drag
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

  // Resize handlers for bottom dock
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragStartY.current = e.clientY;
      dragStartSize.current = currentSize;
    },
    [currentSize]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) {
        return;
      }

      // For bottom dock, dragging up increases height
      const deltaY = dragStartY.current - e.clientY;
      const newSize = Math.max(
        MIN_PANEL_SIZES.bottom,
        Math.min(window.innerHeight * 0.6, dragStartSize.current + deltaY)
      );
      heightSpring.set(newSize);
    },
    [isDragging, heightSpring]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) {
        return;
      }
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);

      // Save the final size
      const finalSize = heightSpring.get();
      if (position === 'bottom') {
        setSize('bottom', finalSize);
      }
    },
    [isDragging, heightSpring, position, setSize]
  );

  // Double-click on resizer toggles collapse
  const handleDoubleClick = useCallback(() => {
    toggleCollapsed();
  }, [toggleCollapsed]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        data-testid="dockable-panel"
        className={cn(
          'flex flex-col bg-bg-surface border-border-default shrink-0',
          position === 'bottom' && 'border-t',
          className
        )}
        style={{
          height: heightSpring,
        }}
        initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
        animate={{ height: targetHeight, opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : panelSpring}
      >
        {/* Resize handle (top for bottom dock) */}
        <div
          data-testid="panel-resizer"
          className={cn(
            'absolute left-0 right-0 h-[3px] cursor-row-resize z-10',
            'bg-transparent hover:bg-border-default/50',
            isDragging && 'bg-border-default',
            position === 'bottom' && 'top-0'
          )}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize panel (double-click to collapse)"
          aria-valuenow={currentSize}
          aria-valuemin={MIN_PANEL_SIZES.bottom}
          aria-valuemax={window.innerHeight * 0.6}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        />

        {/* Panel header */}
        <div
          data-testid="panel-header"
          className={cn(
            'flex items-center justify-between h-8 px-3 border-b border-border-default shrink-0',
            isCollapsed && 'cursor-pointer hover:bg-bg-elevated/50'
          )}
          onClick={handleHeaderClick}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">{title}</span>
          </div>

          <div className="flex items-center gap-1">
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
              {isCollapsed ? <ChevronUp size={14} /> : <Minus size={14} />}
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
