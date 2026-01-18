import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { PanelTabType } from './PanelTabs';

interface PanelContentProps {
  /** Currently active tab */
  activeTab: PanelTabType;
  /** Network tab content */
  networkContent: React.ReactNode;
  /** Console tab content */
  consoleContent: React.ReactNode;
}

/**
 * PanelContent - Animated content wrapper for panel tab switching.
 *
 * Provides smooth fade transitions when switching between Network and Console tabs.
 * Uses AnimatePresence with mode="wait" to ensure clean transitions without content overlap.
 *
 * @example
 * ```tsx
 * <PanelContent
 *   activeTab={activeTab}
 *   networkContent={<NetworkHistoryPanel {...props} />}
 *   consoleContent={<ConsolePanel />}
 * />
 * ```
 */
export const PanelContent = ({
  activeTab,
  networkContent,
  consoleContent,
}: PanelContentProps): React.JSX.Element => {
  return (
    <div className="flex-1 overflow-hidden">
      <AnimatePresence mode="wait">
        {activeTab === 'network' ? (
          <motion.div
            key="network"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-auto"
            style={{ scrollbarGutter: 'stable' }}
          >
            {networkContent}
          </motion.div>
        ) : (
          <motion.div
            key="console"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-auto"
            style={{ scrollbarGutter: 'stable' }}
          >
            {consoleContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
