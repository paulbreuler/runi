/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { formatMemoryValue, formatMemoryMetrics } from './metrics-formatting';
import type { MemoryMetrics } from '@/types/metrics';

describe('formatMemoryValue', () => {
  it('formats values less than 1024 MB as MB', () => {
    expect(formatMemoryValue(0)).toBe('0.0 MB');
    expect(formatMemoryValue(245.5)).toBe('245.5 MB');
    expect(formatMemoryValue(1023.9)).toBe('1023.9 MB');
  });

  it('formats values 1024 MB or greater as GB', () => {
    expect(formatMemoryValue(1024)).toBe('1.00 GB');
    expect(formatMemoryValue(1536)).toBe('1.50 GB');
    expect(formatMemoryValue(2048)).toBe('2.00 GB');
    expect(formatMemoryValue(2560.5)).toBe('2.50 GB');
  });
});

describe('formatMemoryMetrics', () => {
  it('formats memory metrics with all values', () => {
    const metrics: MemoryMetrics = {
      current: 245.5,
      average: 220.3,
      peak: 300.0,
      threshold: 1536.0,
      thresholdPercent: 0.4,
      samplesCount: 10,
    };

    const result = formatMemoryMetrics(metrics);
    expect(result).toBe(
      'Current: 245.5 MB | Average: 220.3 MB | Peak: 300.0 MB | Threshold: 1.50 GB (40%)'
    );
  });

  it('formats metrics with GB values', () => {
    const metrics: MemoryMetrics = {
      current: 2048.0,
      average: 1800.0,
      peak: 2500.0,
      threshold: 3072.0,
      thresholdPercent: 0.5,
      samplesCount: 20,
    };

    const result = formatMemoryMetrics(metrics);
    expect(result).toBe(
      'Current: 2.00 GB | Average: 1.76 GB | Peak: 2.44 GB | Threshold: 3.00 GB (50%)'
    );
  });

  it('handles zero values', () => {
    const metrics: MemoryMetrics = {
      current: 0,
      average: 0,
      peak: 0,
      threshold: 1536.0,
      thresholdPercent: 0.4,
      samplesCount: 0,
    };

    const result = formatMemoryMetrics(metrics);
    expect(result).toBe(
      'Current: 0.0 MB | Average: 0.0 MB | Peak: 0.0 MB | Threshold: 1.50 GB (40%)'
    );
  });
});
