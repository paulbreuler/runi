import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './app.css';

// Ensure dark mode is applied
document.documentElement.classList.add('dark');

const rootElement = document.getElementById('root');
if (rootElement !== null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
