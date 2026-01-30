/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Terminal, Network } from 'lucide-react';
import { Tabs } from '@base-ui/react/tabs';
import { motion, LayoutGroup, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

export type PanelTabType = 'network' | 'console';

interface PanelTabsProps {
  activeTab: PanelTabType;
  onTabChange: (tab: PanelTabType) => void;
  networkCount?: number;
  consoleCount?: number;
}

/**
 * PanelTabs - Tab switcher for dockable panel content.
 *
 * Uses Base UI Tabs primitives with Motion animations for smooth tab indicator transitions.
 * Allows switching between Network History and Console views.
 *
 * ## Features
 *
 * - **Accessible**: Built on Base UI Tabs with full keyboard navigation (Tab, Arrow keys, Enter/Space)
 * - **Animated**: Tab indicator uses Motion's `layoutId` for shared element transitions
 * - **Spring Physics**: Indicator animates with spring physics (stiffness: 300, damping: 30)
 * - **Reduced Motion**: Respects `prefers-reduced-motion` setting
 * - **Interactive**: Hover (scale: 1.02) and tap (scale: 0.98) animations on buttons
 *
 * ## Animation Details
 *
 * The tab indicator uses Motion's `layoutId="panel-tab-indicator"` to create a shared element
 * transition. When switching tabs, the indicator smoothly animates from one tab to another
 * using spring physics. This pattern is inspired by Motion.dev's Tabs examples.
 *
 * ## Accessibility
 *
 * - Full keyboard navigation provided by Base UI
 * - ARIA attributes handled automatically
 * - Focus management on tab activation
 *
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useState<PanelTabType>('network');
 *
 * <PanelTabs
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   networkCount={5}
 *   consoleCount={3}
 * />
 * ```
 */
export const PanelTabs = ({
  activeTab,
  onTabChange,
  networkCount = 0,
  consoleCount = 0,
}: PanelTabsProps): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion() === true;

  return (
    <Tabs.Root value={activeTab} onValueChange={onTabChange as (value: string) => void}>
      <LayoutGroup>
        <Tabs.List
          className="flex items-center gap-1 border-r border-border-default pr-2 mr-2 relative"
          data-testid="tabs-list"
        >
          {/* Network Tab */}
          <Tabs.Tab
            value="network"
            render={({
              onDrag: _onDrag,
              onDragStart: _onDragStart,
              onDragEnd: _onDragEnd,
              onAnimationStart: _onAnimStart,
              onAnimationEnd: _onAnimEnd,
              ...props
            }) => (
              <motion.button
                {...props}
                type="button"
                className={cn(
                  'px-2 py-1 text-xs rounded flex items-center gap-1.5 relative',
                  activeTab === 'network'
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50'
                )}
                whileHover={activeTab !== 'network' ? { scale: 1.02 } : undefined}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'network' && (
                  <motion.div
                    layoutId="panel-tab-indicator"
                    className="absolute inset-0 bg-bg-raised rounded pointer-events-none z-0"
                    data-testid="panel-tab-indicator"
                    data-layout-id="panel-tab-indicator"
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 300, damping: 30 }
                    }
                    initial={false}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Network size={12} />
                  <span>Network</span>
                  {networkCount > 0 && (
                    <span className="px-1 py-0.5 text-[10px] bg-bg-elevated rounded">
                      {networkCount}
                    </span>
                  )}
                </span>
              </motion.button>
            )}
          />

          {/* Console Tab */}
          <Tabs.Tab
            value="console"
            render={({
              onDrag: _onDrag,
              onDragStart: _onDragStart,
              onDragEnd: _onDragEnd,
              onAnimationStart: _onAnimStart,
              onAnimationEnd: _onAnimEnd,
              ...props
            }) => (
              <motion.button
                {...props}
                type="button"
                className={cn(
                  'px-2 py-1 text-xs rounded flex items-center gap-1.5 relative',
                  activeTab === 'console'
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50'
                )}
                whileHover={activeTab !== 'console' ? { scale: 1.02 } : undefined}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'console' && (
                  <motion.div
                    layoutId="panel-tab-indicator"
                    className="absolute inset-0 bg-bg-raised rounded pointer-events-none z-0"
                    data-testid="panel-tab-indicator"
                    data-layout-id="panel-tab-indicator"
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 300, damping: 30 }
                    }
                    initial={false}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Terminal size={12} />
                  <span>Console</span>
                  {consoleCount > 0 && (
                    <span className="px-1 py-0.5 text-[10px] bg-bg-elevated rounded">
                      {consoleCount}
                    </span>
                  )}
                </span>
              </motion.button>
            )}
          />
        </Tabs.List>
      </LayoutGroup>
    </Tabs.Root>
  );
};
