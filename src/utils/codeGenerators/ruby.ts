/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { NetworkHistoryEntry } from '@/types/history';

/**
 * Escape a string for use in a Ruby string literal.
 */
function escapeRubyString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Generate Ruby code using net/http from a network history entry.
 *
 * @param entry - The network history entry to convert
 * @returns Ruby code string that reproduces the request
 */
export function generateRubyCode(entry: NetworkHistoryEntry): string {
  const { method, url, headers, body } = entry.request;

  const lines: string[] = ['require "net/http"', 'require "json"', ''];

  // Parse URL
  lines.push(`uri = URI('${escapeRubyString(url)}')`);
  lines.push('');

  // Create request
  const methodCapitalized = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  lines.push(`request = Net::HTTP::${methodCapitalized}.new(uri)`);

  // Add headers
  if (Object.keys(headers).length > 0) {
    Object.entries(headers).forEach(([key, value]) => {
      lines.push(`request['${escapeRubyString(key)}'] = '${escapeRubyString(value)}'`);
    });
  }

  // Add body for methods that support it
  if (body !== null) {
    const methodUpper = method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(methodUpper) && body.length > 0) {
      // Check if Content-Type suggests JSON (case-insensitive)
      const contentTypeKey = Object.keys(headers).find(
        (key) => key.toLowerCase() === 'content-type'
      );
      const contentType =
        contentTypeKey !== undefined ? (headers[contentTypeKey]?.toLowerCase() ?? '') : '';
      if (contentType.length > 0 && contentType.includes('application/json')) {
        // For JSON, use the body as-is (it's already JSON)
        lines.push(`request.body = '${escapeRubyString(body)}'`);
        lines.push("request['Content-Type'] = 'application/json'");
      } else {
        lines.push(`request.body = '${escapeRubyString(body)}'`);
      }
    }
  }

  lines.push('');

  // Execute request
  lines.push(
    'response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == "https") do |http|'
  );
  lines.push('  http.request(request)');
  lines.push('end');
  lines.push('');
  lines.push('puts response.body');

  return lines.join('\n');
}
