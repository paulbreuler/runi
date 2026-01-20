import type { NetworkHistoryEntry } from '@/types/history';

/**
 * Escape a string for use in a Go string literal.
 */
function escapeGoString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Format headers as Go map literal.
 */
function formatHeaders(headers: Record<string, string>): string {
  const entries = Object.entries(headers);
  if (entries.length === 0) {
    return 'nil';
  }

  const formatted = entries
    .map(([key, value]) => `    "${escapeGoString(key)}": "${escapeGoString(value)}",`)
    .join('\n');

  return `map[string]string{\n${formatted}\n}`;
}

/**
 * Generate Go code using net/http from a network history entry.
 *
 * @param entry - The network history entry to convert
 * @returns Go code string that reproduces the request
 */
export function generateGoCode(entry: NetworkHistoryEntry): string {
  const { method, url, headers, body } = entry.request;

  const lines: string[] = [
    'package main',
    '',
    'import (',
    '    "bytes"',
    '    "encoding/json"',
    '    "fmt"',
    '    "io"',
    '    "net/http"',
    ')',
    '',
    'func main() {',
  ];

  // Create request
  lines.push(
    `    req, err := http.NewRequest("${method.toUpperCase()}", "${escapeGoString(url)}", nil)`
  );
  lines.push('    if err != nil {');
  lines.push('        panic(err)');
  lines.push('    }');
  lines.push('');

  // Add headers
  if (Object.keys(headers).length > 0) {
    lines.push(`    req.Header = ${formatHeaders(headers)}`);
    lines.push('');
  }

  // Add body for methods that support it
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
        // For JSON, use the body as a string literal
        // Escape backticks for Go raw string literals
        const escaped = body.replace(/`/g, '` + "`" + `');
        lines.push(`    jsonStr := \`${escaped}\``);
        lines.push('    req.Body = io.NopCloser(bytes.NewBufferString(jsonStr))');
      } else {
        lines.push(`    req.Body = io.NopCloser(bytes.NewBufferString("${escapeGoString(body)}"))`);
      }
      lines.push('');
    }
  }

  // Execute request
  lines.push('    client := &http.Client{}');
  lines.push('    resp, err := client.Do(req)');
  lines.push('    if err != nil {');
  lines.push('        panic(err)');
  lines.push('    }');
  lines.push('    defer resp.Body.Close()');
  lines.push('');
  lines.push('    body, err := io.ReadAll(resp.Body)');
  lines.push('    if err != nil {');
  lines.push('        panic(err)');
  lines.push('    }');
  lines.push('');
  lines.push('    fmt.Println(string(body))');
  lines.push('}');

  return lines.join('\n');
}
