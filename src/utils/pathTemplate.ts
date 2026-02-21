// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

/**
 * Returns true when `resolvedPath` matches `templatePath`,
 * treating `{param}` segments as wildcards that match any single
 * non-empty, non-slash segment.
 *
 * @example
 * matchesPathTemplate('/books/123', '/books/{id}') // true
 * matchesPathTemplate('/books',     '/books/{id}') // false — different segment count
 * matchesPathTemplate('/books/123', '/books/123')  // true  — literal match
 * matchesPathTemplate('/books/',    '/books/{id}') // false — empty segment after trailing slash
 */
export function matchesPathTemplate(resolvedPath: string, templatePath: string): boolean {
  const resolvedSegments = resolvedPath.split('/').filter(Boolean);
  const templateSegments = templatePath.split('/').filter(Boolean);

  if (resolvedSegments.length !== templateSegments.length) {
    return false;
  }

  return templateSegments.every((seg, i) => {
    if (seg.startsWith('{') && seg.endsWith('}')) {
      // Wildcard segment: match any non-empty value
      return resolvedSegments[i] !== undefined && resolvedSegments[i].length > 0;
    }
    return seg === resolvedSegments[i];
  });
}
