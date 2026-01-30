/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TabNavigation component
 * @description Tab navigation for expanded panel
 */

import { Tabs } from '@base-ui/react/tabs';
import { motion, LayoutGroup, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
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
}

export const TabNavigation = ({ activeTab }: TabNavigationProps): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion() === true;

  const tabs: Array<{ id: ExpandedPanelTabType; label: string }> = [
    { id: 'timing', label: 'Timing' },
    { id: 'response', label: 'Response' },
    { id: 'headers', label: 'Headers' },
    { id: 'tls', label: 'TLS' },
    { id: 'codegen', label: 'Code Gen' },
  ];

  return (
    <LayoutGroup>
      <Tabs.List
        activateOnFocus
        className="flex items-center gap-1 border-b border-border-default px-4 pt-2 relative"
        data-testid="expanded-tabs-list"
      >
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.id}
            value={tab.id}
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
                role="tab"
                data-testid={`tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-t flex items-center gap-1.5 relative',
                  focusRingClasses,
                  activeTab === tab.id
                    ? 'text-text-primary'
                    : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50'
                )}
                whileHover={activeTab !== tab.id ? { scale: 1.02 } : undefined}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="expanded-tab-indicator"
                    className="absolute inset-0 bg-bg-raised rounded-t pointer-events-none z-0"
                    data-testid="expanded-tab-indicator"
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 300, damping: 30 }
                    }
                    initial={false}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </motion.button>
            )}
          />
        ))}
      </Tabs.List>
    </LayoutGroup>
  );
};
