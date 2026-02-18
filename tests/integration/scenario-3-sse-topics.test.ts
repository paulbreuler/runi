/**
 * Scenario 3: SSE Topic Subscription
 *
 * Tests the GET /mcp/sse/subscribe endpoint for topic-based SSE.
 * Active tests: connection handshake and keepalive.
 * Skipped tests (it.todo): event delivery — broadcast_to_topic() is not
 * wired from production code yet; events go via Tauri handle.emit() only.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { McpClient } from './helpers/mcp-client';

describe('Scenario 3: SSE Topic Subscription', () => {
  let client: McpClient;

  beforeAll(async () => {
    client = new McpClient();
    await client.initialize();
  });

  afterAll(async () => {
    await client.cleanup();
  });

  it('subscribe with topics=suggestion:* receives connected event', async () => {
    const sub = client.subscribeSse('suggestion:*');
    try {
      const connected = await sub.waitForEvent('connected', 5000);
      expect(connected.event).toBe('connected');

      const data = JSON.parse(connected.data);
      expect(data.topics).toBeTruthy();
      expect(Array.isArray(data.topics)).toBe(true);
      expect(data.topics).toContain('suggestion:*');
    } finally {
      sub.close();
    }
  });

  it('subscribe with topics=* receives connected event', async () => {
    const sub = client.subscribeSse('*');
    try {
      const connected = await sub.waitForEvent('connected', 5000);
      expect(connected.event).toBe('connected');

      const data = JSON.parse(connected.data);
      expect(data.topics).toContain('*');
    } finally {
      sub.close();
    }
  });

  it('subscribe receives keepalive within 35s', async () => {
    const sub = client.subscribeSse('suggestion:*');
    try {
      await sub.waitForEvent('connected', 5000);
      const keepalive = await sub.waitForEvent('keepalive', 35000);
      expect(keepalive.event).toBe('keepalive');
    } finally {
      sub.close();
    }
  }, 40000);

  // --- Skipped: broadcast_to_topic() not wired from production code ---

  it.todo('suggestion:created event on create_suggestion');
  it.todo('suggestion:resolved event on resolve_suggestion');
  it.todo('topic filter isolation — context:* does not receive suggestion events');
});
