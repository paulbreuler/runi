/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Memory metrics data structure.
 * Matches the RamStats structure from Rust backend.
 */
export interface MemoryMetrics {
  /** Current RAM usage in MB */
  current: number;
  /** Running average RAM usage in MB */
  average: number;
  /** Peak RAM usage in MB */
  peak: number;
  /** Threshold in MB */
  threshold: number;
  /** Threshold as percentage of total RAM */
  thresholdPercent: number;
  /** Number of samples collected */
  samplesCount: number;
}

/**
 * Application metrics structure.
 * Designed to be extensible for future metric types (CPU, network, etc.).
 */
export interface AppMetrics {
  /** Memory usage metrics */
  memory?: MemoryMetrics;
  // Future: cpu?: CpuMetrics;
  // Future: network?: NetworkMetrics;
}
