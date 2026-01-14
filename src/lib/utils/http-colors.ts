/**
 * HTTP method and status code color utilities (HTTPie-inspired).
 *
 * Provides color classes for HTTP methods and status codes following
 * HTTPie's color-coding scheme for visual consistency.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Color classes for HTTP methods (HTTPie-inspired).
 * Each method has a distinct color for easy visual identification.
 */
export const methodColors: Record<HttpMethod, string> = {
  GET: 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800',
  POST: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800',
  PUT: 'bg-yellow-600 hover:bg-yellow-700 text-white dark:bg-yellow-700 dark:hover:bg-yellow-800',
  PATCH: 'bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-800',
  DELETE: 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800',
  HEAD: 'bg-gray-600 hover:bg-gray-700 text-white dark:bg-gray-700 dark:hover:bg-gray-800',
  OPTIONS: 'bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-800',
};

/**
 * Get color classes for an HTTP method.
 *
 * @param method - The HTTP method
 * @returns Color classes string for the method
 */
export function getMethodColor(method: HttpMethod): string {
  return methodColors[method] ?? methodColors.GET;
}

/**
 * Get color classes for an HTTP status code (HTTPie-inspired).
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
