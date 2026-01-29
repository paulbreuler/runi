/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MemoryWarningListener } from './components/Memory/MemoryWarningListener';
import { ThemeProvider } from './components/ThemeProvider';
import { ToastProvider } from './components/ui/Toast';

// Lazy load routes for code splitting
const HomePage = lazy(() => import('./routes/index').then((m) => ({ default: m.HomePage })));
const DevToolsPopout = lazy(() =>
  import('./routes/devtools-popout').then((m) => ({ default: m.DevToolsPopout }))
);

export const App = (): React.JSX.Element => {
  return (
    <ThemeProvider appearance="dark" accentColor="blue" grayColor="gray">
      <ToastProvider>
        <MemoryWarningListener />
        <BrowserRouter>
          <Suspense fallback={<div />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/devtools-popout" element={<DevToolsPopout />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
};
