/**
 * HTTP method and status code color utilities.
 *
 * Provides color classes for HTTP methods and status codes for visual consistency.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Text color classes for HTTP methods.
 * Industry standard colors:
 * - GET: Blue (read, safe, neutral)
 * - POST: Green (create, positive action)
 * - PUT/PATCH: Orange (update, caution)
 * - DELETE: Red (destructive, warning)
 * - HEAD/OPTIONS: Gray (meta, less frequent)
 *
 * 2026 minimal design: Color only the text, no backgrounds.
 * Background shading appears on hover like a list item.
 */
export const methodTextColors: Record<HttpMethod, string> = {
  GET: 'text-accent-blue', // Blue - read operation, safe
  POST: 'text-signal-success', // Green - create, positive
  PUT: 'text-signal-warning', // Orange - update, caution
  PATCH: 'text-signal-warning', // Orange - same as PUT
  DELETE: 'text-signal-error', // Red - destructive
  HEAD: 'text-text-muted', // Gray - meta operation
  OPTIONS: 'text-text-muted', // Gray - meta operation
};

/**
 * @deprecated Use methodTextColors instead - zen aesthetic uses text color only
 */
export const methodColors: Record<HttpMethod, string> = methodTextColors;

/**
 * Get color classes for an HTTP method.
 *
 * @param method - The HTTP method
 * @returns Color classes string for the method
 */
export function getMethodColor(method: HttpMethod): string {
  return methodColors[method];
}

/**
 * Get color classes for an HTTP status code.
 *
 * Status ranges:
 * - 2xx: Green (success)
 * - 3xx: Blue (redirect)
 * - 4xx: Yellow/Orange (client error)
 * - 5xx: Red (server error)
 *
 * @param status - The HTTP status code
 * @returns Color classes string for the status
 */
export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return 'bg-green-600 text-white dark:bg-green-700 dark:text-green-100';
  }
  if (status >= 300 && status < 400) {
    return 'bg-blue-600 text-white dark:bg-blue-700 dark:text-blue-100';
  }
  if (status >= 400 && status < 500) {
    return 'bg-yellow-600 text-white dark:bg-yellow-700 dark:text-yellow-100';
  }
  if (status >= 500) {
    return 'bg-red-600 text-white dark:bg-red-700 dark:text-red-100';
  }
  return 'bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-100';
}
