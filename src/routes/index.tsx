/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { requestContextDescriptor } from '@/contexts/RequestContext';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useContextSync } from '@/hooks/useContextSync';
import { useCanvasStateSync } from '@/hooks/useCanvasStateSync';

export const HomePage = (): React.JSX.Element => {
  const { registerTemplate } = useCanvasStore();
  const { enabled: collectionsEnabled } = useFeatureFlag('http', 'collectionsEnabled');

  const initialSidebarVisible =
    (typeof window !== 'undefined' &&
      (window.location.search.includes('e2eSidebar=1') ||
        (window as { __RUNI_E2E__?: { sidebarVisible?: boolean } }).__RUNI_E2E__?.sidebarVisible ===
          true)) ||
    collectionsEnabled;

  // CRITICAL: Register template BEFORE useContextSync to prevent empty layouts
  // React effects run in declaration order: template must exist before sync hook runs
  useEffect(() => {
    // Register Request template on mount (not a visible context)
    registerTemplate(requestContextDescriptor);

    // No cleanup - templates persist across navigation
  }, [registerTemplate]);

  // Wire up context sync (bidirectional sync between canvas contexts and request store)
  // This MUST come after the registration effect above to ensure template exists
  useContextSync();

  // Sync canvas state to backend for MCP tool access
  useCanvasStateSync();

  return <MainLayout initialSidebarVisible={initialSidebarVisible} />;
};
