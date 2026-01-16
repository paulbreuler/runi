/**
 * HTTP types - re-exported from generated Rust bindings.
 *
 * The base types (RequestParams, HttpResponse, RequestTiming) are generated
 * from Rust structs using ts-rs. This ensures type safety across the IPC boundary.
 *
 * This file re-exports those types and adds TypeScript-only helpers.
 */

// Re-export generated types from Rust
export type { HttpResponse, RequestParams, RequestTiming } from './generated/index';

import { type RequestParams } from './generated/index';

/**
 * HTTP methods supported by the API client.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Default timeout in milliseconds.
 */
export const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Create default request params with sensible defaults.
 */
export function createRequestParams(
  url: string,
  method: HttpMethod = 'GET',
  options?: Partial<Pick<RequestParams, 'headers' | 'body' | 'timeout_ms'>>
): RequestParams {
  return {
    url,
    method,
    headers: options?.headers ?? {},
    body: options?.body ?? null,
    timeout_ms: options?.timeout_ms ?? DEFAULT_TIMEOUT_MS,
  };
}
