/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MemoryWarningListener } from './components/Memory/MemoryWarningListener';
import { CollectionEventProvider } from './components/providers/CollectionEventProvider';
import { FeatureFlagProvider } from './providers/FeatureFlagProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { IntentProvider } from './providers/IntentProvider';
import { ToastProvider } from './components/ui/Toast';
import { TooltipProvider } from './components/ui/Tooltip';
import { CommandBar } from './components/CommandBar';
import { globalEventBus } from './events/bus';
import { initSuggestionStore } from './stores/useSuggestionStore';
import { initDriftReviewStore } from './stores/useDriftReviewStore';

// Lazy load routes for code splitting
const HomePage = lazy(() => import('./routes/index').then((m) => ({ default: m.HomePage })));
const DevToolsPopout = lazy(() =>
  import('./routes/devtools-popout').then((m) => ({ default: m.DevToolsPopout }))
);
const CanvasPopout = lazy(() =>
  import('./routes/canvas-popout').then((m) => ({ default: m.CanvasPopout }))
);

export const App = (): React.JSX.Element => {
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);

  useEffect(() => {
    const unsubCommandBar = globalEventBus.on('commandbar.toggle', (): void => {
      setIsCommandBarOpen((prev) => !prev);
    });

    return (): void => {
      unsubCommandBar();
    };
  }, []);

  // Initialize suggestion store — fetch from backend and listen for Tauri events
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    void initSuggestionStore().then((fn) => {
      cleanup = fn;
    });
    return (): void => {
      cleanup?.();
    };
  }, []);

  // Initialize drift review store — listen for Tauri events from MCP drift tools
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    void initDriftReviewStore().then((fn) => {
      cleanup = fn;
    });
    return (): void => {
      cleanup?.();
    };
  }, []);

  return (
    <ThemeProvider appearance="dark" accentColor="blue" grayColor="gray">
      <IntentProvider>
        <FeatureFlagProvider>
          <CollectionEventProvider>
            <ToastProvider>
              <TooltipProvider delayDuration={250}>
                <MemoryWarningListener />
                <CommandBar
                  isOpen={isCommandBarOpen}
                  onClose={(): void => {
                    setIsCommandBarOpen(false);
                  }}
                />
                <BrowserRouter>
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-screen bg-bg-app text-text-primary">
                        Loading...
                      </div>
                    }
                  >
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/devtools-popout" element={<DevToolsPopout />} />
                      <Route path="/canvas-popout/:contextId" element={<CanvasPopout />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </ToastProvider>
          </CollectionEventProvider>
        </FeatureFlagProvider>
      </IntentProvider>
    </ThemeProvider>
  );
};
