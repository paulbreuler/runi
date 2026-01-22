import { defineWorkspace } from 'vitest/config';

/**
 * Vitest workspace configuration.
 *
 * This enables running both unit tests and Storybook tests from the same workspace.
 * - Unit tests: run with `npm test` (uses vitest.config.ts, project name: 'unit')
 * - Storybook tests: run from Storybook's Vitest panel or with `npm run test-storybook`
 *
 * The workspace allows the Storybook addon-vitest panel to discover and run tests.
 */
export default defineWorkspace([
  // Unit tests (jsdom environment) - project name: 'unit'
  'vitest.config.ts',
  // Storybook browser tests - project name: 'storybook'
  'vitest.config.storybook.ts',
]);
