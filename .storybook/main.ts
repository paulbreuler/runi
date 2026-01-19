import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  stories: ['../src/components/**/*.stories.@(tsx|ts|jsx|js)', '../src/components/**/*.mdx'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],
  staticDirs: ['../static'],
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@tauri-apps/plugin-dialog': path.resolve(__dirname, './mocks/tauri-plugin-dialog.ts'),
          '@tauri-apps/plugin-fs': path.resolve(__dirname, './mocks/tauri-plugin-fs.ts'),
          '@tauri-apps/api/window': path.resolve(__dirname, './mocks/tauri-api-window.ts'),
        },
      },
    });
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
