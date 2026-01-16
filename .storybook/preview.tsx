import type { Preview } from '@storybook/react';
import '../src/app.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0a0a0a',
        },
        {
          name: 'surface',
          value: '#141414',
        },
        {
          name: 'raised',
          value: '#1e1e1e',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ 
        padding: '1.5rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100%',
        backgroundColor: '#0a0a0a' 
      }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
