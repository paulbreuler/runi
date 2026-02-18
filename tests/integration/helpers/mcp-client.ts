/**
 * Shared MCP HTTP client for integration tests.
 *
 * Wraps JSON-RPC 2.0 over HTTP against the runi MCP server (port 3002).
 * Handles session bootstrapping, tool calls, and SSE subscriptions.
 */

const MCP_BASE_URL = 'http://127.0.0.1:3002';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string };
}

interface ToolResult<T = unknown> {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  /** Parsed JSON from content[0].text, or null if content is empty. */
  parsed: T | null;
}

interface SseEvent {
  event: string;
  data: string;
}

export interface SseSubscription {
  waitForEvent(type: string, timeoutMs?: number): Promise<SseEvent>;
  collectEvents(durationMs: number): Promise<SseEvent[]>;
  close(): void;
}

export class McpClient {
  private sessionId: string | null = null;
  private nextId = 1;

  /** Initialize the MCP session. Must be called before other methods. */
  async initialize(): Promise<void> {
    const body: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.nextId++,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'runi-integration-test', version: '1.0.0' },
      },
    };

    const res = await fetch(`${MCP_BASE_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Initialize failed: ${res.status} ${await res.text()}`);
    }

    this.sessionId = res.headers.get('Mcp-Session-Id');
    if (!this.sessionId) {
      throw new Error('No Mcp-Session-Id header in initialize response');
    }

    // Send initialized notification (no id = notification)
    await fetch(`${MCP_BASE_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': this.sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }),
    });
  }

  /** Call an MCP tool and parse the result. */
  async callTool<T = unknown>(
    name: string,
    args?: Record<string, unknown>
  ): Promise<ToolResult<T>> {
    const rpc = await this.sendRequest('tools/call', {
      name,
      arguments: args ?? {},
    });

    if (rpc.error) {
      throw new Error(`JSON-RPC error: ${rpc.error.code} ${rpc.error.message}`);
    }

    const result = rpc.result as ToolResult<T>;
    result.parsed = null; // explicit default; set below if content is present
    // Parse the double-encoded JSON in content[0].text
    if (result.content?.[0]?.text) {
      try {
        result.parsed = JSON.parse(result.content[0].text) as T;
      } catch {
        result.parsed = result.content[0].text as unknown as T;
      }
    }

    return result;
  }

  /** List all available tools. */
  async listTools(): Promise<Array<{ name: string; description?: string }>> {
    const rpc = await this.sendRequest('tools/list', {});
    if (rpc.error) {
      throw new Error(`JSON-RPC error: ${rpc.error.code} ${rpc.error.message}`);
    }
    const result = rpc.result as { tools: Array<{ name: string; description?: string }> };
    return result.tools;
  }

  /** Subscribe to SSE topic events. Returns a subscription handle. */
  subscribeSse(topics: string): SseSubscription {
    const url = `${MCP_BASE_URL}/mcp/sse/subscribe?topics=${encodeURIComponent(topics)}`;
    const controller = new AbortController();

    const events: SseEvent[] = [];
    const waiters: Array<{
      type: string;
      resolve: (e: SseEvent) => void;
      reject: (e: Error) => void;
    }> = [];

    // Start streaming in the background
    const streamPromise = fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          throw new Error(`SSE connection failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        let currentEvent = '';
        let currentData = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              currentData = line.slice(6).trim();
            } else if (line === '' && currentEvent) {
              const sseEvent: SseEvent = { event: currentEvent, data: currentData };
              events.push(sseEvent);

              // Check waiting promises
              const matchIndex = waiters.findIndex((w) => w.type === currentEvent);
              if (matchIndex !== -1) {
                const waiter = waiters.splice(matchIndex, 1)[0];
                waiter.resolve(sseEvent);
              }

              currentEvent = '';
              currentData = '';
            }
          }
        }
      })
      .catch((err: Error) => {
        // AbortError is expected on close()
        if (err.name !== 'AbortError') {
          // Reject any pending waiters
          for (const w of waiters) {
            w.reject(err);
          }
          waiters.length = 0;
        }
      });

    // Keep reference to suppress unhandled rejection
    void streamPromise;

    return {
      waitForEvent(type: string, timeoutMs = 5000): Promise<SseEvent> {
        // Check already-received events
        const existing = events.find((e) => e.event === type);
        if (existing) {
          return Promise.resolve(existing);
        }

        return new Promise<SseEvent>((resolve, reject) => {
          const timer = setTimeout(() => {
            const idx = waiters.findIndex((w) => w.resolve === resolve);
            if (idx !== -1) waiters.splice(idx, 1);
            reject(new Error(`Timeout waiting for SSE event '${type}' after ${timeoutMs}ms`));
          }, timeoutMs);

          waiters.push({
            type,
            resolve: (e: SseEvent) => {
              clearTimeout(timer);
              resolve(e);
            },
            reject: (err: Error) => {
              clearTimeout(timer);
              reject(err);
            },
          });
        });
      },

      async collectEvents(durationMs: number): Promise<SseEvent[]> {
        await new Promise((resolve) => setTimeout(resolve, durationMs));
        return [...events];
      },

      close(): void {
        controller.abort();
        // Reject all pending waiters
        for (const w of waiters) {
          w.reject(new Error('SSE subscription closed'));
        }
        waiters.length = 0;
      },
    };
  }

  /** Delete the current session. */
  async deleteSession(): Promise<void> {
    if (!this.sessionId) return;

    await fetch(`${MCP_BASE_URL}/mcp`, {
      method: 'DELETE',
      headers: { 'Mcp-Session-Id': this.sessionId },
    });

    this.sessionId = null;
  }

  /** Clean up: delete session if active. */
  async cleanup(): Promise<void> {
    await this.deleteSession();
  }

  /** Send a raw JSON-RPC request. */
  private async sendRequest(
    method: string,
    params: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    if (!this.sessionId) {
      throw new Error('McpClient not initialized — call initialize() first');
    }

    const body: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: this.nextId++,
      method,
      params,
    };

    const res = await fetch(`${MCP_BASE_URL}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': this.sessionId,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    return (await res.json()) as JsonRpcResponse;
  }
}
