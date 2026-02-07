/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from 'vitest';
import { truncateNavLabel } from './truncateNavLabel';

describe('truncateNavLabel', () => {
  describe('no truncation needed', () => {
    it('returns original label when shorter than max length', () => {
      expect(truncateNavLabel('Short', 120)).toBe('Short');
    });

    it('returns original label when equal to max length', () => {
      const label = 'a'.repeat(120);
      expect(truncateNavLabel(label, 120)).toBe(label);
    });

    it('returns empty string as-is', () => {
      expect(truncateNavLabel('', 120)).toBe('');
    });
  });

  describe('truncation with ellipsis', () => {
    it('truncates long label and appends ellipsis', () => {
      const label = 'a'.repeat(150);
      const result = truncateNavLabel(label, 120);
      expect(result).toBe('a'.repeat(117) + '...');
      expect(result.length).toBe(120);
    });

    it('truncates at default max length (120)', () => {
      const label = 'a'.repeat(200);
      const result = truncateNavLabel(label);
      expect(result).toBe('a'.repeat(117) + '...');
      expect(result.length).toBe(120);
    });

    it('handles custom max length', () => {
      const label = 'Hello, World! This is a test.';
      const result = truncateNavLabel(label, 20);
      expect(result).toBe('Hello, World! Thi...');
      expect(result.length).toBe(20);
    });
  });

  describe('edge case: maxLength <= 0', () => {
    it('returns empty string when maxLength is 0', () => {
      expect(truncateNavLabel('Hello', 0)).toBe('');
    });

    it('returns empty string when maxLength is negative', () => {
      expect(truncateNavLabel('Hello', -5)).toBe('');
    });
  });

  describe('edge case: maxLength <= 3', () => {
    it('truncates without ellipsis when maxLength is 1', () => {
      expect(truncateNavLabel('Hello', 1)).toBe('H');
    });

    it('truncates without ellipsis when maxLength is 2', () => {
      expect(truncateNavLabel('Hello', 2)).toBe('He');
    });

    it('truncates without ellipsis when maxLength is 3', () => {
      expect(truncateNavLabel('Hello', 3)).toBe('Hel');
    });

    it('returns original when label length equals maxLength of 3', () => {
      expect(truncateNavLabel('Hi!', 3)).toBe('Hi!');
    });
  });

  describe('real-world scenarios', () => {
    it('handles typical collection name', () => {
      const label = 'My API Collection';
      expect(truncateNavLabel(label, 120)).toBe('My API Collection');
    });

    it('handles very long request name', () => {
      const label =
        'GET /api/v1/users/12345/profile/settings/preferences/notifications/email/subscriptions';
      const result = truncateNavLabel(label, 50);
      expect(result).toBe('GET /api/v1/users/12345/profile/settings/prefer...');
      expect(result.length).toBe(50);
    });

    it('handles unicode characters', () => {
      const label = '🚀 Deploy to Production Environment 🎉';
      const result = truncateNavLabel(label, 20);
      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toContain('...');
    });
  });
});
