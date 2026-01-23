/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatRelativeTime } from './relative-time';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now() to have consistent test results
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "invalid date" for invalid timestamp', () => {
    expect(formatRelativeTime('invalid-date')).toBe('invalid date');
    expect(formatRelativeTime('')).toBe('invalid date');
    expect(formatRelativeTime('not-a-date')).toBe('invalid date');
  });

  it('should return "just now" for timestamps less than 60 seconds ago', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');

    const fiftyNineSecondsAgo = new Date(now.getTime() - 59 * 1000).toISOString();
    expect(formatRelativeTime(fiftyNineSecondsAgo)).toBe('just now');
  });

  it('should format minutes correctly', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoMinutesAgo)).toBe('2m ago');

    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    expect(formatRelativeTime(thirtyMinutesAgo)).toBe('30m ago');

    const fiftyNineMinutesAgo = new Date(now.getTime() - 59 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59m ago');
  });

  it('should format hours correctly', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');

    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveHoursAgo)).toBe('5h ago');

    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23h ago');
  });

  it('should return "yesterday" for exactly 1 day ago', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneDayAgo)).toBe('yesterday');
  });

  it('should format days correctly for 2-6 days ago', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');

    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(sixDaysAgo)).toBe('6d ago');
  });

  it('should format date for entries older than 7 days', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const result = formatRelativeTime(tenDaysAgo);
    // Should format as locale date (e.g., "Jan 7")
    expect(result).toMatch(/Jan \d+/);

    const oneMonthAgo = new Date('2025-12-17T10:00:00Z').toISOString();
    const result2 = formatRelativeTime(oneMonthAgo);
    expect(result2).toMatch(/Dec \d+/);
  });

  it('should handle future dates by returning "just now"', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    // Future dates result in negative diffMs, which after Math.floor gives negative seconds
    // Negative seconds are < 60, so the function returns "just now"
    const futureDate = new Date(now.getTime() + 60 * 1000).toISOString();
    expect(formatRelativeTime(futureDate)).toBe('just now');

    const farFutureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(farFutureDate)).toBe('just now');
  });

  it('should handle boundary between 59 seconds and 1 minute', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const fiftyNineSecondsAgo = new Date(now.getTime() - 59 * 1000).toISOString();
    expect(formatRelativeTime(fiftyNineSecondsAgo)).toBe('just now');

    const sixtyOneSecondsAgo = new Date(now.getTime() - 61 * 1000).toISOString();
    expect(formatRelativeTime(sixtyOneSecondsAgo)).toBe('1m ago');
  });

  it('should handle boundary between 59 minutes and 1 hour', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const fiftyNineMinutesAgo = new Date(now.getTime() - 59 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59m ago');

    const sixtyOneMinutesAgo = new Date(now.getTime() - 61 * 60 * 1000).toISOString();
    expect(formatRelativeTime(sixtyOneMinutesAgo)).toBe('1h ago');
  });

  it('should handle boundary between 23 hours and 1 day', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23h ago');

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(oneDayAgo)).toBe('yesterday');
  });
});
