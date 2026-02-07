/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useRef } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { motion, LayoutGroup, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import { containedFocusRingClasses } from '@/utils/accessibility';
import { focusWithVisibility } from '@/utils/focusVisibility';

export interface BaseTabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  testId?: string;
}

export interface BaseTabsListProps<T extends string> {
  activeTab: T;
  onTabChange: (value: T) => void;
  tabs: Array<BaseTabItem<T>>;
  listClassName?: string;
  listAriaLabel?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  inactiveTabClassName?: string;
  indicatorLayoutId: string;
  indicatorClassName?: string;
  indicatorTestId?: string;
  listTestId?: string;
  activateOnFocus?: boolean;
}

export const BaseTabsList = <T extends string>({
  activeTab,
  onTabChange,
  tabs,
  listClassName,
  listAriaLabel,
  tabClassName,
  activeTabClassName,
  inactiveTabClassName,
  indicatorLayoutId,
  indicatorClassName,
  indicatorTestId,
  listTestId,
  activateOnFocus = false,
}: BaseTabsListProps<T>): React.ReactElement => {
  const prefersReducedMotion = useReducedMotion() === true;
  const listContainerRef = useRef<HTMLDivElement>(null);

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent): void => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        return;
      }
      const container = listContainerRef.current;
      if (container === null) {
        return;
      }
      const tabEls = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"]'));
      if (tabEls.length === 0) {
        return;
      }
      const activeEl = document.activeElement as HTMLElement | null;
      const currentIndex =
        activeEl !== null
          ? tabEls.indexOf(activeEl)
          : tabs.findIndex((tab) => tab.value === activeTab);
      const idx =
        currentIndex < 0 ? tabs.findIndex((tab) => tab.value === activeTab) : currentIndex;
      const nextIndex =
        e.key === 'ArrowRight'
          ? (idx + 1) % tabEls.length
          : (idx - 1 + tabEls.length) % tabEls.length;
      const nextTab = tabEls[nextIndex];
      const nextValue = tabs[nextIndex]?.value;
      if (nextTab !== undefined && nextValue !== undefined) {
        e.preventDefault();
        e.stopPropagation();
        focusWithVisibility(nextTab);
        onTabChange(nextValue);
      }
    },
    [activeTab, onTabChange, tabs]
  );

  return (
    <LayoutGroup>
      <div
        ref={listContainerRef}
        onKeyDownCapture={handleListKeyDown}
        className="contents"
        role="presentation"
      >
        <Tabs.List
          activateOnFocus={activateOnFocus}
          className={cn('relative', listClassName)}
          data-test-id={listTestId}
          aria-label={listAriaLabel}
        >
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              render={({
                onDrag: _onDrag,
                onDragStart: _onDragStart,
                onDragEnd: _onDragEnd,
                onAnimationStart: _onAnimStart,
                onAnimationEnd: _onAnimEnd,
                ...props
              }) => {
                const resolvedTestId = tab.testId;
                const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
                  const onClick = props.onClick as
                    | ((evt: React.MouseEvent<HTMLButtonElement>) => void)
                    | undefined;
                  onClick?.(event);
                  if (!event.defaultPrevented && tab.value !== activeTab) {
                    onTabChange(tab.value);
                  }
                };
                return (
                  <motion.button
                    {...props}
                    type="button"
                    tabIndex={activeTab === tab.value ? 0 : -1}
                    data-test-id={resolvedTestId}
                    onClick={handleClick}
                    className={cn(
                      tabClassName,
                      containedFocusRingClasses,
                      activeTab === tab.value ? activeTabClassName : inactiveTabClassName
                    )}
                    whileHover={activeTab !== tab.value ? { scale: 1.02 } : undefined}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === tab.value && (
                      <motion.div
                        layoutId={indicatorLayoutId}
                        className={cn(
                          'absolute inset-0 pointer-events-none z-0',
                          indicatorClassName
                        )}
                        data-test-id={indicatorTestId}
                        data-layout-id={indicatorLayoutId}
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
                );
              }}
            />
          ))}
        </Tabs.List>
      </div>
    </LayoutGroup>
  );
};
