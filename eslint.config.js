import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Allow `any` in Storybook story files (required by Storybook API)
    files: ['**/*.stories.ts', '**/*.stories.tsx', '**/*.stories.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Generated types from ts-rs - don't lint these
    files: ['src/types/generated/**/*.ts', 'src-tauri/bindings/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      'build/',
      'dist/',
      'node_modules/',
      'src-tauri/target/',
      'src-tauri/bindings/',
      'storybook-static/',
      'coverage/',
      'src/types/generated/',
      '.storybook/',
      '.svelte-kit/',
      '*.config.js',
      '*.config.ts',
      'vitest.setup.ts',
      'playwright*.ts',
    ],
  }
);
