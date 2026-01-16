/**
 * HTTP API wrapper for Tauri commands.
 */

import { invoke } from '@tauri-apps/api/core';
import type { HttpResponse, RequestParams } from '@/types/http';

/**
 * Execute an HTTP request through the Rust backend.
 *
 * @param params - The request parameters
 * @returns Promise resolving to the HTTP response
 * @throws Error if the request fails
 */
export async function executeRequest(params: RequestParams): Promise<HttpResponse> {
  return invoke<HttpResponse>('execute_request', { params });
}
