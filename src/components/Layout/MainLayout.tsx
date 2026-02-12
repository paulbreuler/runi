/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { KeybindingService } from '@/services/keybindingService';
import { useTabCommands } from '@/hooks/useTabCommands';
import { useLayoutCommands } from '@/hooks/useLayoutCommands';

import { motion, AnimatePresence, useTransform, useReducedMotion, useSpring } from 'motion/react';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { DockablePanel } from './DockablePanel';
import { TitleBar } from './TitleBar';
import { TabBar } from './TabBar';
import { ContextToolbar } from './ContextToolbar';
import { CanvasHost } from './CanvasHost';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePanelStore } from '@/stores/usePanelStore';
import { useResponsive } from '@/hooks/useResponsive';
import { useWindowFocus } from '@/hooks/useWindowFocus';
import { cn } from '@/utils/cn';
import { NetworkHistoryPanel } from '../History/NetworkHistoryPanel';
import { ConsolePanel } from '../Console/ConsolePanel';
import { PanelTabs, type PanelTabType } from '@/components/PanelTabs';
import { PanelContent } from '@/components/PanelContent';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { generateCurlCommand } from '@/utils/curl';
import type { NetworkHistoryEntry } from '@/types/history';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { SettingsPanel } from '@/components/Settings/SettingsPanel';
import { ActivityFeed } from '@/components/ActivityFeed';
import { useActivityStore } from '@/stores/useActivityStore';
import { useTabStore } from '@/stores/useTabStore';

export interface MainLayoutProps {
  headerContent?: React.ReactNode;
  initialSidebarVisible?: boolean;
}

const MIN_SIDEBAR_WIDTH = 260;
const MAX_SIDEBAR_WIDTH = 600;
const DEFAULT_SIDEBAR_WIDTH = 300;
const COLLAPSED_SIDEBAR_WIDTH = 8; // Slim page edge when collapsed
const SIDEBAR_COLLAPSE_BUFFER = 24; // Pixels below min before collapsing

interface LayoutBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

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

/**
 * Sash classes - minimal, grounded resize handle styling
 */
const getSashClasses = (position: 'left' | 'right', isDragging: boolean): string =>
  cn(
    'absolute top-0 bottom-0 z-30 touch-none transition-colors',
    'cursor-col-resize select-none',
    position === 'right' ? 'right-0' : 'left-0',
    'w-[2px] bg-transparent',
    'hover:bg-border-subtle/50',
    isDragging && 'bg-border-default'
  );

