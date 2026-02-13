/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { ContextTabs } from './ContextTabs';
import { useCanvasStore } from '@/stores/useCanvasStore';

/**
 * TabBar - Separate row for context tabs below the title bar
 *
 * This keeps the title bar fully draggable while providing interactive tabs.
 */
export const TabBar = (): React.JSX.Element | null => {
  const { contextOrder } = useCanvasStore();
  const hasContexts = contextOrder.length > 0;

  if (!hasContexts) {
    return null;
  }

  return (
    <div className="h-8 bg-bg-surface flex items-end shrink-0" data-test-id="tab-bar">
      <ContextTabs />
    </div>
  );
};
