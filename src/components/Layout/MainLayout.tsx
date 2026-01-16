import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform, useReducedMotion } from 'motion/react';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { isMacSync, getModifierKeyName } from '@/utils/platform';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/utils/cn';

interface MainLayoutProps {
  headerContent?: React.ReactNode;
  requestContent?: React.ReactNode;
  responseContent?: React.ReactNode;
  initialSidebarVisible?: boolean;
}

const MIN_PANE_SIZE = 20;
const MAX_PANE_SIZE = 80;
const DEFAULT_SPLIT = 50;

const MIN_SIDEBAR_WIDTH = 256;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 256;

const sidebarVariants = {
  hidden: { width: 0, opacity: 0 },
  visible: { opacity: 1 },
  overlay: { opacity: 1 },
};

const overlayVariants = {
  hidden: { opacity: 0, pointerEvents: 'none' as const },
  visible: { opacity: 1, pointerEvents: 'auto' as const },
};

const springTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.5,
};

const layoutTransition = {
  layout: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
  },
};

const immediateTransition = {
  layout: {
    duration: 0,
  },
};

/**
 * Sash classes - minimal, grounded resize handle styling
 *
 * Design: Nearly invisible at rest, subtle on hover, solid during drag.
 * Like the edge of a book page - you know it's there, it responds when touched.
 */
const getSashClasses = (position: 'left' | 'right', isDragging: boolean): string =>
  cn(
    // Base: thin, subtle, part of the structure
    'absolute top-0 bottom-0 z-10 touch-none',
    'cursor-col-resize select-none',
    // Positioning
    position === 'right' ? 'right-0' : '',
    // Visual: grounded, not floaty
    // At rest: transparent, just a hit area
    // On hover: subtle background hint
    // Dragging: solid, present
    'w-[3px] bg-transparent',
    'hover:bg-border-default/50',
    isDragging && 'bg-border-default'
  );

