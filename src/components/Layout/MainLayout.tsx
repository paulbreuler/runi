import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform, useReducedMotion, useSpring } from 'motion/react';
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
const COLLAPSED_SIDEBAR_WIDTH = 8; // Slim page edge when collapsed

const overlayVariants = {
  hidden: { opacity: 0, pointerEvents: 'none' as const },
  visible: { opacity: 1, pointerEvents: 'auto' as const },
};

// Smooth, calm spring for sidebar - like turning a book page
const sidebarSpring = {
  stiffness: 300,
  damping: 30,
  mass: 0.8,
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
 */
const getSashClasses = (position: 'left' | 'right', isDragging: boolean): string =>
  cn(
    'absolute top-0 bottom-0 z-10 touch-none',
    'cursor-col-resize select-none',
    position === 'right' ? 'right-0' : '',
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
  const { isCompact } = useResponsive();
  const prefersReducedMotion = useReducedMotion() === true;

  // Pane state
  const [requestPaneSize, setRequestPaneSize] = useState(DEFAULT_SPLIT);
  const [isPaneDragging, setIsPaneDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const isInitialMount = useRef(true);

  // Initialize sidebar visibility on mount only
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setSidebarVisible(initialSidebarVisible);
    }
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

  // Sidebar width with spring animation - like turning a page
  const targetSidebarWidth = sidebarVisible ? sidebarWidth : COLLAPSED_SIDEBAR_WIDTH;
  const sidebarWidthSpring = useSpring(targetSidebarWidth, prefersReducedMotion ? { duration: 0 } : sidebarSpring);

  // Update spring target when visibility or width changes
  useEffect(() => {
    if (!isSidebarDragging) {
      sidebarWidthSpring.set(sidebarVisible ? sidebarWidth : COLLAPSED_SIDEBAR_WIDTH);
    }
  }, [sidebarVisible, sidebarWidth, sidebarWidthSpring, isSidebarDragging]);

  // Sidebar content opacity - fade out when collapsing
  const sidebarContentOpacity = useTransform(
    sidebarWidthSpring,
    [COLLAPSED_SIDEBAR_WIDTH, COLLAPSED_SIDEBAR_WIDTH + 50, MIN_SIDEBAR_WIDTH],
    [0, 0, 1]
  );

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

  // Sidebar resizer handlers (only when expanded)
  const handleSidebarPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!sidebarVisible) return; // Don't resize when collapsed
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsSidebarDragging(true);
  }, [sidebarVisible]);

  const handleSidebarPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSidebarDragging) return;

    const newWidth = e.clientX;
    const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
    sidebarWidthSpring.set(clamped);
  }, [isSidebarDragging, sidebarWidthSpring]);

  const handleSidebarPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSidebarDragging) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    const finalWidth = sidebarWidthSpring.get();
    const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, finalWidth));
    setSidebarWidth(clamped);
    setIsSidebarDragging(false);
  }, [isSidebarDragging, sidebarWidthSpring]);

  // Double-click on sash to toggle sidebar
  const handleSashDoubleClick = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  // Single click on collapsed edge to expand
  const handleCollapsedClick = useCallback(() => {
    if (!sidebarVisible) {
      toggleSidebar();
    }
  }, [sidebarVisible, toggleSidebar]);

  const isSidebarOverlay = sidebarVisible && isCompact;

  return (
    <div className="flex h-screen flex-col bg-bg-app" data-testid="main-layout">
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Sidebar - always in DOM, animates between expanded and collapsed */}
        {!isSidebarOverlay && (
          <motion.aside
            className="flex flex-col border-r border-border-default bg-bg-surface overflow-hidden relative shrink-0"
            style={{ width: sidebarWidthSpring }}
            data-testid="sidebar"
          >
            {/* Sidebar content - fades out when collapsing */}
            <motion.div
              className="flex-1 overflow-hidden"
              style={{ opacity: sidebarContentOpacity }}
            >
              <Sidebar />
            </motion.div>

            {/* Sash / collapsed indicator - double-click to toggle */}
            <div
              className={cn(
                getSashClasses('right', isSidebarDragging),
                // When collapsed, the whole sidebar edge is the click target
                !sidebarVisible && 'w-full cursor-pointer hover:bg-border-default/30'
              )}
              data-testid="sidebar-resizer"
              onClick={handleCollapsedClick}
              onDoubleClick={handleSashDoubleClick}
              onPointerDown={sidebarVisible ? handleSidebarPointerDown : undefined}
              onPointerMove={sidebarVisible ? handleSidebarPointerMove : undefined}
              onPointerUp={sidebarVisible ? handleSidebarPointerUp : undefined}
              onPointerCancel={sidebarVisible ? handleSidebarPointerUp : undefined}
              role="separator"
              aria-label={sidebarVisible ? 'Resize sidebar (double-click to collapse)' : 'Expand sidebar'}
              aria-orientation="vertical"
              aria-valuenow={sidebarVisible ? sidebarWidth : COLLAPSED_SIDEBAR_WIDTH}
              aria-valuemin={COLLAPSED_SIDEBAR_WIDTH}
              aria-valuemax={MAX_SIDEBAR_WIDTH}
            />
          </motion.aside>
        )}

        {/* Overlay mode for compact screens */}
        <AnimatePresence>
          {isSidebarOverlay && (
            <>
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border-default bg-bg-surface shadow-lg"
                initial={{ x: -256, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -256, opacity: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', ...sidebarSpring }}
                style={{ width: 256 }}
                data-testid="sidebar"
              >
                <Sidebar />
              </motion.aside>
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
                transition={{ duration: 0.2 }}
              />
            </>
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

              {/* Pane sash */}
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
