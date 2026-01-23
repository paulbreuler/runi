/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  generateCorrelationId,
  getCorrelationId,
  withCorrelationId,
  setCorrelationId,
  clearCorrelationId,
} from './correlation-id';

describe('correlation-id', () => {
  beforeEach(() => {
    clearCorrelationId();
  });

  describe('generateCorrelationId', () => {
    it('generates unique IDs', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('generates UUID v4 format', () => {
      const id = generateCorrelationId();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidPattern);
    });

    it('generates different IDs on each call', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCorrelationId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('getCorrelationId', () => {
    it('returns undefined when no correlation ID is set', () => {
      expect(getCorrelationId()).toBeUndefined();
    });

    it('returns the set correlation ID', () => {
      const id = generateCorrelationId();
      setCorrelationId(id);
      expect(getCorrelationId()).toBe(id);
    });
  });

  describe('setCorrelationId', () => {
    it('sets the correlation ID in context', () => {
      const id = generateCorrelationId();
      setCorrelationId(id);
      expect(getCorrelationId()).toBe(id);
    });

    it('overwrites existing correlation ID', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      setCorrelationId(id1);
      expect(getCorrelationId()).toBe(id1);
      setCorrelationId(id2);
      expect(getCorrelationId()).toBe(id2);
    });
  });

  describe('clearCorrelationId', () => {
    it('clears the correlation ID from context', () => {
      const id = generateCorrelationId();
      setCorrelationId(id);
      expect(getCorrelationId()).toBe(id);
      clearCorrelationId();
      expect(getCorrelationId()).toBeUndefined();
    });

    it('does not throw when no correlation ID is set', () => {
      expect(() => {
        clearCorrelationId();
      }).not.toThrow();
    });
  });

  describe('withCorrelationId', () => {
    it('executes function with correlation ID in context', () => {
      const id = generateCorrelationId();
      const result = withCorrelationId(id, () => {
        return getCorrelationId();
      });
      expect(result).toBe(id);
    });

    it('returns function result', () => {
      const id = generateCorrelationId();
      const result = withCorrelationId(id, () => {
        return 42;
      });
      expect(result).toBe(42);
    });

    it('clears correlation ID after function execution', () => {
      const id = generateCorrelationId();
      withCorrelationId(id, () => {
        expect(getCorrelationId()).toBe(id);
      });
      expect(getCorrelationId()).toBeUndefined();
    });

    it('clears correlation ID even if function throws', () => {
      const id = generateCorrelationId();
      expect(() => {
        withCorrelationId(id, () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
      expect(getCorrelationId()).toBeUndefined();
    });

    it('preserves existing correlation ID when nested', () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      setCorrelationId(id1);

      withCorrelationId(id2, () => {
        expect(getCorrelationId()).toBe(id2);
      });

      expect(getCorrelationId()).toBe(id1);
    });

    it('supports async functions', async () => {
      const id = generateCorrelationId();
      const result = await withCorrelationId(id, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return getCorrelationId();
      });
      expect(result).toBe(id);
    });
  });

  describe('context isolation', () => {
    it('maintains separate contexts for different async operations', async () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();

      const promise1 = withCorrelationId(id1, async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return getCorrelationId();
      });

      const promise2 = withCorrelationId(id2, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return getCorrelationId();
      });

      const [result1, result2] = await Promise.all([promise1, promise2]);
      expect(result1).toBe(id1);
      expect(result2).toBe(id2);
    });
  });
});
