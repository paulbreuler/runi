import { describe, expect, it } from 'vitest';
import { calculateWaterfallSegments, getSignalColorClass } from './history';

describe('calculateWaterfallSegments', () => {
  it('calculates segments from full timing data', () => {
    const timing = {
      total_ms: 150,
      dns_ms: 10,
      connect_ms: 20,
      tls_ms: 30,
      first_byte_ms: 100,
    };

    const segments = calculateWaterfallSegments(timing);

    expect(segments).toEqual({
      dns: 10,
      connect: 20,
      tls: 30,
      wait: 40, // 100 - (10 + 20 + 30) = 40
      download: 50, // 150 - 100 = 50
    });
  });

  it('returns undefined when total_ms is 0', () => {
    const timing = {
      total_ms: 0,
      dns_ms: 10,
      connect_ms: 20,
      tls_ms: 30,
      first_byte_ms: 100,
    };

    expect(calculateWaterfallSegments(timing)).toBeUndefined();
  });

  it('returns undefined when total_ms is negative', () => {
    const timing = {
      total_ms: -1,
      dns_ms: 10,
      connect_ms: 20,
      tls_ms: 30,
      first_byte_ms: 100,
    };

    expect(calculateWaterfallSegments(timing)).toBeUndefined();
  });

  it('returns undefined when first_byte_ms is null (no meaningful segments)', () => {
    const timing = {
      total_ms: 150,
      dns_ms: null,
      connect_ms: null,
      tls_ms: null,
      first_byte_ms: null,
    };

    // Without first_byte_ms, we can't calculate wait time or download time
    // So we return undefined to show the empty state
    expect(calculateWaterfallSegments(timing)).toBeUndefined();
  });

  it('handles partial null values', () => {
    const timing = {
      total_ms: 100,
      dns_ms: 10,
      connect_ms: null,
      tls_ms: 20,
      first_byte_ms: 50,
    };

    const segments = calculateWaterfallSegments(timing);

    expect(segments).toEqual({
      dns: 10,
      connect: 0,
      tls: 20,
      wait: 20, // 50 - (10 + 0 + 20) = 20
      download: 50, // 100 - 50 = 50
    });
  });

  it('clamps wait time to 0 when connection time exceeds first_byte', () => {
    const timing = {
      total_ms: 100,
      dns_ms: 30,
      connect_ms: 30,
      tls_ms: 30,
      first_byte_ms: 50, // Less than connection time (90)
    };

    const segments = calculateWaterfallSegments(timing);

    expect(segments?.wait).toBe(0);
  });

  it('clamps download time to 0 when first_byte exceeds total', () => {
    const timing = {
      total_ms: 100,
      dns_ms: 10,
      connect_ms: 10,
      tls_ms: 10,
      first_byte_ms: 150, // Exceeds total
    };

    const segments = calculateWaterfallSegments(timing);

    expect(segments?.download).toBe(0);
  });

  it('handles HTTP (no TLS) timing correctly', () => {
    const timing = {
      total_ms: 50,
      dns_ms: 5,
      connect_ms: 10,
      tls_ms: 0, // No TLS for HTTP
      first_byte_ms: 30,
    };

    const segments = calculateWaterfallSegments(timing);

    expect(segments).toEqual({
      dns: 5,
      connect: 10,
      tls: 0,
      wait: 15, // 30 - (5 + 10 + 0) = 15
      download: 20, // 50 - 30 = 20
    });
  });
});

describe('getSignalColorClass', () => {
  it('returns correct class for verified signal', () => {
    expect(getSignalColorClass('verified')).toBe('bg-signal-success');
  });

  it('returns correct class for drift signal', () => {
    expect(getSignalColorClass('drift')).toBe('bg-signal-warning');
  });

  it('returns correct class for ai signal', () => {
    expect(getSignalColorClass('ai')).toBe('bg-signal-ai');
  });

  it('returns correct class for bound signal', () => {
    expect(getSignalColorClass('bound')).toBe('bg-accent-blue');
  });
});
