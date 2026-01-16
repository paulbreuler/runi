/**
 * HTTP API wrapper for Tauri commands.
 * Falls back to browser fetch when Tauri is not available (dev mode).
 */

import { invoke } from '@tauri-apps/api/core';
import type { HttpResponse, RequestParams } from '@/types/http';

/**
 * Check if running in Tauri context
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Browser fallback using fetch API
 */
async function browserFetch(params: RequestParams): Promise<HttpResponse> {
  const startTime = performance.now();

  try {
    const response = await fetch(params.url, {
      method: params.method,
      headers: params.headers,
      body: params.body ?? undefined,
      signal: AbortSignal.timeout(params.timeout_ms),
    });

    const body = await response.text();
    const totalMs = Math.round(performance.now() - startTime);

    // Convert headers to record
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return {
      status: response.status,
      status_text: response.statusText,
      headers,
      body,
      timing: {
        total_ms: totalMs,
        dns_ms: null,
        connect_ms: null,
        tls_ms: null,
        first_byte_ms: null,
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Execute an HTTP request through the Rust backend.
 * Falls back to browser fetch when Tauri is not available.
 *
 * @param params - The request parameters
 * @returns Promise resolving to the HTTP response
 * @throws Error if the request fails
 */
export async function executeRequest(params: RequestParams): Promise<HttpResponse> {
  if (isTauri()) {
    return invoke<HttpResponse>('execute_request', { params });
  }
  return browserFetch(params);
}
