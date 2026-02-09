/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

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
  GET: 'text-method-get',
  POST: 'text-method-post',
  PUT: 'text-method-put',
  PATCH: 'text-method-patch',
  DELETE: 'text-method-delete',
  HEAD: 'text-method-head',
  OPTIONS: 'text-method-options',
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
  return methodTextColors[method];
}

/**
 * Background color classes for HTTP methods (for badges/pills).
 * Uses low opacity for subtle background tint.
 */
export const methodBgColors: Record<HttpMethod, string> = {
  GET: 'bg-accent-blue/10',
  POST: 'bg-signal-success/10',
  PUT: 'bg-signal-warning/10',
  PATCH: 'bg-signal-warning/10',
  DELETE: 'bg-signal-error/10',
  HEAD: 'bg-text-muted/10',
  OPTIONS: 'bg-text-muted/10',
};

/**
 * Status range type for filtering.
 */
export type StatusRange = '2xx' | '3xx' | '4xx' | '5xx';

/**
 * Status range colors with text and background variants.
 * Used for dropdown items and badges.
 */
export const statusRangeColors: Record<StatusRange, { text: string; bg: string; dot: string }> = {
  '2xx': { text: 'text-signal-success', bg: 'bg-signal-success/10', dot: 'bg-signal-success' },
  '3xx': { text: 'text-accent-blue', bg: 'bg-accent-blue/10', dot: 'bg-accent-blue' },
  '4xx': { text: 'text-signal-warning', bg: 'bg-signal-warning/10', dot: 'bg-signal-warning' },
  '5xx': { text: 'text-signal-error', bg: 'bg-signal-error/10', dot: 'bg-signal-error' },
};

/**
 * Intelligence signal type for filtering.
 */
export type IntelligenceSignal = 'verified' | 'drift' | 'ai' | 'bound';

/**
 * Intelligence signal colors.
 * Used for dropdown items and status indicators.
 */
export const intelligenceColors: Record<IntelligenceSignal, { text: string; dot: string }> = {
  verified: { text: 'text-signal-success', dot: 'bg-signal-success' },
  drift: { text: 'text-signal-warning', dot: 'bg-signal-warning' },
  ai: { text: 'text-signal-ai', dot: 'bg-signal-ai' },
  bound: { text: 'text-accent-blue', dot: 'bg-accent-blue' },
};

/**
 * Get color classes for an HTTP status code (text only).
 *
 * Status ranges:
 * - 2xx: Green (success)
 * - 3xx: Blue (redirect)
 * - 4xx: Orange (client error)
 * - 5xx: Red (server error)
 *
 * Uses design system signal colors for consistency.
 *
 * @param status - The HTTP status code
 * @returns Text color class string for the status
 */
export function getStatusTextColor(status: number): string {
  if (status >= 200 && status < 300) {
    return 'text-signal-success';
  }
  if (status >= 300 && status < 400) {
    return 'text-accent-blue';
  }
  if (status >= 400 && status < 500) {
    return 'text-signal-warning';
  }
  if (status >= 500) {
    return 'text-signal-error';
  }
  return 'text-text-muted';
}

/**
 * Get color classes for an HTTP status code (with background for badges).
 *
 * Status ranges:
 * - 2xx: Green (success)
 * - 3xx: Blue (redirect)
 * - 4xx: Orange (client error)
 * - 5xx: Red (server error)
 *
 * Uses design system signal colors for consistency.
 *
 * @param status - The HTTP status code
 * @returns Color classes string (text + background) for the status
 */
export function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return 'bg-signal-success/10 text-signal-success';
  }
  if (status >= 300 && status < 400) {
    return 'bg-accent-blue/10 text-accent-blue';
  }
  if (status >= 400 && status < 500) {
    return 'bg-signal-warning/10 text-signal-warning';
  }
  if (status >= 500) {
    return 'bg-signal-error/10 text-signal-error';
  }
  return 'bg-text-muted/10 text-text-muted';
}

/**
 * Get the status range from a status code.
 *
 * @param status - The HTTP status code
 * @returns The status range (2xx, 3xx, 4xx, 5xx) or undefined
 */
export function getStatusRange(status: number): StatusRange | undefined {
  if (status >= 200 && status < 300) {
    return '2xx';
  }
  if (status >= 300 && status < 400) {
    return '3xx';
  }
  if (status >= 400 && status < 500) {
    return '4xx';
  }
  if (status >= 500) {
    return '5xx';
  }
  return undefined;
}
