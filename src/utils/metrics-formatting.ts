/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { MemoryMetrics } from '@/types/metrics';

/**
 * Format memory value in MB to human-readable string.
 *
 * @param mb - Memory value in megabytes
 * @returns Formatted string (e.g., "245.5 MB" or "1.2 GB")
 */
export function formatMemoryValue(mb: number): string {
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

/**
 * Format memory metrics to a display string.
 *
 * @param metrics - Memory metrics to format
 * @returns Formatted string showing current, average, and peak usage
 */
export function formatMemoryMetrics(metrics: MemoryMetrics): string {
  const current = formatMemoryValue(metrics.current);
  const average = formatMemoryValue(metrics.average);
  const peak = formatMemoryValue(metrics.peak);
  const threshold = formatMemoryValue(metrics.threshold);
  const thresholdPercent = (metrics.thresholdPercent * 100).toFixed(0);

  return `Current: ${current} | Average: ${average} | Peak: ${peak} | Threshold: ${threshold} (${thresholdPercent}%)`;
}
