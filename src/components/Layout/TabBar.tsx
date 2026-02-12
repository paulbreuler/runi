/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { MotionValue } from 'motion/react';
import { ContextTabs } from './ContextTabs';
import { useCanvasStore } from '@/stores/useCanvasStore';

interface TabBarProps {
  /** Sidebar width (MotionValue) for aligning tabs with canvas area */
  sidebarWidth?: MotionValue<number>;
}

/**
 * TabBar - Separate row for context tabs below the title bar
 *
 * This keeps the title bar fully draggable while providing interactive tabs.
 */
export const TabBar = ({ sidebarWidth }: TabBarProps): React.JSX.Element | null => {
  const { contextOrder } = useCanvasStore();
  const hasContexts = contextOrder.length > 0;

  if (!hasContexts) {
    return null;
  }

  return (
    <div className="h-8 bg-bg-surface flex items-end shrink-0" data-test-id="tab-bar">
      <ContextTabs sidebarWidth={sidebarWidth} />
    </div>
  );
};
