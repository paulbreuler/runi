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

export const HomePage = (): React.JSX.Element => {
  const { registerContext, setActiveContext } = useCanvasStore();
  const { enabled: collectionsEnabled } = useFeatureFlag('http', 'collectionsEnabled');

  const initialSidebarVisible =
    (typeof window !== 'undefined' &&
      (window.location.search.includes('e2eSidebar=1') ||
        (window as { __RUNI_E2E__?: { sidebarVisible?: boolean } }).__RUNI_E2E__?.sidebarVisible ===
          true)) ||
    collectionsEnabled;

  // Wire up context sync (bidirectional sync between canvas contexts and request store)
  useContextSync();

  useEffect(() => {
    // Register Request context on mount
    registerContext(requestContextDescriptor);
    setActiveContext('request');

    // No cleanup - contexts persist across navigation
  }, [registerContext, setActiveContext]);

  return <MainLayout initialSidebarVisible={initialSidebarVisible} />;
};
