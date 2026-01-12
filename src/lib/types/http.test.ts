import { describe, it, expect } from 'vitest';
import { createRequestParams, DEFAULT_TIMEOUT_MS } from './http';

describe('http types', () => {
  describe('createRequestParams', () => {
    it('creates params with defaults', () => {
      const params = createRequestParams('https://example.com');

      expect(params.url).toBe('https://example.com');
      expect(params.method).toBe('GET');
      expect(params.headers).toEqual({});
      expect(params.body).toBeNull();
      expect(params.timeout_ms).toBe(DEFAULT_TIMEOUT_MS);
    });

    it('accepts custom method', () => {
      const params = createRequestParams('https://example.com', 'POST');

      expect(params.method).toBe('POST');
    });

    it('accepts custom options', () => {
      const params = createRequestParams('https://example.com', 'POST', {
        headers: { 'Content-Type': 'application/json' },
        body: '{"test": true}',
        timeout_ms: 5000,
      });

      expect(params.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(params.body).toBe('{"test": true}');
      expect(params.timeout_ms).toBe(5000);
    });
  });
});
