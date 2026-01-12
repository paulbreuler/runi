/**
 * HTTP types matching Rust domain structs exactly.
 */

/**
 * Timing information for HTTP request phases.
 */
export interface RequestTiming {
  /** Total request duration in milliseconds. */
  total_ms: number;
  /** DNS resolution time in milliseconds. */
  dns_ms: number | null;
  /** TCP connection time in milliseconds. */
  connect_ms: number | null;
  /** TLS handshake time in milliseconds. */
  tls_ms: number | null;
  /** Time to first byte in milliseconds. */
  first_byte_ms: number | null;
}

/**
 * Parameters for an HTTP request.
 */
export interface RequestParams {
  /** The target URL. */
  url: string;
  /** HTTP method (GET, POST, PUT, PATCH, DELETE, etc.). */
  method: string;
  /** Request headers as key-value pairs. */
  headers: Record<string, string>;
  /** Optional request body. */
  body: string | null;
  /** Request timeout in milliseconds (default: 30000). */
  timeout_ms: number;
}

/**
 * Response from an HTTP request.
 */
export interface HttpResponse {
  /** HTTP status code. */
  status: number;
  /** HTTP status text (e.g., "OK", "Not Found"). */
  status_text: string;
  /** Response headers as key-value pairs. */
  headers: Record<string, string>;
  /** Response body as a string. */
  body: string;
  /** Timing information for the request. */
  timing: RequestTiming;
}

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
