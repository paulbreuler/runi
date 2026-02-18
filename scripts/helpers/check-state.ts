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
 *   npx tsx scripts/helpers/check-state.ts db           # raw SQLite counts
 */

import { execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const MCP_URL = 'http://127.0.0.1:3002';
const DB_PATH = join(homedir(), 'Library/Application Support/runi/suggestions.db');

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

// ---- DB helper ----

function dbQuery(sql: string): string {
  try {
    return execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf8' }).trim();
  } catch {
    return '(sqlite3 not available or db not found)';
  }
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
    for (const s of suggestions.slice(0, 5)) {
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

function cmdDb(): void {
  console.log('\n=== SQLite State ===');
  console.log('Suggestions by status:');
  const counts = dbQuery(
    'SELECT status, COUNT(*) as n FROM suggestions GROUP BY status ORDER BY status'
  );
  if (counts.length > 0) {
    for (const line of counts.split('\n')) {
      console.log(`  ${line}`);
    }
  } else {
    console.log('  (empty)');
  }

  console.log('\nProject context:');
  const ctx = dbQuery(
    'SELECT active_collection_id, active_request_id, investigation_notes FROM project_context LIMIT 1'
  );
  console.log(`  ${ctx.length > 0 ? ctx : '(empty)'}`);
}

async function cmdSummary(sessionId: string): Promise<void> {
  await cmdSuggestions(sessionId);
  await cmdContext(sessionId);
  cmdDb();
}

// ---- Main ----

async function main(): Promise<void> {
  const cmd = process.argv[2] ?? 'summary';

  if (cmd === 'db') {
    cmdDb();
    return;
  }

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
