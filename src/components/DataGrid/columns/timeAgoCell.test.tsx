/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TimeAgoCell component tests
 * @description Tests for relative time display with periodic updates
 *
 * TDD: RED phase - these tests define the expected behavior of timeAgoCell
 */

import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeAgoCell } from './timeAgoCell';

describe('TimeAgoCell', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays relative time for recent timestamp', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000).toISOString();
    render(<TimeAgoCell timestamp={twoMinutesAgo} />);

    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });

  it('displays "just now" for timestamps less than 60 seconds ago', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000).toISOString();
    render(<TimeAgoCell timestamp={thirtySecondsAgo} />);

    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('updates relative time periodically', async () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    render(<TimeAgoCell timestamp={oneMinuteAgo} />);

    // Initially shows "1m ago"
    expect(screen.getByText('1m ago')).toBeInTheDocument();

    // Advance time by 1 minute (both system time and timers)
    await act(async () => {
      vi.advanceTimersByTime(60 * 1000);
      vi.setSystemTime(new Date(now.getTime() + 60 * 1000));
    });

    // Should update to "2m ago"
    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });

  it('updates every 30 seconds', async () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    render(<TimeAgoCell timestamp={oneMinuteAgo} />);

    expect(screen.getByText('1m ago')).toBeInTheDocument();

    // Advance by 30 seconds - should still show "1m ago"
    await act(async () => {
      vi.advanceTimersByTime(30 * 1000);
      vi.setSystemTime(new Date(now.getTime() + 30 * 1000));
    });
    expect(screen.getByText('1m ago')).toBeInTheDocument();

    // Advance by another 30 seconds - should update to "2m ago"
    await act(async () => {
      vi.advanceTimersByTime(30 * 1000);
      vi.setSystemTime(new Date(now.getTime() + 60 * 1000));
    });
    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000).toISOString();
    const { unmount } = render(<TimeAgoCell timestamp={oneMinuteAgo} />);

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    unmount();

    // Should have called clearInterval
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('handles invalid timestamp gracefully', () => {
    render(<TimeAgoCell timestamp="invalid-date" />);
    expect(screen.getByText('invalid date')).toBeInTheDocument();
  });

  it('displays hours correctly', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    render(<TimeAgoCell timestamp={threeHoursAgo} />);

    expect(screen.getByText('3h ago')).toBeInTheDocument();
  });

  it('displays days correctly', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    render(<TimeAgoCell timestamp={twoDaysAgo} />);

    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });

  it('displays "yesterday" for exactly 1 day ago', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    render(<TimeAgoCell timestamp={oneDayAgo} />);

    expect(screen.getByText('yesterday')).toBeInTheDocument();
  });

  it('displays formatted date for entries older than 7 days', () => {
    const now = new Date('2026-01-17T10:00:00Z');
    vi.setSystemTime(now);

    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    render(<TimeAgoCell timestamp={tenDaysAgo} />);

    // Should format as locale date (e.g., "Jan 7")
    const result = screen.getByText(/Jan \d+/);
    expect(result).toBeInTheDocument();
  });
});
