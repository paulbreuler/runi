/**
 * Scenario 5: Cross-System Integration
 *
 * Tests that project context and suggestions work together coherently.
 * Validates that setting activeCollectionId in context and creating
 * suggestions with matching collectionId produces consistent results.
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

interface Suggestion {
  id: string;
  suggestionType: string;
  title: string;
  description: string;
  status: string;
  source: string;
  collectionId: string | null;
  requestId: string | null;
  endpoint: string | null;
  action: string;
  createdAt: string;
  resolvedAt: string | null;
}

const CROSS_COLLECTION_ID = 'cross-system-col-1';

describe('Scenario 5: Cross-System Integration', () => {
  let client: McpClient;

  beforeAll(async () => {
    client = new McpClient();
    await client.initialize();
  });

  afterAll(async () => {
    await client.cleanup();
  });

  it('set project context with activeCollectionId', async () => {
    const result = await client.callTool<ProjectContext>('set_project_context', {
      activeCollectionId: CROSS_COLLECTION_ID,
    });

    expect(result.isError).toBeFalsy();
    expect(result.parsed.activeCollectionId).toBe(CROSS_COLLECTION_ID);
  });

  it('create suggestion linked to the same collectionId', async () => {
    const result = await client.callTool<Suggestion>('create_suggestion', {
      suggestionType: 'optimization',
      title: 'Optimize cross-system endpoint',
      description: 'Response time exceeds threshold',
      source: 'cross-test',
      action: 'Add caching header',
      collectionId: CROSS_COLLECTION_ID,
    });

    expect(result.isError).toBeFalsy();
    expect(result.parsed.collectionId).toBe(CROSS_COLLECTION_ID);
    expect(result.parsed.status).toBe('pending');
  });

  it('context unchanged, suggestion linked to collection', async () => {
    const context = await client.callTool<ProjectContext>('get_project_context');
    expect(context.parsed.activeCollectionId).toBe(CROSS_COLLECTION_ID);

    const suggestions = await client.callTool<Suggestion[]>('list_suggestions');
    const linked = suggestions.parsed.find((s) => s.collectionId === CROSS_COLLECTION_ID);
    expect(linked).toBeTruthy();
    expect(linked!.title).toBe('Optimize cross-system endpoint');
  });
});
