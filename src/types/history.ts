/**
 * History-specific types for the Network History Panel.
 *
 * These types extend the generated HistoryEntry with additional
 * intelligence and UI-specific fields.
 */

import type { HistoryEntry } from './generated/HistoryEntry';
import type { HttpMethod } from '@/utils/http-colors';

/**
 * Drift detection information.
 * Indicates when a request or response deviates from the spec.
 */
export interface DriftInfo {
  /** Whether drift is in request or response */
  type: 'request' | 'response';
  /** Field names that have drifted */
  fields: string[];
  /** Human-readable description of the drift */
  message: string;
}

/**
 * Intelligence signals for a history entry.
 * Tracks verification status, drift detection, and AI involvement.
 */
export interface IntelligenceInfo {
  /** Whether bound to an OpenAPI spec */
  boundToSpec: boolean;
  /** The spec operation ID if bound (e.g., "getUsers") */
  specOperation: string | null;
  /** Drift detection result, if any */
  drift: DriftInfo | null;
  /** Whether this request was AI-generated */
  aiGenerated: boolean;
  /** Whether the response has been verified against the spec */
  verified: boolean;
}

/**
 * Timing waterfall segments in milliseconds.
 * Used to visualize request timing breakdown.
 */
export interface TimingWaterfallSegments {
  /** DNS resolution time */
  dns: number;
  /** TCP connection time */
  connect: number;
  /** TLS/SSL handshake time */
  tls: number;
  /** Time waiting for server response (TTFB - connect - tls) */
  wait: number;
  /** Time downloading response body */
  download: number;
}

/**
 * Extended history entry with intelligence and computed fields.
 * Used by the Network History Panel for display.
 */
export interface NetworkHistoryEntry extends HistoryEntry {
  /** Intelligence signals (optional - may not be computed yet) */
  intelligence?: IntelligenceInfo;
  /** Computed waterfall segments (optional - derived from timing) */
  waterfallSegments?: TimingWaterfallSegments;
}

/**
 * History filter state for the Network History Panel.
 */
export interface HistoryFilters {
  /** URL search string */
  search: string;
  /** Filter by HTTP method */
  method: 'ALL' | HttpMethod;
  /** Filter by status code range */
  status: 'All' | '2xx' | '3xx' | '4xx' | '5xx';
  /** Filter by intelligence signals */
  intelligence: 'All' | 'Has Drift' | 'AI Generated' | 'Bound to Spec' | 'Verified';
}

/**
 * Default filter values.
 */
export const DEFAULT_HISTORY_FILTERS: HistoryFilters = {
  search: '',
  method: 'ALL',
  status: 'All',
  intelligence: 'All',
};

/**
 * Calculate waterfall segments from RequestTiming.
 * Returns undefined if timing data is insufficient.
 */
export function calculateWaterfallSegments(
  timing: HistoryEntry['response']['timing']
): TimingWaterfallSegments | undefined {
  const { total_ms, dns_ms, connect_ms, tls_ms, first_byte_ms } = timing;

  // Need at least total_ms to calculate anything useful
  if (total_ms <= 0) {
    return undefined;
  }

  // Use actual values or 0 for null segments
  const dns = dns_ms ?? 0;
  const connect = connect_ms ?? 0;
  const tls = tls_ms ?? 0;

  // Wait time is from connection established to first byte
  const connectionTime = dns + connect + tls;
  const wait = first_byte_ms !== null ? Math.max(0, first_byte_ms - connectionTime) : 0;

  // Download time is from first byte to completion
  const download = first_byte_ms !== null ? Math.max(0, total_ms - first_byte_ms) : 0;

  return { dns, connect, tls, wait, download };
}

/**
 * Signal types for visual indicators.
 */
export type SignalType = 'verified' | 'drift' | 'ai' | 'bound';

/**
 * Get signal type color class (Tailwind).
 */
export function getSignalColorClass(type: SignalType): string {
  switch (type) {
    case 'verified':
      return 'bg-signal-success';
    case 'drift':
      return 'bg-signal-warning';
    case 'ai':
      return 'bg-signal-ai';
    case 'bound':
      return 'bg-accent-blue';
  }
}