export const MainLayout = ({
  headerContent,
  initialSidebarVisible = true, // Default to visible now that collections are supported
}: MainLayoutProps): React.JSX.Element => {
  const { sidebarVisible, sidebarEdge, toggleSidebar, setSidebarVisible } = useSettingsStore();
  const { position: panelPosition, isVisible: panelVisible, setVisible } = usePanelStore();
  const { isCompact } = useResponsive();
  const prefersReducedMotion = useReducedMotion() === true;

  const layoutRef = useRef<HTMLDivElement>(null);

  // Panel tab state
  const [activeTab, setActiveTab] = useState<PanelTabType>('network');
  const { entries } = useHistoryStore();
  const activityEntries = useActivityStore((s) => s.entries);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const isSidebarDraggingRef = useRef(false); // Sync ref for pointer handlers (state is async)
  const sidebarDragCurrentWidth = useRef(DEFAULT_SIDEBAR_WIDTH); // Track actual drag position (spring lags)
  const [isSidebarCollapseHint, setIsSidebarCollapseHint] = useState(false);
  const isSidebarCollapseHintRef = useRef(false);
  const isInitialMount = useRef(true);

  // Initialize sidebar visibility on mount only
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setSidebarVisible(initialSidebarVisible);
    }
  }, [initialSidebarVisible, setSidebarVisible]);

  // Centralized keybinding system: register domain commands and start service
  useTabCommands();
  useLayoutCommands();

  useEffect(() => {
    const service = new KeybindingService();
    service.start();
    return (): void => {
      service.stop();
    };
  }, []);

  // Track target correlation ID for console panel jump
  const [targetCorrelationId, setTargetCorrelationId] = useState<string | undefined>(undefined);

  // Listen for console panel requests (e.g., from error toasts)
  useEffect(() => {
    const unsubscribe = globalEventBus.on<{ correlationId?: string }>(
      'panel.console-requested',
      (event) => {
        setVisible(true);
        setActiveTab('console');
        // Pass correlation ID to console panel for jumping to entry
        if (event.payload.correlationId !== undefined) {
          setTargetCorrelationId(event.payload.correlationId);
        }
      }
    );

    return unsubscribe;
  }, [setVisible, setActiveTab]);

  // Listen for global UI events
  useEffect(() => {
    const unsubSettings = globalEventBus.on('settings.toggle', () => {
      setIsSettingsOpen((prev) => !prev);
    });

    const unsubSidebar = globalEventBus.on('sidebar.toggle', () => {
      toggleSidebar();
    });

    const unsubPanel = globalEventBus.on('panel.toggle', () => {
      // Canonical panel-toggle behavior: all sources emit 'panel.toggle' and rely on this logic.
      const { isVisible, isCollapsed, setVisible, setCollapsed } = usePanelStore.getState();
      if (!isVisible) {
        setVisible(true);
        setCollapsed(false);
      } else if (isCollapsed) {
        setCollapsed(false);
      } else {
        setVisible(false);
      }
    });

    const unsubNewRequest = globalEventBus.on('request.new', () => {
      useTabStore.getState().openTab();
    });

    return (): void => {
      unsubSettings();
      unsubSidebar();
      unsubPanel();
      unsubNewRequest();
    };
  }, [toggleSidebar]);

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

  const collapseThreshold = MIN_SIDEBAR_WIDTH - SIDEBAR_COLLAPSE_BUFFER;

  // Sidebar content opacity - fade out with stronger cue past collapse threshold
  const sidebarContentOpacity = useTransform(
    sidebarWidthSpring,
    [COLLAPSED_SIDEBAR_WIDTH, COLLAPSED_SIDEBAR_WIDTH + 50, collapseThreshold, MIN_SIDEBAR_WIDTH],
    [0, 0, 0.45, 1]
  );

  // Prevent text selection during sidebar drag
  useEffect((): (() => void) => {
    if (isSidebarDragging) {
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
  }, [isSidebarDragging]);

  const getLayoutBounds = useCallback((): LayoutBounds => {
    if (layoutRef.current !== null) {
      const rect = layoutRef.current.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      left: 0,
      right: width,
      top: 0,
      bottom: height,
      width,
      height,
    };
  }, []);

  const getSidebarDragSize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): number => {
      const bounds = getLayoutBounds();
      switch (sidebarEdge) {
        case 'right':
          return bounds.right - event.clientX;
        case 'bottom':
          return bounds.bottom - event.clientY;
        default:
          return event.clientX - bounds.left;
      }
    },
    [getLayoutBounds, sidebarEdge]
  );

  // Pane resizer handlers
  // Sidebar resizer handlers - works both expanded and collapsed
  // Uses refs for synchronous state in pointer handlers (React state updates are async)
  const handleSidebarPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);

      // Set ref synchronously so pointermove can read it immediately
      isSidebarDraggingRef.current = true;
      setIsSidebarDragging(true);

      // Track where we started for drag feedback
      const startWidth = sidebarVisible ? sidebarWidth : COLLAPSED_SIDEBAR_WIDTH;
      sidebarDragCurrentWidth.current = startWidth;
      isSidebarCollapseHintRef.current = false;
      setIsSidebarCollapseHint(false);

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

      const newWidth = getSidebarDragSize(e);
      // Allow dragging below MIN for the "page turning" feel
      const clamped = Math.max(COLLAPSED_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth));
      sidebarDragCurrentWidth.current = clamped; // Track actual position (spring lags behind)
      const shouldHint = clamped <= collapseThreshold;
      if (shouldHint !== isSidebarCollapseHintRef.current) {
        isSidebarCollapseHintRef.current = shouldHint;
        setIsSidebarCollapseHint(shouldHint);
      }
      sidebarWidthSpring.set(clamped);
    },
    [collapseThreshold, getSidebarDragSize, sidebarWidthSpring]
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

      if (finalWidth <= collapseThreshold) {
        setSidebarVisible(false);
      } else {
        const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, finalWidth));
        setSidebarWidth(clamped);
      }

      // Clear both ref and state
      isSidebarDraggingRef.current = false;
      isSidebarCollapseHintRef.current = false;
      setIsSidebarCollapseHint(false);
      setIsSidebarDragging(false);
    },
    [collapseThreshold, setSidebarVisible]
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

  // Placeholder handlers for action buttons (to be implemented)
  const handleChainRequest = useCallback((entry: NetworkHistoryEntry): void => {
    globalEventBus.emit('toast.show', {
      type: 'info',
      message: 'Chain Request',
      details: `Chaining request to ${entry.request.url} - Feature coming soon`,
    } satisfies ToastEventPayload);
  }, []);

  const handleGenerateTests = useCallback((entry: NetworkHistoryEntry): void => {
    globalEventBus.emit('toast.show', {
      type: 'info',
      message: 'Generate Tests',
      details: `Generating tests for ${entry.request.method} ${entry.request.url} - Feature coming soon`,
    } satisfies ToastEventPayload);
  }, []);

  const handleAddToCollection = useCallback((entry: NetworkHistoryEntry): void => {
    globalEventBus.emit('toast.show', {
      type: 'info',
      message: 'Add to Collection',
      details: `Adding ${entry.request.method} ${entry.request.url} to collection - Feature coming soon`,
    } satisfies ToastEventPayload);
  }, []);

  const handleBlockToggle = useCallback((id: string, isBlocked: boolean): void => {
    const action = isBlocked ? 'Blocked' : 'Unblocked';
    globalEventBus.emit('toast.show', {
      type: isBlocked ? 'warning' : 'success',
      message: `Request ${action}`,
      details: `Request ${id} has been ${action.toLowerCase()} - Feature coming soon`,
    } satisfies ToastEventPayload);
  }, []);

  // Memoize the history panel callbacks to avoid unnecessary re-renders
  const historyPanelProps = useMemo(
    () => ({
      onReplay: handleReplay,
      onCopyCurl: handleCopyCurl,
      onChain: handleChainRequest,
      onGenerateTests: handleGenerateTests,
      onAddToCollection: handleAddToCollection,
      onBlockToggle: handleBlockToggle,
    }),
    [
      handleReplay,
      handleCopyCurl,
      handleChainRequest,
      handleGenerateTests,
      handleAddToCollection,
      handleBlockToggle,
    ]
  );

  const isSidebarOverlay = sidebarVisible && isCompact;
  const isFocused = useWindowFocus();

  return (
    <div
      ref={layoutRef}
      className={cn(
        'relative z-0 flex h-screen flex-col bg-bg-app transition-colors duration-300',
        !isFocused && 'window-blur'
      )}
      data-test-id="main-layout"
    >
      <div className="shrink-0">
        <TitleBar
          onSettingsClick={() => {
            setIsSettingsOpen((prev) => !prev);
          }}
        >
          {headerContent}
        </TitleBar>
      </div>
      <div className="relative flex flex-1 min-h-0 overflow-hidden gap-0">
        {/* Settings overlay: contained between title bar and status bar */}
        {isSettingsOpen && (
          <div className="absolute inset-0 z-80 flex" data-test-id="settings-overlay">
            <button
              type="button"
              className="absolute inset-0 bg-transparent"
              onClick={() => {
                setIsSettingsOpen(false);
              }}
              aria-label="Close settings"
              data-test-id="settings-overlay-backdrop"
            />
            <div className="ml-auto h-full shadow-2xl relative z-81">
              <SettingsPanel
                isOpen
                onClose={() => {
                  setIsSettingsOpen(false);
                }}
              />
            </div>
          </div>
        )}
        {/* Sidebar - animates in/out of DOM based on visibility */}
        {!isSidebarOverlay && (
          <AnimatePresence>
            {sidebarVisible && (
              <motion.aside
                className="flex flex-col border-r border-border-default bg-bg-surface overflow-hidden relative shrink-0"
                style={{ width: sidebarWidthSpring }}
                data-test-id="sidebar"
                initial={false}
                exit={{ width: 0, opacity: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : sidebarSpring}
              >
                {/* Sidebar content - fades out when collapsing */}
                <motion.div
                  className="flex-1 flex flex-col overflow-hidden"
                  style={{ opacity: sidebarContentOpacity }}
                  data-test-id="sidebar-wrapper"
                  data-collapse-hint={isSidebarCollapseHint}
                >
                  <Sidebar />
                </motion.div>

                {/* Sash / collapsed indicator - drag or double-click to toggle */}
                <div
                  className={cn(getSashClasses('right', isSidebarDragging))}
                  data-test-id="sidebar-resizer"
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
                data-test-id="sidebar"
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
                data-test-id="sidebar-overlay"
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

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden min-w-0">
          {/* Tabs for open contexts */}
          <TabBar />

          {/* Context toolbar - renders toolbar for active context */}
          <ContextToolbar />

          {/* Content area with panes and dockable panel */}
          <div
            className={cn(
              'flex flex-1 min-h-0 overflow-hidden',
              panelPosition === 'left' || panelPosition === 'right' ? 'flex-row' : 'flex-col'
            )}
            data-test-id="content-area"
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
                    activityCount={activityEntries.length}
                  />
                }
              >
                <PanelContent
                  activeTab={activeTab}
                  networkContent={<NetworkHistoryPanel {...historyPanelProps} />}
                  consoleContent={
                    <ConsolePanel
                      targetCorrelationId={targetCorrelationId}
                      onTargetCorrelationIdConsumed={() => {
                        setTargetCorrelationId(undefined);
                      }}
                    />
                  }
                  activityContent={<ActivityFeed className="h-full" />}
                />
              </DockablePanel>
            )}

            <CanvasHost className="flex-1" />

            {/* Right dock panel */}
            {panelPosition === 'right' && (
              <DockablePanel
                title="DevTools"
                headerContent={
                  <PanelTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    networkCount={entries.length}
                    activityCount={activityEntries.length}
                  />
                }
              >
                <PanelContent
                  activeTab={activeTab}
                  networkContent={<NetworkHistoryPanel {...historyPanelProps} />}
                  consoleContent={
                    <ConsolePanel
                      targetCorrelationId={targetCorrelationId}
                      onTargetCorrelationIdConsumed={() => {
                        setTargetCorrelationId(undefined);
                      }}
                    />
                  }
                  activityContent={<ActivityFeed className="h-full" />}
                />
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
              activityCount={activityEntries.length}
            />
          }
        >
          <PanelContent
            activeTab={activeTab}
            networkContent={<NetworkHistoryPanel {...historyPanelProps} />}
            consoleContent={
              <ConsolePanel
                targetCorrelationId={targetCorrelationId}
                onTargetCorrelationIdConsumed={() => {
                  setTargetCorrelationId(undefined);
                }}
              />
            }
            activityContent={<ActivityFeed className="h-full" />}
          />
        </DockablePanel>
      )}

      <StatusBar />
    </div>
  );
};
