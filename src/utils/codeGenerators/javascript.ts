import type { NetworkHistoryEntry } from '@/types/history';

/**
 * Escape a string for use in a JavaScript template literal.
 */
function escapeJsString(str: string): string {
  return str.replace(/`/g, '\\`').replace(/\${/g, '\\${').replace(/\\/g, '\\\\');
}

/**
 * Format headers object as JavaScript object literal.
 */
function formatHeaders(headers: Record<string, string>): string {
  const entries = Object.entries(headers);
  if (entries.length === 0) {
    return '{}';
  }

  const formatted = entries
    .map(([key, value]) => `  '${escapeJsString(key)}': '${escapeJsString(value)}'`)
    .join(',\n');

  return `{\n${formatted}\n}`;
}

/**
 * Generate JavaScript/TypeScript code using fetch API from a network history entry.
 *
 * @param entry - The network history entry to convert
 * @returns JavaScript/TypeScript code string that reproduces the request
 */
export function generateJavaScriptCode(entry: NetworkHistoryEntry): string {
  const { method, url, headers, body } = entry.request;

  const lines: string[] = [];

  // Build fetch options
  const options: string[] = [`method: '${method.toUpperCase()}'`];

  // Add headers if present
  if (Object.keys(headers).length > 0) {
    options.push(`headers: ${formatHeaders(headers)}`);
  }

  // Add body for methods that support it
  if (body !== null && body.length > 0) {
    const methodUpper = method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(methodUpper)) {
      // Check if Content-Type suggests JSON (case-insensitive)
      const contentTypeKey = Object.keys(headers).find(
        (key) => key.toLowerCase() === 'content-type'
      );
      const contentType = contentTypeKey ? (headers[contentTypeKey]?.toLowerCase() ?? '') : '';
      if (contentType !== '' && contentType.includes('application/json')) {
        // For JSON, use the body directly (it's already a JSON string)
        options.push(`body: '${escapeJsString(body)}'`);
      } else {
        options.push(`body: '${escapeJsString(body)}'`);
      }
    }
  }

  // Build the fetch call
  const optionsStr = options.length > 0 ? `{\n  ${options.join(',\n  ')}\n}` : '{}';

  lines.push(`const response = await fetch('${escapeJsString(url)}', ${optionsStr});`);
  lines.push(`const data = await response.json();`);

  return lines.join('\n');
}
