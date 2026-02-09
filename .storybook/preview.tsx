import type { Preview } from '@storybook/react';
import { configure } from '@testing-library/dom';
import '../src/app.css';
// Align Storybook play functions with data-test-id convention.
configure({ testIdAttribute: 'data-test-id' });

declare global {
  interface Window {
    __runiTestIdMirror?: boolean;
  }
}

const mirrorTestIds = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const syncElement = (element: Element): void => {
    if (!(element instanceof HTMLElement)) {
      return;
    }
    const testId = element.getAttribute('data-test-id');
    if (testId !== null && element.getAttribute('data-testid') !== testId) {
      element.setAttribute('data-testid', testId);
    }
  };

  document.querySelectorAll('[data-test-id]').forEach(syncElement);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        syncElement(mutation.target);
        continue;
      }
      for (const node of Array.from(mutation.addedNodes)) {
        if (!(node instanceof HTMLElement)) {
          continue;
        }
        if (node.hasAttribute('data-test-id')) {
          syncElement(node);
        }
        node.querySelectorAll?.('[data-test-id]').forEach(syncElement);
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-test-id'],
  });
};

if (typeof window !== 'undefined' && window.__runiTestIdMirror !== true) {
  window.__runiTestIdMirror = true;
  window.requestAnimationFrame(mirrorTestIds);
}

// Storybook 10: Module automocking with sb.mock
import { sb } from 'storybook/test';
sb.mock(import('../src/utils/platform.ts'), { spy: true });

// Mock Tauri invoke globally
if (typeof window !== 'undefined') {
  (window as any).__TAURI_INTERNALS__ = {
    invoke: async (cmd: string, args?: any) => {
      console.log(`[Storybook Mock] invoke: ${cmd}`, args);
      if (cmd === 'cmd_list_collections') {
        // Return whatever is in the store at the time of calling
        const { useCollectionStore } = await import('../src/stores/useCollectionStore');
        return useCollectionStore.getState().summaries;
      }
      return [];
    },
  };
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        dark: {
          name: 'dark',
          value: '#0a0a0a',
        },

        surface: {
          name: 'surface',
          value: '#141414',
        },

        raised: {
          name: 'raised',
          value: '#1e1e1e',
        },
      },
    },
    // Testing widget configuration
    test: {
      // Enable accessibility testing (runs automatically with @storybook/addon-a11y)
      a11y: {
        config: {},
        options: {
          checks: { 'color-contrast': { options: { noScroll: true } } },
          restoreScroll: true,
        },
      },
      // Coverage reporting (when running with coverage flag)
      coverage: {
        enabled: true,
      },
    },
  },

  decorators: [
    (Story) => (
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#0a0a0a',
        }}
      >
        <Story />
      </div>
    ),
  ],

  initialGlobals: {
    backgrounds: {
      value: 'dark',
    },
  },
};

export default preview;
