/**
 * Scenario 2: Suggestion CRUD
 *
 * Tests list_suggestions, create_suggestion, and resolve_suggestion MCP tools.
 * Validates UUID generation, status transitions, and filtered listing.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { McpClient } from './helpers/mcp-client';

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

describe('Scenario 2: Suggestion CRUD', () => {
  let client: McpClient;
  let createdSuggestionId: string;

  beforeAll(async () => {
    client = new McpClient();
    await client.initialize();
  });

  afterAll(async () => {
    await client.cleanup();
  });

  it('list_suggestions returns an array', async () => {
    const result = await client.callTool<Suggestion[]>('list_suggestions');

    expect(result.isError).toBeFalsy();
    expect(Array.isArray(result.parsed)).toBe(true);
  });

  it('create_suggestion returns suggestion with UUID and pending status', async () => {
    const result = await client.callTool<Suggestion>('create_suggestion', {
      suggestionType: 'drift_fix',
      title: 'Fix GET /users drift',
      description: 'Response schema has new field "role" not in spec',
      source: 'integration-test',
      action: 'Update OpenAPI spec to include role field',
      endpoint: 'GET /users',
    });

    expect(result.isError).toBeFalsy();

    const suggestion = result.parsed;
    expect(suggestion.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(suggestion.status).toBe('pending');
    expect(suggestion.title).toBe('Fix GET /users drift');
    expect(suggestion.suggestionType).toBe('drift_fix');
    expect(suggestion.source).toBe('integration-test');
    expect(suggestion.endpoint).toBe('GET /users');
    expect(new Date(suggestion.createdAt).getTime()).not.toBeNaN();
    expect(suggestion.resolvedAt).toBeNull();

    createdSuggestionId = suggestion.id;
  });

  it('list_suggestions returns the created suggestion', async () => {
    const result = await client.callTool<Suggestion[]>('list_suggestions');

    expect(result.isError).toBeFalsy();
    const found = result.parsed.find((s) => s.id === createdSuggestionId);
    expect(found).toBeTruthy();
    expect(found!.title).toBe('Fix GET /users drift');
  });

  it('list_suggestions filtered by status=pending returns match', async () => {
    const pending = await client.callTool<Suggestion[]>('list_suggestions', {
      status: 'pending',
    });
    expect(pending.parsed.some((s) => s.id === createdSuggestionId)).toBe(true);

    const accepted = await client.callTool<Suggestion[]>('list_suggestions', {
      status: 'accepted',
    });
    expect(accepted.parsed.some((s) => s.id === createdSuggestionId)).toBe(false);
  });

  it('resolve_suggestion sets status=accepted and resolvedAt', async () => {
    const result = await client.callTool<Suggestion>('resolve_suggestion', {
      id: createdSuggestionId,
      status: 'accepted',
    });

    expect(result.isError).toBeFalsy();
    expect(result.parsed.status).toBe('accepted');
    expect(result.parsed.resolvedAt).toBeTruthy();
    expect(new Date(result.parsed.resolvedAt!).getTime()).not.toBeNaN();
  });

  it('list_suggestions after resolve shows updated status', async () => {
    const accepted = await client.callTool<Suggestion[]>('list_suggestions', {
      status: 'accepted',
    });
    expect(accepted.parsed.some((s) => s.id === createdSuggestionId)).toBe(true);

    const pending = await client.callTool<Suggestion[]>('list_suggestions', {
      status: 'pending',
    });
    expect(pending.parsed.some((s) => s.id === createdSuggestionId)).toBe(false);
  });
});
