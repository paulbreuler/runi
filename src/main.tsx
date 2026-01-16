import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './app.css';

// Initialize Tauri (if in Tauri context)
if (typeof window !== 'undefined' && (window as { __TAURI__?: unknown }).__TAURI__ !== undefined) {
  console.log('Running in Tauri context');
}

// Ensure dark mode is applied
document.documentElement.classList.add('dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
