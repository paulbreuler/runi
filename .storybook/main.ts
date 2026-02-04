// This file has been automatically migrated to valid ESM format by Storybook.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  stories: ['../src/components/**/*.stories.@(tsx|ts|jsx|js)'],

  addons: [
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-vitest',
      options: {
        // Let the addon auto-discover the workspace and project
        // It will use the configDir from the storybookTest plugin
      },
    },
    '@storybook/addon-docs',
    {
      name: '@storybook/addon-mcp',
      options: {
        toolsets: {
          dev: true, // Tools for story URL retrieval and UI building instructions
          docs: true, // Tools for component manifest and documentation
        },
      },
    },
    '@chromatic-com/storybook',
  ],

  // Enable experimental component manifest for docs toolset
  features: {
    experimentalComponentsManifest: true, // Enable manifest generation for the docs toolset
  },

  staticDirs: ['../static'],

  // Storybook 10: Tag filtering configuration
  // Allows excluding stories from sidebar based on tags
  tags: {
    // Hide experimental stories from sidebar by default
    experimental: {
      defaultFilterSelection: 'exclude',
    },
    // Hide test stories from sidebar by default (for stories used only for testing)
    test: {
      defaultFilterSelection: 'exclude',
    },
  },

  async viteFinal(config) {
    return mergeConfig(config, {
      define: {
        __APP_VERSION__: JSON.stringify(packageJson.version),
      },
      plugins: [tailwindcss()],
      optimizeDeps: {
        include: ['@base-ui/react/toggle'],
      },
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
};

export default config;
