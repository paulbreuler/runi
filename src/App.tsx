/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './routes/index';
import { DevToolsPopout } from './routes/devtools-popout';
import { ToastProvider } from './components/ui/Toast';

export const App = (): React.JSX.Element => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/devtools-popout" element={<DevToolsPopout />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};
