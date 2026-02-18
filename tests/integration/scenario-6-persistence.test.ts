/**
 * Scenario 6: Persistence Across Sessions
 *
 * Tests that SQLite-backed data survives MCP session teardown.
 * Session A creates a suggestion, then is deleted. Session B verifies
 * the suggestion persists.
 */

import { describe, it, expect } from 'vitest';
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

describe('Scenario 6: Persistence Across Sessions', () => {
  let sessionASuggestionId: string;

  it('Session A: create suggestion then tear down session', async () => {
    const clientA = new McpClient();
    await clientA.initialize();

    try {
      const result = await clientA.callTool<Suggestion>('create_suggestion', {
        suggestionType: 'schema_update',
        title: 'Persistence test suggestion',
        description: 'Created in session A, should survive to session B',
        source: 'persistence-test-s6',
        action: 'Verify persistence',
      });

      expect(result.isError).toBeFalsy();
      sessionASuggestionId = result.parsed!.id;
      expect(sessionASuggestionId).toBeTruthy();
    } finally {
      await clientA.deleteSession();
    }
  });

  it('Session B: verify suggestion persists from Session A', async () => {
    const clientB = new McpClient();
    await clientB.initialize();

    try {
      const suggestions = await clientB.callTool<Suggestion[]>('list_suggestions');
      const found = suggestions.parsed!.find((s) => s.id === sessionASuggestionId);

      expect(found).toBeTruthy();
      expect(found!.title).toBe('Persistence test suggestion');
      expect(found!.source).toBe('persistence-test-s6');
      expect(found!.status).toBe('pending');
    } finally {
      await clientB.cleanup();
    }
  });
});
