import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for MCP integration tests.
 *
 * Runs pure HTTP/fetch tests against the live MCP server (port 3002).
 * Requires the app to be running: `just dev`
 *
 * No React plugin, no jsdom — these are node-environment HTTP tests.
 * Serial execution because tests share global server state
 * (project context is a singleton).
 */
export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    testTimeout: 40000, // SSE keepalive test needs ~35s
    hookTimeout: 10000,
    fileParallelism: false, // Run test files sequentially — shared server state
    reporters: ['verbose'],
  },
});
