import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './routes/index';
import { DevToolsPopout } from './routes/devtools-popout';

export const App = (): React.JSX.Element => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/devtools-popout" element={<DevToolsPopout />} />
      </Routes>
    </BrowserRouter>
  );
};
