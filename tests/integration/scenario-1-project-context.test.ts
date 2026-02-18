/**
 * Scenario 1: Project Context Lifecycle
 *
 * Tests get_project_context and set_project_context MCP tools via live HTTP.
 * Validates partial-update semantics: omitted fields unchanged, null clears.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { McpClient } from './helpers/mcp-client';

interface ProjectContext {
  activeCollectionId: string | null;
  activeRequestId: string | null;
  investigationNotes: string | null;
  recentRequestIds: string[];
  tags: string[];
}

describe('Scenario 1: Project Context Lifecycle', () => {
  let client: McpClient;

  beforeAll(async () => {
    client = new McpClient();
    await client.initialize();

    // Reset context to clean state (prior test runs may have left data)
    await client.callTool('set_project_context', {
      activeCollectionId: null,
      activeRequestId: null,
      investigationNotes: null,
      tags: [],
    });
  });

  afterAll(async () => {
    await client.cleanup();
  });

  it('get_project_context returns clean context after reset', async () => {
    const result = await client.callTool<ProjectContext>('get_project_context');

    expect(result.isError).toBeFalsy();
    expect(result.parsed!.activeCollectionId).toBeNull();
    expect(result.parsed!.activeRequestId).toBeNull();
    expect(result.parsed!.investigationNotes).toBeNull();
    expect(result.parsed!.tags).toEqual([]);
  });

  it('set_project_context with activeCollectionId and tags', async () => {
    const setResult = await client.callTool<ProjectContext>('set_project_context', {
      activeCollectionId: 'col-s1-test',
      tags: ['auth', 'beta'],
    });

    expect(setResult.isError).toBeFalsy();
    expect(setResult.parsed!.activeCollectionId).toBe('col-s1-test');
    expect(setResult.parsed!.tags).toEqual(['auth', 'beta']);
    expect(setResult.parsed!.activeRequestId).toBeNull();
    expect(setResult.parsed!.investigationNotes).toBeNull();
  });

  it('set_project_context preserves prior fields on partial update', async () => {
    await client.callTool('set_project_context', {
      investigationNotes: 'Investigating auth flow',
      pushRecentRequestId: 'req-s1-abc',
    });

    const result = await client.callTool<ProjectContext>('get_project_context');

    expect(result.parsed!.activeCollectionId).toBe('col-s1-test');
    expect(result.parsed!.tags).toEqual(['auth', 'beta']);
    expect(result.parsed!.investigationNotes).toBe('Investigating auth flow');
    expect(result.parsed!.recentRequestIds).toContain('req-s1-abc');
  });

  it('set_project_context with null clears field, rest preserved', async () => {
    await client.callTool('set_project_context', {
      activeCollectionId: null,
    });

    const result = await client.callTool<ProjectContext>('get_project_context');

    expect(result.parsed!.activeCollectionId).toBeNull();
    expect(result.parsed!.investigationNotes).toBe('Investigating auth flow');
    expect(result.parsed!.tags).toEqual(['auth', 'beta']);
    expect(result.parsed!.recentRequestIds).toContain('req-s1-abc');
  });
});
