/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { Terminal, Network } from 'lucide-react';
import { Tabs } from '@base-ui/react/tabs';
import { BaseTabsList } from '@/components/ui/BaseTabsList';

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
 * - **Accessible**: Built on Base UI Tabs; roving tabindex (only active tab in tab order). Tab moves focus into panel content; Arrow keys move between tabs; Enter/Space to activate.
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
 * - Roving tabindex: only the active tab is in the tab order, so Tab moves focus into panel content
 * - Arrow keys move focus between tabs; Enter/Space activates the focused tab
 * - ARIA attributes handled automatically by Base UI
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
  return (
    <Tabs.Root value={activeTab} onValueChange={onTabChange as (value: string) => void}>
      <BaseTabsList
        activeTab={activeTab}
        onTabChange={onTabChange}
        tabs={[
          {
            value: 'network',
            testId: 'panel-tab-network',
            label: (
              <span className="flex items-center gap-1.5">
                <Network size={12} />
                <span>Network</span>
                {networkCount > 0 && (
                  <span className="px-1 py-0.5 text-xs bg-bg-raised rounded">{networkCount}</span>
                )}
              </span>
            ),
          },
          {
            value: 'console',
            testId: 'panel-tab-console',
            label: (
              <span className="flex items-center gap-1.5">
                <Terminal size={12} />
                <span>Console</span>
                {consoleCount > 0 && (
                  <span className="px-1 py-0.5 text-xs bg-bg-raised rounded">{consoleCount}</span>
                )}
              </span>
            ),
          },
        ]}
        listClassName="flex items-center gap-1 border-r border-border-default pr-2 mr-2"
        tabClassName="shrink-0 px-2 py-1 text-xs rounded flex items-center gap-1.5 relative"
        activeTabClassName="text-text-primary"
        inactiveTabClassName="text-text-muted hover:text-text-primary hover:bg-bg-raised/50"
        indicatorLayoutId="panel-tab-indicator"
        indicatorClassName="bg-bg-raised rounded"
        indicatorTestId="panel-tab-indicator"
        listTestId="tabs-list"
        activateOnFocus={false}
      />
    </Tabs.Root>
  );
};
