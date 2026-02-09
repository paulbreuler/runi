/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

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
  /** Activity feed content */
  activityContent?: React.ReactNode;
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
  activityContent,
}: PanelContentProps): React.JSX.Element => {
  const renderContent = (): React.JSX.Element => {
    switch (activeTab) {
      case 'network':
        return (
          <motion.div
            key="network"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-hidden"
          >
            {networkContent}
          </motion.div>
        );
      case 'activity':
        return (
          <motion.div
            key="activity"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-hidden"
          >
            {activityContent}
          </motion.div>
        );
      case 'console':
      default:
        return (
          <motion.div
            key="console"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full overflow-hidden"
          >
            {consoleContent}
          </motion.div>
        );
    }
  };

  return (
    <div className="h-full overflow-hidden">
      <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
    </div>
  );
};
