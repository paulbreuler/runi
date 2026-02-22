/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file check-state — Dev helper for inspecting runi backend state via MCP.
 *
 * Usage:
 *   npx tsx scripts/helpers/check-state.ts              # summary
 *   npx tsx scripts/helpers/check-state.ts suggestions  # list suggestions
 *   npx tsx scripts/helpers/check-state.ts context      # get project context
 */

const MCP_URL = 'http://127.0.0.1:3002';

// ---- MCP helpers ----

async function mcpInit(): Promise<string> {
  const res = await fetch(`${MCP_URL}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'check-state', version: '0.1' },
      },
    }),
  });
  const sessionId = res.headers.get('mcp-session-id');
  if (sessionId === null) throw new Error('No session ID in response');
  return sessionId;
}

async function mcpCall<T>(
  sessionId: string,
  tool: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${MCP_URL}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Mcp-Session-Id': sessionId,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: tool, arguments: args },
    }),
  });
  const json = (await res.json()) as {
    result?: { content?: Array<{ text?: string }> };
    error?: { message: string };
  };
  if (json.error !== undefined) throw new Error(json.error.message);
  const text = json.result?.content?.[0]?.text;
  if (text === undefined) throw new Error('No text in response');
  return JSON.parse(text) as T;
}

async function mcpDelete(sessionId: string): Promise<void> {
  await fetch(`${MCP_URL}/mcp`, {
    method: 'DELETE',
    headers: { 'Mcp-Session-Id': sessionId },
  });
}

// ---- Commands ----

interface Suggestion {
  id: string;
  title: string;
  status: string;
  suggestionType: string;
  source: string;
  createdAt: string;
}

interface ProjectContext {
  activeCollectionId: string | null;
  activeRequestId: string | null;
  investigationNotes: string | null;
  recentRequestIds: string[];
  tags: string[];
}

async function cmdSuggestions(sessionId: string): Promise<void> {
  const suggestions = await mcpCall<Suggestion[]>(sessionId, 'list_suggestions');
  const byStatus = suggestions.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`\n=== Suggestions (${String(suggestions.length)} total) ===`);
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`  ${status}: ${String(count)}`);
  }

  if (suggestions.length > 0) {
    console.log('\nMost recent 5:');
    const recent = [...suggestions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    for (const s of recent) {
      console.log(
        `  [${s.status}] ${s.title} (${s.suggestionType}) — ${s.source} @ ${s.createdAt}`
      );
    }
  }
}

async function cmdContext(sessionId: string): Promise<void> {
  const ctx = await mcpCall<ProjectContext>(sessionId, 'get_project_context');
  console.log('\n=== Project Context ===');
  console.log(JSON.stringify(ctx, null, 2));
}

async function cmdSummary(sessionId: string): Promise<void> {
  await cmdSuggestions(sessionId);
  await cmdContext(sessionId);
}

// ---- Main ----

async function main(): Promise<void> {
  const cmd = process.argv[2] ?? 'summary';

  let sessionId: string;
  try {
    sessionId = await mcpInit();
  } catch (err) {
    console.error('Failed to connect to MCP server (is `just dev` running?):', err);
    process.exit(1);
  }

  try {
    switch (cmd) {
      case 'suggestions':
        await cmdSuggestions(sessionId);
        break;
      case 'context':
        await cmdContext(sessionId);
        break;
      default:
        await cmdSummary(sessionId);
    }
  } finally {
    await mcpDelete(sessionId);
  }
}

void main();
