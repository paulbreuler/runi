/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { NetworkHistoryEntry } from '@/types/history';

/**
 * Escape a string for use in a single-quoted shell argument.
 * Single quotes in the string are escaped as '\'' (end quote, escaped quote, start quote).
 */
function escapeShellArg(str: string): string {
  return str.replace(/'/g, "'\\''");
}

/**
 * Generate a cURL command from a network history entry.
 *
 * @param entry - The network history entry to convert
 * @returns A cURL command string that reproduces the request
 */
export function generateCurlCommand(entry: NetworkHistoryEntry): string {
  const { method, url, headers, body } = entry.request;

  const parts: string[] = ['curl'];

  // Add method (GET is default, but explicit is clearer)
  parts.push(`-X ${method.toUpperCase()}`);

  // Add headers
  for (const [key, value] of Object.entries(headers)) {
    parts.push(`-H '${escapeShellArg(key)}: ${escapeShellArg(value)}'`);
  }

  // Add body for methods that support it
  if (body !== null && body !== '') {
    const methodUpper = method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(methodUpper)) {
      parts.push(`-d '${escapeShellArg(body)}'`);
    }
  }

  // Add URL (always last)
  parts.push(`'${escapeShellArg(url)}'`);

  return parts.join(' \\\n  ');
}
