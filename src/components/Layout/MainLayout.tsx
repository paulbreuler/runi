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

export const MainLayout = ({
  headerContent,
  requestContent,
  responseContent,
  initialSidebarVisible = true,
}: MainLayoutProps): React.JSX.Element => {
  const { sidebarVisible, toggleSidebar, setSidebarVisible } = useSettingsStore();
  const { isCompact, isSpacious } = useResponsive();
  const prefersReducedMotion = useReducedMotion() === true;

  const [requestPaneSize, setRequestPaneSize] = useState(DEFAULT_SPLIT);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);

  React.useEffect(() => {
    setSidebarVisible(initialSidebarVisible);
  }, [initialSidebarVisible, setSidebarVisible]);

  useKeyboardShortcuts({
    key: 'b',
    modifier: isMacSync() ? 'meta' : 'ctrl',
    handler: toggleSidebar,
    description: `${getModifierKeyName()}B - Toggle sidebar`,
  });

  // Split ratio as MotionValue (0-1)
  const splitRatio = useMotionValue(DEFAULT_SPLIT / 100);

  // Sync MotionValue with state when not dragging
  useEffect((): void => {
    if (!isDragging) {
      splitRatio.set(requestPaneSize / 100);
    }
  }, [requestPaneSize, splitRatio, isDragging]);

  // Transform ratio to width strings
  const requestWidth = useTransform(splitRatio, (ratio) => {
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, ratio * 100));
    return `${String(clamped)}%`;
  });

  const responseWidth = useTransform(splitRatio, (ratio) => {
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, ratio * 100));
    return `${String(100 - clamped)}%`;
  });

  // Resizer position derived from splitRatio
  const resizerLeft = useTransform(splitRatio, (ratio) => {
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, ratio * 100));
    return `${String(clamped)}%`;
  });

  // Prevent text selection and set cursor during drag
  useEffect((): (() => void) => {
    if (isDragging) {
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
  }, [isDragging]);

  // Pane resizer: pointer events for full control
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const newRatio = relativeX / rect.width;

      const minRatio = MIN_PANE_SIZE / 100;
      const maxRatio = MAX_PANE_SIZE / 100;
      const clamped = Math.max(minRatio, Math.min(maxRatio, newRatio));

      splitRatio.set(clamped);
    }
  }, [isDragging, splitRatio]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    const finalRatio = splitRatio.get();
    const finalPercent = finalRatio * 100;
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, finalPercent));
    setRequestPaneSize(clamped);
    setIsDragging(false);
  }, [isDragging, splitRatio]);

  // Sidebar resizing
  const sidebarWidthMotion = useMotionValue(DEFAULT_SIDEBAR_WIDTH);

  useEffect(() => {
    if (!isSidebarDragging) {
      sidebarWidthMotion.set(sidebarWidth);
    }
  }, [sidebarWidth, sidebarWidthMotion, isSidebarDragging]);

  const sidebarWidthStyle = useTransform(sidebarWidthMotion, (width) => `${String(width)}px`);

  const handleSidebarDragStart = useCallback(() => {
    setIsSidebarDragging(true);
  }, []);

  const handleSidebarDrag = useCallback(
    (_event: PointerEvent, info: { point: { x: number } }) => {
      const newWidth = info.point.x;
      const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
      sidebarWidthMotion.set(clamped);
    },
    [sidebarWidthMotion]
  );

  const handleSidebarDragEnd = useCallback(() => {
    requestAnimationFrame((): void => {
      const finalWidth = sidebarWidthMotion.get();
      const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, finalWidth));
      setSidebarWidth(clamped);
      sidebarWidthMotion.set(clamped);
      setIsSidebarDragging(false);
    });
  }, [sidebarWidthMotion]);

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
              className={cn(
                'flex flex-col border-r bg-bg-surface overflow-hidden relative shrink-0',
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
                willChange: isSidebarDragging ? 'transform' : 'auto',
              }}
              layout={!isSidebarDragging}
              data-testid="sidebar"
            >
              <Sidebar />

              {!isSidebarOverlay && (
                <motion.div
                  className="absolute top-0 right-0 w-1 h-full bg-border-default cursor-col-resize group hover:w-2 transition-all z-10"
                  data-testid="sidebar-resizer"
                  drag="x"
                  dragElastic={0}
                  dragMomentum={false}
                  dragConstraints={{ left: MIN_SIDEBAR_WIDTH, right: MAX_SIDEBAR_WIDTH }}
                  onDragStart={handleSidebarDragStart}
                  onDrag={handleSidebarDrag}
                  onDragEnd={handleSidebarDragEnd}
                  whileHover={{
                    width: 8,
                    backgroundColor: 'oklch(0.623 0.214 259.1 / 0.15)',
                    boxShadow: '0 0 0 1px oklch(0.623 0.214 259.1 / 0.2)',
                  }}
                  whileDrag={{
                    width: 8,
                    backgroundColor: 'oklch(0.623 0.214 259.1 / 0.25)',
                    boxShadow: '0 0 0 1px oklch(0.623 0.214 259.1 / 0.3), 0 2px 8px oklch(0 0 0 / 0.3)',
                    cursor: 'grabbing',
                  }}
                  role="separator"
                  aria-label="Resize sidebar"
                  aria-orientation="vertical"
                  aria-valuenow={sidebarWidth}
                  aria-valuemin={MIN_SIDEBAR_WIDTH}
                  aria-valuemax={MAX_SIDEBAR_WIDTH}
                  transition={isSidebarDragging ? immediateTransition : layoutTransition}
                >
                  <motion.div
                    className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    whileDrag={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex flex-col items-center gap-1 py-2">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1 h-1 rounded-full bg-accent-blue/40"
                          whileHover={{
                            scale: 1.2,
                            backgroundColor: 'oklch(0.623 0.214 259.1 / 0.6)',
                          }}
                          whileDrag={{
                            scale: 1.3,
                            backgroundColor: 'oklch(0.623 0.214 259.1 / 0.8)',
                          }}
                          transition={{ duration: 0.15 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
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
                layout={!isDragging}
                className="h-full overflow-hidden shrink-0"
                data-testid="request-pane"
                style={{
                  width: requestWidth,
                  scrollbarGutter: 'stable',
                  willChange: isDragging ? 'width' : 'auto',
                }}
                transition={isDragging || prefersReducedMotion ? immediateTransition : layoutTransition}
              >
                {requestContent !== undefined ? requestContent : (
                  <div className="h-full p-4 text-text-secondary flex items-center justify-center">
                    Request Builder (placeholder - will be built in Run 2B)
                  </div>
                )}
              </motion.div>

              <motion.div
                layout={!isDragging}
                className="h-full overflow-hidden flex-1"
                data-testid="response-pane"
                style={{
                  width: responseWidth,
                  scrollbarGutter: 'stable',
                  willChange: isDragging ? 'width' : 'auto',
                }}
                transition={isDragging || prefersReducedMotion ? immediateTransition : layoutTransition}
              >
                {responseContent !== undefined ? responseContent : (
                  <div className="h-full p-4 text-text-secondary flex items-center justify-center">
                    Response Viewer (placeholder - will be built in Run 2C)
                  </div>
                )}
              </motion.div>

              {/* Resizer: pure pointer events, no animation */}
              <motion.div
                className={cn(
                  'absolute top-0 bottom-0 w-1 bg-border-default cursor-col-resize z-10 touch-none',
                  'hover:w-2 hover:bg-accent-blue/15',
                  isDragging && 'w-2 bg-accent-blue/25'
                )}
                data-testid="pane-resizer"
                style={{
                  left: resizerLeft,
                  transform: 'translateX(-50%)',
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
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
