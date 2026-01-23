/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { NetworkHistoryEntry } from '@/types/history';

/**
 * Escape a string for use in a Python string literal.
 */
function escapePythonString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Format headers as Python dictionary.
 */
function formatHeaders(headers: Record<string, string>): string {
  const entries = Object.entries(headers);
  if (entries.length === 0) {
    return '{}';
  }

  const formatted = entries
    .map(([key, value]) => `    '${escapePythonString(key)}': '${escapePythonString(value)}'`)
    .join(',\n');

  return `{\n${formatted}\n}`;
}

/**
 * Convert a JavaScript object to a Python dict string representation.
 */
function convertToPythonDict(obj: unknown): string {
  if (obj === null) {
    return 'None';
  }
  if (typeof obj === 'string') {
    return `'${escapePythonString(obj)}'`;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }
  if (Array.isArray(obj)) {
    const items = obj.map((item) => `    ${convertToPythonDict(item)}`).join(',\n');
    return `[\n${items}\n]`;
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }
    const formatted = entries
      .map(([key, value]) => `    '${escapePythonString(key)}': ${convertToPythonDict(value)}`)
      .join(',\n');
    return `{\n${formatted}\n}`;
  }
  // Fallback for other types (shouldn't happen with JSON.parse)
  return JSON.stringify(obj);
}

/**
 * Generate Python code using requests library from a network history entry.
 *
 * @param entry - The network history entry to convert
 * @returns Python code string that reproduces the request
 */
export function generatePythonCode(entry: NetworkHistoryEntry): string {
  const { method, url, headers, body } = entry.request;

  const lines: string[] = ['import requests', ''];

  // Build request parameters
  const params: string[] = [`url='${escapePythonString(url)}'`];

  // Add headers if present
  if (Object.keys(headers).length > 0) {
    params.push(`headers=${formatHeaders(headers)}`);
  }

  // Add body/data for methods that support it
  if (body !== null && body.length > 0) {
    const methodUpper = method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(methodUpper)) {
      // Check if Content-Type suggests JSON (case-insensitive)
      const contentTypeKey = Object.keys(headers).find(
        (key) => key.toLowerCase() === 'content-type'
      );
      const contentType =
        contentTypeKey !== undefined ? (headers[contentTypeKey]?.toLowerCase() ?? '') : '';
      if (contentType.length > 0 && contentType.includes('application/json')) {
        // For JSON, parse and use json parameter with the parsed object
        try {
          const parsed: unknown = JSON.parse(body);
          // Convert to Python dict format
          const pythonDict = convertToPythonDict(parsed);
          params.push(`json=${pythonDict}`);
        } catch {
          params.push(`data='${escapePythonString(body)}'`);
        }
      } else {
        params.push(`data='${escapePythonString(body)}'`);
      }
    }
  }

  // Build the request call
  const paramsStr = params.join(',\n    ');

  lines.push(`response = requests.${method.toLowerCase()}(\n    ${paramsStr}\n)`);
  lines.push('');
  lines.push('print(response.json())');

  return lines.join('\n');
}