export const MainLayout = ({
  headerContent,
  requestContent,
  responseContent,
  initialSidebarVisible = true,
}: MainLayoutProps): React.JSX.Element => {
  const { sidebarVisible, toggleSidebar, setSidebarVisible } = useSettingsStore();
  const { isCompact, isSpacious } = useResponsive();
  const prefersReducedMotion = useReducedMotion() === true;

  // Pane state
  const [requestPaneSize, setRequestPaneSize] = useState(DEFAULT_SPLIT);
  const [isPaneDragging, setIsPaneDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  React.useEffect(() => {
    setSidebarVisible(initialSidebarVisible);
  }, [initialSidebarVisible, setSidebarVisible]);

  useKeyboardShortcuts({
    key: 'b',
    modifier: isMacSync() ? 'meta' : 'ctrl',
    handler: toggleSidebar,
    description: `${getModifierKeyName()}B - Toggle sidebar`,
  });

  // Pane split ratio as MotionValue (0-1)
  const splitRatio = useMotionValue(DEFAULT_SPLIT / 100);

  useEffect((): void => {
    if (!isPaneDragging) {
      splitRatio.set(requestPaneSize / 100);
    }
  }, [requestPaneSize, splitRatio, isPaneDragging]);

  const requestWidth = useTransform(splitRatio, (ratio) => {
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, ratio * 100));
    return `${String(clamped)}%`;
  });

  const responseWidth = useTransform(splitRatio, (ratio) => {
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, ratio * 100));
    return `${String(100 - clamped)}%`;
  });

  const resizerLeft = useTransform(splitRatio, (ratio) => {
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, ratio * 100));
    return `${String(clamped)}%`;
  });

  // Sidebar width as MotionValue
  const sidebarWidthMotion = useMotionValue(DEFAULT_SIDEBAR_WIDTH);

  useEffect(() => {
    if (!isSidebarDragging) {
      sidebarWidthMotion.set(sidebarWidth);
    }
  }, [sidebarWidth, sidebarWidthMotion, isSidebarDragging]);

  const sidebarWidthStyle = useTransform(sidebarWidthMotion, (width) => `${String(width)}px`);

  // Prevent text selection during any drag
  useEffect((): (() => void) => {
    const isAnyDragging = isPaneDragging || isSidebarDragging;
    if (isAnyDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return (): void => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isPaneDragging, isSidebarDragging]);

  // Pane resizer handlers
  const handlePanePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPaneDragging(true);
  }, []);

  const handlePanePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPaneDragging) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const newRatio = relativeX / rect.width;

      const minRatio = MIN_PANE_SIZE / 100;
      const maxRatio = MAX_PANE_SIZE / 100;
      const clamped = Math.max(minRatio, Math.min(maxRatio, newRatio));

      splitRatio.set(clamped);
    }
  }, [isPaneDragging, splitRatio]);

  const handlePanePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPaneDragging) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    const finalRatio = splitRatio.get();
    const finalPercent = finalRatio * 100;
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, finalPercent));
    setRequestPaneSize(clamped);
    setIsPaneDragging(false);
  }, [isPaneDragging, splitRatio]);

  // Sidebar resizer handlers
  const handleSidebarPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsSidebarDragging(true);
  }, []);

  const handleSidebarPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSidebarDragging) return;

    // Sidebar width = pointer X position (since sidebar is at left edge)
    const newWidth = e.clientX;
    const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
    sidebarWidthMotion.set(clamped);
  }, [isSidebarDragging, sidebarWidthMotion]);

  const handleSidebarPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSidebarDragging) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    const finalWidth = sidebarWidthMotion.get();
    const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, finalWidth));
    setSidebarWidth(clamped);
    setIsSidebarDragging(false);
  }, [isSidebarDragging, sidebarWidthMotion]);

  const shouldShowSidebar = sidebarVisible;
  const isSidebarOverlay = shouldShowSidebar && isCompact;

  const sidebarVariant = isSidebarOverlay
    ? 'overlay'
    : shouldShowSidebar && isSpacious
      ? 'visible'
      : 'hidden';

  return (
    <div className="flex h-screen flex-col bg-bg-app" data-testid="main-layout">
      <div className="flex flex-1 overflow-hidden gap-0">
        <AnimatePresence mode="wait">
          {shouldShowSidebar && (
            <motion.aside
              ref={sidebarRef}
              className={cn(
                'flex flex-col border-r border-border-default bg-bg-surface overflow-hidden relative shrink-0',
                isSidebarOverlay && 'fixed inset-y-0 left-0 z-50 shadow-lg'
              )}
              variants={sidebarVariants}
              initial="hidden"
              animate={sidebarVariant}
              exit="hidden"
              transition={prefersReducedMotion ? { duration: 0 } : springTransition}
              style={{
                width: isSidebarOverlay ? 256 : sidebarWidthStyle,
                scrollbarGutter: 'stable',
              }}
              layout={!isSidebarDragging}
              data-testid="sidebar"
            >
              <Sidebar />

              {!isSidebarOverlay && (
                <div
                  className={getSashClasses('right', isSidebarDragging)}
                  data-testid="sidebar-resizer"
                  onPointerDown={handleSidebarPointerDown}
                  onPointerMove={handleSidebarPointerMove}
                  onPointerUp={handleSidebarPointerUp}
                  onPointerCancel={handleSidebarPointerUp}
                  role="separator"
                  aria-label="Resize sidebar"
                  aria-orientation="vertical"
                  aria-valuenow={sidebarWidth}
                  aria-valuemin={MIN_SIDEBAR_WIDTH}
                  aria-valuemax={MAX_SIDEBAR_WIDTH}
                />
              )}
            </motion.aside>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSidebarOverlay && (
            <motion.button
              type="button"
              className="fixed inset-0 bg-bg-app/80 backdrop-blur-sm z-40 cursor-pointer"
              onClick={toggleSidebar}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleSidebar();
                }
              }}
              data-testid="sidebar-overlay"
              aria-label="Close sidebar"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={springTransition}
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <div className="shrink-0" data-testid="header-bar">
            {headerContent !== undefined ? headerContent : (
              <div className="h-14 p-2 text-text-secondary flex items-center">
                Header bar placeholder
              </div>
            )}
          </div>

          <LayoutGroup>
            <motion.div
              ref={containerRef}
              className="flex-1 overflow-hidden flex relative"
              data-testid="pane-container"
              style={{ scrollbarGutter: 'stable' }}
              layout
              transition={prefersReducedMotion ? { duration: 0 } : layoutTransition}
            >
              <motion.div
                layout={!isPaneDragging}
                className="h-full overflow-hidden shrink-0 border-r border-border-default"
                data-testid="request-pane"
                style={{
                  width: requestWidth,
                  scrollbarGutter: 'stable',
                }}
                transition={isPaneDragging || prefersReducedMotion ? immediateTransition : layoutTransition}
              >
                {requestContent !== undefined ? requestContent : (
                  <div className="h-full p-4 text-text-secondary flex items-center justify-center">
                    Request Builder (placeholder - will be built in Run 2B)
                  </div>
                )}
              </motion.div>

              <motion.div
                layout={!isPaneDragging}
                className="h-full overflow-hidden flex-1"
                data-testid="response-pane"
                style={{
                  width: responseWidth,
                  scrollbarGutter: 'stable',
                }}
                transition={isPaneDragging || prefersReducedMotion ? immediateTransition : layoutTransition}
              >
                {responseContent !== undefined ? responseContent : (
                  <div className="h-full p-4 text-text-secondary flex items-center justify-center">
                    Response Viewer (placeholder - will be built in Run 2C)
                  </div>
                )}
              </motion.div>

              {/* Pane sash - positioned at split point */}
              <motion.div
                className={getSashClasses('left', isPaneDragging)}
                data-testid="pane-resizer"
                style={{
                  left: resizerLeft,
                  transform: 'translateX(-50%)',
                }}
                onPointerDown={handlePanePointerDown}
                onPointerMove={handlePanePointerMove}
                onPointerUp={handlePanePointerUp}
                onPointerCancel={handlePanePointerUp}
                role="separator"
                aria-label="Resize panes"
                aria-orientation="vertical"
                aria-valuenow={requestPaneSize}
                aria-valuemin={MIN_PANE_SIZE}
                aria-valuemax={MAX_PANE_SIZE}
              />
            </motion.div>
          </LayoutGroup>
        </div>
      </div>
      <StatusBar />
    </div>
  );
};
