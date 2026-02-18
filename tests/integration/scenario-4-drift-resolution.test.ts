/**
 * Scenario 4: Drift Resolution
 *
 * Tests the resolve_drift MCP tool via live HTTP.
 * Creates a test collection, resolves drift with various actions,
 * and validates error handling for invalid inputs.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { McpClient } from './helpers/mcp-client';

interface Collection {
  id: string;
  name: string;
  message: string;
}

interface DriftResult {
  success: boolean;
  actionType: string;
  message: string;
}

describe('Scenario 4: Drift Resolution', () => {
  let client: McpClient;
  let collectionId: string;

  beforeAll(async () => {
    client = new McpClient();
    await client.initialize();

    const result = await client.callTool<Collection>('create_collection', {
      name: 'drift-test-collection',
    });
    collectionId = result.parsed!.id;
  });

  afterAll(async () => {
    if (collectionId) {
      await client.callTool('delete_collection', { collection_id: collectionId });
    }
    await client.cleanup();
  });

  it('resolve_drift with action=ignore returns success', async () => {
    const result = await client.callTool<DriftResult>('resolve_drift', {
      collection_id: collectionId,
      method: 'GET',
      path: '/users',
      action: 'ignore',
    });

    expect(result.isError).toBeFalsy();
    expect(result.parsed!.success).toBe(true);
    expect(result.parsed!.actionType).toBe('ignore');
    expect(result.parsed!.message).toContain('ignore');
  });

  it('resolve_drift with action=update_spec returns success', async () => {
    const result = await client.callTool<DriftResult>('resolve_drift', {
      collection_id: collectionId,
      method: 'POST',
      path: '/users',
      action: 'update_spec',
    });

    expect(result.isError).toBeFalsy();
    expect(result.parsed!.success).toBe(true);
    expect(result.parsed!.actionType).toBe('update_spec');
  });

  it('resolve_drift with action=fix_request returns success', async () => {
    const result = await client.callTool<DriftResult>('resolve_drift', {
      collection_id: collectionId,
      method: 'PUT',
      path: '/users/{id}',
      action: 'fix_request',
    });

    expect(result.isError).toBeFalsy();
    expect(result.parsed!.success).toBe(true);
    expect(result.parsed!.actionType).toBe('fix_request');
  });

  it('resolve_drift with invalid collectionId returns error', async () => {
    const result = await client.callTool<DriftResult>('resolve_drift', {
      collection_id: 'nonexistent-collection-id',
      method: 'GET',
      path: '/users',
      action: 'ignore',
    });

    expect(result.isError).toBe(true);
  });
});
