// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import { describe, it, expect } from 'vitest';
import { matchesPathTemplate } from './pathTemplate';

describe('matchesPathTemplate', () => {
  describe('literal paths', () => {
    it('matches identical literal paths', () => {
      expect(matchesPathTemplate('/books', '/books')).toBe(true);
    });

    it('matches multi-segment literal paths', () => {
      expect(matchesPathTemplate('/api/v1/books', '/api/v1/books')).toBe(true);
    });

    it('returns false when literal paths differ', () => {
      expect(matchesPathTemplate('/books', '/authors')).toBe(false);
    });
  });

  describe('parameterized paths', () => {
    it('matches a resolved path against a single-param template', () => {
      expect(matchesPathTemplate('/books/123', '/books/{id}')).toBe(true);
    });

    it('matches a string ID against a param template', () => {
      expect(matchesPathTemplate('/books/my-book', '/books/{slug}')).toBe(true);
    });

    it('matches multiple params in one path', () => {
      expect(matchesPathTemplate('/users/42/posts/99', '/users/{userId}/posts/{postId}')).toBe(
        true
      );
    });

    it('matches mixed literal and param segments', () => {
      expect(matchesPathTemplate('/api/books/123', '/api/books/{id}')).toBe(true);
    });

    it('does not match when segment count differs', () => {
      expect(matchesPathTemplate('/books', '/books/{id}')).toBe(false);
    });

    it('does not match when resolved has extra segments', () => {
      expect(matchesPathTemplate('/books/123/chapters', '/books/{id}')).toBe(false);
    });

    it('does not match when a literal segment does not match', () => {
      expect(matchesPathTemplate('/authors/123', '/books/{id}')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles root path', () => {
      expect(matchesPathTemplate('/', '/')).toBe(true);
    });

    it('handles trailing slashes by ignoring empty segments', () => {
      // Both split to ['books', '123'] after filter(Boolean)
      expect(matchesPathTemplate('/books/123/', '/books/{id}/')).toBe(true);
    });

    it('returns false when resolved segment is empty (double slash)', () => {
      // /books//123 splits to ['books', '123'] — same as /books/123
      // This is intentional: filter(Boolean) ignores empty segments
      expect(matchesPathTemplate('/books//123', '/books/{id}')).toBe(true);
    });

    it('returns false for empty param value in template match', () => {
      // Template /books/{id} needs a non-empty segment for {id}
      // /books/ splits to ['books'] — different length
      expect(matchesPathTemplate('/books/', '/books/{id}')).toBe(false);
    });
  });
});
