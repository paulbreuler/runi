/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './routes/index';
import { DevToolsPopout } from './routes/devtools-popout';
import { Toaster } from './components/ui/Toaster';
import { MemoryWarningListener } from './components/Memory/MemoryWarningListener';
import { ThemeProvider } from './components/ThemeProvider';

export const App = (): React.JSX.Element => {
  return (
    <ThemeProvider appearance="dark" accentColor="blue" grayColor="gray">
      <MemoryWarningListener />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/devtools-popout" element={<DevToolsPopout />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
};
