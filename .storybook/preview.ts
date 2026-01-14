import type { Preview } from '@storybook/svelte';
import '../src/app.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Enable interaction testing
    actions: { argTypesRegex: '^on[A-Z].*' },
    // Run interactions automatically
    interactions: {
      locators: {
        sidebar: '[data-testid="sidebar"]',
        'status-bar': '[data-testid="status-bar"]',
      },
    },
  },
};

export default preview;
