import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * ESLint configuration for runi - Pedantic React/TypeScript linting
 *
 * Philosophy: "Pedantic like Clippy" - strict rules catch bugs early.
 * All warnings are errors. No exceptions without explicit justification.
 */
export default tseslint.config(
  // Base recommended rules
  eslint.configs.recommended,

  // TypeScript strict + stylistic rules (pedantic mode)
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Prettier must be last to disable conflicting rules
  prettier,

  // Main configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // ========================================================================
      // TypeScript Pedantic Rules (Clippy-level strictness)
      // ========================================================================

      // Require explicit return types - no implicit any returns
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: false,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: false,
        },
      ],

      // Require explicit accessibility modifiers on class members
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        { accessibility: 'explicit', overrides: { constructors: 'no-public' } },
      ],

      // No any - ever
      '@typescript-eslint/no-explicit-any': 'error',

      // Strict boolean expressions - no truthy/falsy implicit coercion
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
          allowNullableBoolean: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],

      // Unused variables (allow underscore prefix for intentionally unused)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Require consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Require consistent type exports
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],

      // No floating promises - must await or void
      '@typescript-eslint/no-floating-promises': 'error',

      // No misused promises (e.g., in conditionals)
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],

      // Require await in async functions
      '@typescript-eslint/require-await': 'error',

      // Prefer nullish coalescing over ||
      '@typescript-eslint/prefer-nullish-coalescing': 'error',

      // Prefer optional chaining over &&
      '@typescript-eslint/prefer-optional-chain': 'error',

      // No non-null assertions (use proper null checks)
      '@typescript-eslint/no-non-null-assertion': 'error',

      // No unnecessary type assertions
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',

      // No unnecessary conditions (catches dead code)
      '@typescript-eslint/no-unnecessary-condition': 'error',

      // Enforce naming conventions (practical pedantry)
      '@typescript-eslint/naming-convention': [
        'error',
        // Interfaces must be PascalCase (no I prefix)
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
        // Type aliases must be PascalCase
        { selector: 'typeAlias', format: ['PascalCase'] },
        // Enums must be PascalCase
        { selector: 'enum', format: ['PascalCase'] },
        // Enum members must be PascalCase or UPPER_CASE
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        // Note: Boolean naming convention removed - too restrictive for React patterns
        // Variables like `prefersReducedMotion`, `showPassword` are idiomatic
      ],

      // Method signature style (prefer property for consistency)
      '@typescript-eslint/method-signature-style': ['error', 'property'],

      // Array type style (prefer T[] over Array<T>)
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],

      // ========================================================================
      // React Rules (Pedantic)
      // ========================================================================

      // React Hooks rules (critical for correctness)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // JSX-specific rules
      'react/jsx-key': ['error', { checkFragmentShorthand: true }],
      'react/jsx-no-duplicate-props': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off', // Not needed with React 17+ JSX transform
      'react/jsx-uses-vars': 'error',
      'react/no-children-prop': 'error',
      'react/no-danger-with-children': 'error',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
      'react/require-render-return': 'error',
      'react/self-closing-comp': 'error',
      'react/void-dom-elements-no-children': 'error',

      // ========================================================================
      // General JavaScript Rules (Pedantic)
      // ========================================================================

      // No console.log in production code
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Prefer const over let
      'prefer-const': 'error',

      // No var - use const/let
      'no-var': 'error',

      // Require === and !== (no == or !=)
      eqeqeq: ['error', 'always'],

      // Nested ternaries - warn only (sometimes needed in JSX for conditional rendering)
      'no-nested-ternary': 'warn',

      // Curly braces required for all blocks
      curly: ['error', 'all'],
    },
  },

  // Storybook files - relax some rules for story definitions
  {
    files: ['**/*.stories.ts', '**/*.stories.tsx'],
    rules: {
      // Storybook uses any in Meta/StoryObj types
      '@typescript-eslint/no-explicit-any': 'off',
      // Story render functions often don't need explicit returns
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Storybook arg types can trigger this
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      // Allow console in stories for debugging
      'no-console': 'off',
      // Storybook render functions use hooks - this is valid
      'react-hooks/rules-of-hooks': 'off',
      // Void type in story args is valid
      '@typescript-eslint/no-invalid-void-type': 'off',
      // Naming convention relaxed in stories
      '@typescript-eslint/naming-convention': 'off',
    },
  },

  // Test files - relax some rules for test ergonomics
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      // Tests often use non-null assertions for brevity
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Test mocks often require any
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // Allow console in tests
      'no-console': 'off',
      // Naming convention relaxed in tests
      '@typescript-eslint/naming-convention': 'off',
      // Mock functions are often empty
      '@typescript-eslint/no-empty-function': 'off',
      // Strict boolean expressions relaxed for test assertions
      '@typescript-eslint/strict-boolean-expressions': 'off',
      // Async functions without await are common in test setup
      '@typescript-eslint/require-await': 'off',
    },
  },

  // Generated types from ts-rs - don't lint these
  {
    files: ['src/types/generated/**/*.ts', 'src-tauri/bindings/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/naming-convention': 'off',
    },
  },

  // Global ignores
  {
    ignores: [
      'build/',
      'dist/',
      'node_modules/',
      'src-tauri/target/',
      'src-tauri/bindings/',
      'storybook-static/',
      'coverage/',
      'html/', // Vitest HTML test reports
      'playwright-report/', // Playwright test reports
      'test-results/', // Playwright test results
      'src/types/generated/',
      '.storybook/',
      'tests/',
      '*.config.js',
      '*.config.ts',
      'vitest.setup.ts',
      'playwright*.ts',
    ],
  }
);
