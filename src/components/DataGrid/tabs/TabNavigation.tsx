/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TabNavigation component
 * @description Tab navigation for expanded panel
 */

import { BaseTabsList } from '@/components/ui/BaseTabsList';
import type { ExpandedPanelTabType } from './ExpandedPanel';

/**
 * TabNavigation - Tab switcher for expanded panel content.
 *
 * Uses Base UI Tabs primitives with Motion animations for smooth tab indicator transitions.
 * Allows switching between Timing, Response, Headers, TLS, and Code Gen views.
 *
 * Note: This component must be used inside a Tabs.Root from Base UI.
 *
 * @example
 * ```tsx
 * <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
 *   <TabNavigation activeTab={activeTab} />
 *   <Tabs.Panel value="timing">...</Tabs.Panel>
 * </Tabs.Root>
 * ```
 */

export interface TabNavigationProps {
  /** Active tab */
  activeTab: ExpandedPanelTabType;
  /** Tab change handler */
  onTabChange: (tab: ExpandedPanelTabType) => void;
}

export const TabNavigation = ({
  activeTab,
  onTabChange,
}: TabNavigationProps): React.JSX.Element => {
  const tabs: Array<{ id: ExpandedPanelTabType; label: string }> = [
    { id: 'timing', label: 'Timing' },
    { id: 'response', label: 'Response' },
    { id: 'headers', label: 'Headers' },
    { id: 'tls', label: 'TLS' },
    { id: 'codegen', label: 'Code Gen' },
  ];

  return (
    <BaseTabsList
      activeTab={activeTab}
      onTabChange={onTabChange}
      tabs={tabs.map((tab) => ({
        value: tab.id,
        label: tab.label,
        testId: `tab-${tab.id}`,
      }))}
      listClassName="flex items-center gap-1 border-b border-border-default px-4 pt-2"
      tabClassName="px-3 py-1.5 text-xs rounded-t flex items-center gap-1.5 relative"
      activeTabClassName="text-text-primary"
      inactiveTabClassName="text-text-muted hover:text-text-primary hover:bg-bg-raised/50"
      indicatorLayoutId="expanded-tab-indicator"
      indicatorClassName="bg-bg-raised rounded-t"
      indicatorTestId="expanded-tab-indicator"
      listTestId="expanded-tabs-list"
      activateOnFocus={true}
    />
  );
};
