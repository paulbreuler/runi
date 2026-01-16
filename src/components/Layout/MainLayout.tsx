import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform } from 'motion/react';
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

const MIN_PANE_SIZE = 20; // Minimum 20% width
const MAX_PANE_SIZE = 80; // Maximum 80% width
const DEFAULT_SPLIT = 50; // 50/50 split

// Sidebar resizing constants
const MIN_SIDEBAR_WIDTH = 256; // Minimum width in pixels (current default)
const MAX_SIDEBAR_WIDTH = 500; // Maximum width in pixels
const DEFAULT_SIDEBAR_WIDTH = 256; // Default width in pixels

// Animation variants following Motion best practices
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

// Immediate transition for drag (no animation lag)
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
  
  // Pane split state (percentage for request pane) - this is the "committed" value
  const [requestPaneSize, setRequestPaneSize] = useState(DEFAULT_SPLIT);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sidebar width state (pixels) - this is the "committed" value
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);

  // Initialize sidebar visibility
  React.useEffect(() => {
    setSidebarVisible(initialSidebarVisible);
  }, [initialSidebarVisible, setSidebarVisible]);

  // Register keyboard shortcut
  useKeyboardShortcuts({
    key: 'b',
    modifier: isMacSync() ? 'meta' : 'ctrl',
    handler: toggleSidebar,
    description: `${getModifierKeyName()}B - Toggle sidebar`,
  });

  // Container width tracking for drag constraints
  const containerWidthRef = useRef<number>(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width when container is available
  useEffect(() => {
    const updateWidth = (): void => {
      if (containerRef.current) {
        const width = containerRef.current.getBoundingClientRect().width;
        containerWidthRef.current = width;
        setContainerWidth(width);
      }
    };
    
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Pane resizer: Official Motion.dev pattern - track percentage, not pixels
  // This is simpler and more reliable than pixel-based tracking
  const paneWidthPercent = useMotionValue(DEFAULT_SPLIT);
  
  // Sync MotionValue with state when state changes (non-drag updates)
  useEffect((): void => {
    if (!isDragging && containerWidth > 0) {
      paneWidthPercent.set(requestPaneSize);
    }
  }, [requestPaneSize, paneWidthPercent, isDragging, containerWidth]);

  // Transform percentage to width strings
  const requestWidth = useTransform(paneWidthPercent, (percent) => {
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, percent));
    return `${String(clamped)}%`;
  });
  const responseWidth = useTransform(paneWidthPercent, (percent) => {
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, percent));
    return `${String(100 - clamped)}%`;
  });

  // Resizer position - calculated from percentage
  const resizerLeft = useTransform(paneWidthPercent, (percent) => {
    if (containerWidth === 0) return '50%';
    const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, percent));
    return `${String(clamped)}%`;
  });

  // Store initial percentage at drag start
  const dragStartPercent = useRef(DEFAULT_SPLIT);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    dragStartPercent.current = paneWidthPercent.get();
  }, [paneWidthPercent]);

  // Handle drag - update percentage based on drag offset
  const handleDrag = useCallback(
    (_event: PointerEvent, info: { offset: { x: number } }) => {
      if (containerWidth > 0) {
        // Convert pixel offset to percentage change
        const deltaPercent = (info.offset.x / containerWidth) * 100;
        const newPercent = dragStartPercent.current + deltaPercent;
        const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, newPercent));
        paneWidthPercent.set(clamped);
      }
    },
    [paneWidthPercent, containerWidth]
  );

  // Handle drag end - commit to state
  const handleDragEnd = useCallback(() => {
    requestAnimationFrame((): void => {
      const finalPercent = paneWidthPercent.get();
      const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, finalPercent));
      setRequestPaneSize(clamped);
      paneWidthPercent.set(clamped);
      setIsDragging(false);
    });
  }, [paneWidthPercent]);

  // Sidebar resizing: Use MotionValue for sidebar width in pixels
  const sidebarWidthMotion = useMotionValue(DEFAULT_SIDEBAR_WIDTH);
  
  // Sync sidebar MotionValue with state
  useEffect(() => {
    if (!isSidebarDragging) {
      sidebarWidthMotion.set(sidebarWidth);
    }
  }, [sidebarWidth, sidebarWidthMotion, isSidebarDragging]);

  // Sidebar width as style string
  const sidebarWidthStyle = useTransform(sidebarWidthMotion, (width) => `${String(width)}px`);

  // Sidebar drag handlers
  const handleSidebarDragStart = useCallback(() => {
    setIsSidebarDragging(true);
  }, []);

  const handleSidebarDrag = useCallback(
    (_event: PointerEvent, info: { point: { x: number } }) => {
      // For sidebar, we drag from the right edge, so x is the new width
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

  // Determine sidebar variant based on state
  const sidebarVariant = isSidebarOverlay
    ? 'overlay'
    : shouldShowSidebar && isSpacious
      ? 'visible'
      : 'hidden';

  return (
    <div className="flex h-screen flex-col bg-bg-app" data-testid="main-layout">
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Sidebar with responsive behavior */}
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
              transition={springTransition}
              style={{ 
                width: isSidebarOverlay ? 256 : sidebarWidthStyle,
                scrollbarGutter: 'stable',
                willChange: isSidebarDragging ? 'width' : 'auto',
              }}
              layout={!isSidebarDragging}
              data-testid="sidebar"
            >
              <Sidebar />
              
              {/* Sidebar resizer - only show when not in overlay mode */}
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
                  {/* Handle */}
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

        {/* Overlay backdrop for compact window sidebar */}
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

        {/* Vertical layout: Fixed header bar + split content area */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* Fixed header bar */}
          <div className="shrink-0" data-testid="header-bar">
            {headerContent || (
              <div className="h-14 p-2 text-text-secondary flex items-center">
                Header bar placeholder
              </div>
            )}
          </div>

          {/* Responsive split: Request/Response with Motion drag */}
          <LayoutGroup>
            <div
              ref={containerRef}
              className="flex-1 overflow-hidden flex relative"
              data-testid="pane-container"
              style={{
                scrollbarGutter: 'stable',
              }}
            >
              {/* Request Pane */}
              <motion.div
                layout={!isDragging}
                className="h-full overflow-hidden shrink-0"
                data-testid="request-pane"
                style={{ 
                  width: requestWidth,
                  scrollbarGutter: 'stable',
                  willChange: isDragging ? 'width' : 'auto',
                }}
                transition={isDragging ? immediateTransition : layoutTransition}
              >
                {requestContent || (
                  <div className="h-full p-4 text-text-secondary flex items-center justify-center">
                    Request Builder (placeholder - will be built in Run 2B)
                  </div>
                )}
              </motion.div>

              {/* Resizer - Official Motion.dev pattern: absolute positioned, no dragConstraints */}
              <motion.div
                className="absolute top-0 bottom-0 w-1 bg-border-default cursor-col-resize group z-10 hover:w-2 transition-all border-l border-r border-border-subtle"
                data-testid="pane-resizer"
                style={{
                  left: resizerLeft,
                  transform: 'translateX(-50%)',
                  willChange: isDragging ? 'left' : 'auto',
                }}
                drag="x"
                dragElastic={0}
                dragMomentum={false}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
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
                aria-label="Resize panes"
                aria-orientation="vertical"
                aria-valuenow={requestPaneSize}
                aria-valuemin={MIN_PANE_SIZE}
                aria-valuemax={MAX_PANE_SIZE}
                transition={isDragging ? immediateTransition : layoutTransition}
              >
                {/* Handle */}
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

              {/* Response Pane */}
              <motion.div
                layout={!isDragging}
                className="h-full overflow-hidden shrink-0"
                data-testid="response-pane"
                style={{ 
                  width: responseWidth,
                  scrollbarGutter: 'stable',
                  willChange: isDragging ? 'width' : 'auto',
                }}
                transition={isDragging ? immediateTransition : layoutTransition}
              >
                {responseContent || (
                  <div className="h-full p-4 text-text-secondary flex items-center justify-center">
                    Response Viewer (placeholder - will be built in Run 2C)
                  </div>
                )}
              </motion.div>
            </div>
          </LayoutGroup>
        </div>
      </div>
      <StatusBar />
    </div>
  );
};
