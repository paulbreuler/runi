import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

export const MainLayout = ({
  headerContent,
  requestContent,
  responseContent,
  initialSidebarVisible = true,
}: MainLayoutProps): React.JSX.Element => {
  const { sidebarVisible, toggleSidebar, setSidebarVisible } = useSettingsStore();
  const { isCompact, isSpacious } = useResponsive();

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

  const shouldShowSidebar = sidebarVisible;
  const isSidebarOverlay = shouldShowSidebar && isCompact;

  return (
    <div className="flex h-screen flex-col bg-bg-app" data-testid="main-layout">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with responsive behavior */}
        <AnimatePresence>
          {shouldShowSidebar && (
            <motion.aside
              className={cn(
                'flex flex-col border-r bg-bg-surface transition-all duration-200 overflow-hidden',
                isSpacious ? 'w-64' : 'w-0',
                isSidebarOverlay && 'fixed inset-y-0 left-0 z-50 shadow-lg w-64'
              )}
              initial={false}
              animate={{ width: isSpacious && shouldShowSidebar ? 256 : isSidebarOverlay ? 256 : 0 }}
              exit={{ width: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <Sidebar />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        {/* Vertical layout: Fixed header bar + split content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Fixed header bar */}
          <div className="shrink-0" data-testid="header-bar">
            {headerContent || (
              <div className="h-14 p-2 text-text-secondary flex items-center">
                Header bar placeholder
              </div>
            )}
          </div>

          {/* Responsive split: Request/Response */}
          <div className="flex-1 overflow-hidden flex">
            {/* Request Pane */}
            <motion.div
              className="h-full flex-1 overflow-hidden"
              data-testid="request-pane"
              initial={false}
              animate={{ flex: 1 }}
            >
              {requestContent || (
                <div className="h-full p-4 text-text-secondary flex items-center justify-center">
                  Request Builder (placeholder - will be built in Run 2B)
                </div>
              )}
            </motion.div>

            {/* Resizer */}
            <div className="w-2 bg-border-default hover:bg-accent-blue/20 transition-colors duration-200 cursor-col-resize" data-testid="pane-resizer" />

            {/* Response Pane */}
            <motion.div
              className="h-full flex-1 overflow-hidden"
              data-testid="response-pane"
              initial={false}
              animate={{ flex: 1 }}
            >
              {responseContent || (
                <div className="h-full p-4 text-text-secondary flex items-center justify-center">
                  Response Viewer (placeholder - will be built in Run 2C)
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      <StatusBar />
    </div>
  );
};
