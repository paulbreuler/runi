/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './routes/index';
import { DevToolsPopout } from './routes/devtools-popout';
import { ToastProvider } from './components/ui/Toast';
import { MemoryWarningListener } from './components/Memory/MemoryWarningListener';

export const App = (): React.JSX.Element => {
  return (
    <ToastProvider>
      <MemoryWarningListener />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/devtools-popout" element={<DevToolsPopout />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};
