import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useMotionValue,
  useTransform,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { DockablePanel } from './DockablePanel';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePanelStore } from '@/stores/usePanelStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { isMacSync, getModifierKeyName } from '@/utils/platform';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/utils/cn';
import { NetworkHistoryPanel } from '../History/NetworkHistoryPanel';
import { ConsolePanel } from '../Console/ConsolePanel';
import { PanelTabs, type PanelTabType } from './PanelTabs';
import { globalEventBus } from '@/events/bus';
import { generateCurlCommand } from '@/utils/curl';
import type { NetworkHistoryEntry } from '@/types/history';
import { useHistoryStore } from '@/stores/useHistoryStore';

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
  const {
    position: panelPosition,
    isVisible: panelVisible,
    toggleVisibility: togglePanel,
    setVisible,
  } = usePanelStore();
  const { isCompact } = useResponsive();
  const prefersReducedMotion = useReducedMotion() === true;

  // Pane state
  const [requestPaneSize, setRequestPaneSize] = useState(DEFAULT_SPLIT);
  const [isPaneDragging, setIsPaneDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Panel tab state
  const [activeTab, setActiveTab] = useState<PanelTabType>('network');
  const { entries } = useHistoryStore();

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const isSidebarDraggingRef = useRef(false); // Sync ref for pointer handlers (state is async)
  const sidebarDragStartWidth = useRef(DEFAULT_SIDEBAR_WIDTH);
  const sidebarDragCurrentWidth = useRef(DEFAULT_SIDEBAR_WIDTH); // Track actual drag position (spring lags)
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

  // DevTools panel toggle: Cmd+Shift+I (Mac) or Ctrl+Shift+I (Windows/Linux)
  useKeyboardShortcuts({
    key: 'i',
    modifier: isMacSync() ? ['meta', 'shift'] : ['ctrl', 'shift'],
    handler: togglePanel,
    description: `${getModifierKeyName()}+Shift+I - Toggle DevTools panel`,
  });

  // Listen for console panel requests (e.g., from error toasts)
  useEffect(() => {
    const unsubscribe = globalEventBus.on<{ correlationId?: string }>(
      'panel.console-requested',
      () => {
        setVisible(true);
        setActiveTab('console');
      }
    );

    return unsubscribe;
  }, [setVisible, setActiveTab]);

  // Auto-collapse sidebar when left dock is active
  // Store the previous state to restore when switching away from left dock
  const prevSidebarVisible = useRef(sidebarVisible);

  useEffect(() => {
    if (panelPosition === 'left' && panelVisible) {
      // Save current sidebar state and collapse
      if (sidebarVisible) {
        prevSidebarVisible.current = true;
        setSidebarVisible(false);
      }
    } else if (panelPosition !== 'left' && prevSidebarVisible.current) {
      // Restore sidebar when switching away from left dock
      setSidebarVisible(true);
      prevSidebarVisible.current = false;
    }
  }, [panelPosition, panelVisible, sidebarVisible, setSidebarVisible]);

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
  const sidebarWidthSpring = useSpring(
    targetSidebarWidth,
    prefersReducedMotion ? { duration: 0 } : sidebarSpring
  );

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

  const handlePanePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPaneDragging) {
        return;
      }

      if (containerRef.current !== null) {
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        const newRatio = relativeX / rect.width;

        const minRatio = MIN_PANE_SIZE / 100;
        const maxRatio = MAX_PANE_SIZE / 100;
        const clamped = Math.max(minRatio, Math.min(maxRatio, newRatio));

        splitRatio.set(clamped);
      }
    },
    [isPaneDragging, splitRatio]
  );

  const handlePanePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPaneDragging) {
        return;
      }

      e.currentTarget.releasePointerCapture(e.pointerId);

      const finalRatio = splitRatio.get();
      const finalPercent = finalRatio * 100;
      const clamped = Math.max(MIN_PANE_SIZE, Math.min(MAX_PANE_SIZE, finalPercent));
      setRequestPaneSize(clamped);
      setIsPaneDragging(false);
    },
    [isPaneDragging, splitRatio]
  );

  // Sidebar resizer handlers - works both expanded and collapsed
  // Uses refs for synchronous state in pointer handlers (React state updates are async)
  const handleSidebarPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      // Set ref synchronously so pointermove can read it immediately
      isSidebarDraggingRef.current = true;
      setIsSidebarDragging(true);

      // Track where we started for collapse detection
      const startWidth = sidebarVisible ? sidebarWidth : COLLAPSED_SIDEBAR_WIDTH;
      sidebarDragStartWidth.current = startWidth;
      sidebarDragCurrentWidth.current = startWidth;

      // If collapsed, immediately set to visible so drag feels responsive
      if (!sidebarVisible) {
        setSidebarVisible(true);
      }
    },
    [sidebarVisible, sidebarWidth, setSidebarVisible]
  );

  const handleSidebarPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Use ref for synchronous check (state may not have updated yet)
      if (!isSidebarDraggingRef.current) {
        return;
      }

      const newWidth = e.clientX;
      // Allow dragging below MIN for the "page turning" feel
      const clamped = Math.max(COLLAPSED_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
      sidebarDragCurrentWidth.current = clamped; // Track actual position (spring lags behind)
      sidebarWidthSpring.set(clamped);
    },
    [sidebarWidthSpring]
  );

  const handleSidebarPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Use ref for synchronous check
      if (!isSidebarDraggingRef.current) {
        return;
      }

      e.currentTarget.releasePointerCapture(e.pointerId);

      // Use tracked position, not spring (spring animates and lags behind actual drag)
      const finalWidth = sidebarDragCurrentWidth.current;
      const startWidth = sidebarDragStartWidth.current;

      // Direction-based: dragging LEFT = close intent, dragging RIGHT = resize
      if (finalWidth < startWidth) {
        // User dragged left from start position → collapse
        setSidebarVisible(false);
      } else {
        // User dragged right from start position → resize, clamp to valid range
        const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, finalWidth));
        setSidebarWidth(clamped);
      }

      // Clear both ref and state
      isSidebarDraggingRef.current = false;
      setIsSidebarDragging(false);
    },
    [setSidebarVisible]
  );

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

  // History panel callbacks
  const handleReplay = useCallback((entry: NetworkHistoryEntry): void => {
    // Emit event to load the history entry into the request builder
    globalEventBus.emit('history.entry-selected', entry);
  }, []);

  const handleCopyCurl = useCallback(async (entry: NetworkHistoryEntry): Promise<void> => {
    const curl = generateCurlCommand(entry);
    await navigator.clipboard.writeText(curl);
  }, []);

  // Memoize the history panel callbacks to avoid unnecessary re-renders
  const historyPanelProps = useMemo(
    () => ({
      onReplay: handleReplay,
      onCopyCurl: handleCopyCurl,
    }),
    [handleReplay, handleCopyCurl]
  );

  const isSidebarOverlay = sidebarVisible && isCompact;

  return (
    <div className="flex h-screen flex-col bg-bg-app" data-testid="main-layout">
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* Sidebar - animates in/out of DOM based on visibility */}
        {!isSidebarOverlay && (
          <AnimatePresence>
            {sidebarVisible && (
              <motion.aside
                className="flex flex-col border-r border-border-default bg-bg-surface overflow-hidden relative shrink-0"
                style={{ width: sidebarWidthSpring }}
                data-testid="sidebar"
                initial={false}
                exit={{ width: 0, opacity: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : sidebarSpring}
              >
                {/* Sidebar content - fades out when collapsing */}
                <motion.div
                  className="flex-1 overflow-hidden"
                  style={{ opacity: sidebarContentOpacity }}
                >
                  <Sidebar />
                </motion.div>

                {/* Sash / collapsed indicator - drag or double-click to toggle */}
                <div
                  className={cn(getSashClasses('right', isSidebarDragging))}
                  data-testid="sidebar-resizer"
                  onClick={handleCollapsedClick}
                  onDoubleClick={handleSashDoubleClick}
                  onPointerDown={handleSidebarPointerDown}
                  onPointerMove={handleSidebarPointerMove}
                  onPointerUp={handleSidebarPointerUp}
                  onPointerCancel={handleSidebarPointerUp}
                  role="separator"
                  aria-label="Resize sidebar (double-click to collapse)"
                  aria-orientation="vertical"
                  aria-valuenow={sidebarWidth}
                  aria-valuemin={COLLAPSED_SIDEBAR_WIDTH}
                  aria-valuemax={MAX_SIDEBAR_WIDTH}
                />
              </motion.aside>
            )}
          </AnimatePresence>
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
                transition={
                  prefersReducedMotion ? { duration: 0 } : { type: 'spring', ...sidebarSpring }
                }
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
            {headerContent !== undefined ? (
              headerContent
            ) : (
              <div className="h-14 p-2 text-text-secondary flex items-center">
                Header bar placeholder
              </div>
            )}
          </div>

          {/* Content area with panes and dockable panel */}
          <div
            className={cn(
              'flex flex-1 overflow-hidden',
              panelPosition === 'left' || panelPosition === 'right' ? 'flex-row' : 'flex-col'
            )}
            data-testid="content-area"
          >
            {/* Left dock panel */}
            {panelPosition === 'left' && (
              <DockablePanel
                title="DevTools"
                headerContent={
                  <PanelTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    networkCount={entries.length}
                  />
                }
              >
                {activeTab === 'network' ? (
                  <NetworkHistoryPanel {...historyPanelProps} />
                ) : (
                  <ConsolePanel />
                )}
              </DockablePanel>
            )}

            <LayoutGroup>
              <motion.div
                ref={containerRef}
                className="flex-1 overflow-hidden flex relative min-w-0"
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
                  transition={
                    isPaneDragging || prefersReducedMotion ? immediateTransition : layoutTransition
                  }
                >
                  {requestContent !== undefined ? (
                    requestContent
                  ) : (
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
                  transition={
                    isPaneDragging || prefersReducedMotion ? immediateTransition : layoutTransition
                  }
                >
                  {responseContent !== undefined ? (
                    responseContent
                  ) : (
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

            {/* Right dock panel */}
            {panelPosition === 'right' && (
              <DockablePanel
                title="DevTools"
                headerContent={
                  <PanelTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    networkCount={entries.length}
                  />
                }
              >
                {activeTab === 'network' ? (
                  <NetworkHistoryPanel {...historyPanelProps} />
                ) : (
                  <ConsolePanel />
                )}
              </DockablePanel>
            )}
          </div>
        </div>
      </div>

      {/* Bottom dock panel - full width, outside sidebar/content container */}
      {panelPosition === 'bottom' && (
        <DockablePanel
          title="DevTools"
          headerContent={
            <PanelTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              networkCount={entries.length}
            />
          }
        >
          {activeTab === 'network' ? (
            <NetworkHistoryPanel {...historyPanelProps} />
          ) : (
            <ConsolePanel />
          )}
        </DockablePanel>
      )}

      <StatusBar />
    </div>
  );
};
