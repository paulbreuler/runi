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
import { ToastProvider } from './components/ui/Toast';
import { TooltipProvider } from './components/ui/Tooltip';
import { CommandBar } from './components/CommandBar';
import { globalEventBus } from './events/bus';

// Lazy load routes for code splitting
const HomePage = lazy(() => import('./routes/index').then((m) => ({ default: m.HomePage })));
const DevToolsPopout = lazy(() =>
  import('./routes/devtools-popout').then((m) => ({ default: m.DevToolsPopout }))
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

  return (
    <ThemeProvider appearance="dark" accentColor="blue" grayColor="gray">
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
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </ToastProvider>
        </CollectionEventProvider>
      </FeatureFlagProvider>
    </ThemeProvider>
  );
};
