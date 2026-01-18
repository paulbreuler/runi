import React from 'react';
import ReactDOM from 'react-dom/client';
import { initializeConsoleService } from '@/services/console-service';
import { App } from './App';
import './app.css';

// Initialize console service BEFORE React mounts
// This ensures all logs are captured, including those before React initialization
initializeConsoleService();

// Ensure dark mode is applied
document.documentElement.classList.add('dark');

// Measure startup time
const startupStart = performance.now();
const startupTiming = {
  domContentLoaded: 0,
  windowLoaded: 0,
  reactMounted: 0,
  total: 0,
};

// Track DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    startupTiming.domContentLoaded = performance.now() - startupStart;
  });
} else {
  startupTiming.domContentLoaded = performance.now() - startupStart;
}

// Track window load
if (document.readyState !== 'complete') {
  window.addEventListener('load', () => {
    startupTiming.windowLoaded = performance.now() - startupStart;
  });
} else {
  startupTiming.windowLoaded = performance.now() - startupStart;
}

const rootElement = document.getElementById('root');
if (rootElement !== null) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // Track React mount (after first render)
  requestAnimationFrame(() => {
    startupTiming.reactMounted = performance.now() - startupStart;
    startupTiming.total = performance.now() - startupStart;

    // Log startup timing (only in development or when '?measure-startup' is present in the URL)
    const isDev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV ?? false;
    if (isDev || window.location.search.includes('measure-startup')) {
      // eslint-disable-next-line no-console
      console.log('🚀 Startup Timing:', {
        DOMContentLoaded: `${startupTiming.domContentLoaded.toFixed(2)}ms`,
        'Window Load': `${startupTiming.windowLoaded.toFixed(2)}ms`,
        'React Mounted': `${startupTiming.reactMounted.toFixed(2)}ms`,
        Total: `${startupTiming.total.toFixed(2)}ms`,
      });
    }
  });
}
