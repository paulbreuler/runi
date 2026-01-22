import type { Preview } from '@storybook/react';
import '../src/app.css';

// Storybook 10: Module automocking with sb.mock
// Example usage (commented out - uncomment to use):
// import { sb } from 'storybook/test';
// sb.mock(import('../src/utils/relative-time.ts'), { spy: true });
//
// Note: Mocking relative-time breaks TimeAgoCell's auto-update functionality
// because it interferes with the setInterval that updates every 30 seconds.
// Use sb.mock for utilities that don't need real-time behavior, or mock
// in individual stories where you control the timing.

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
