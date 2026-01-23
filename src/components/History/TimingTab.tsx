/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import { TimingWaterfall } from './TimingWaterfall';
import type { TimingWaterfallSegments, IntelligenceInfo } from '@/types/history';

interface TimingTabProps {
  /** Timing segments in milliseconds */
  segments?: TimingWaterfallSegments;
  /** Total request time in milliseconds */
  totalMs: number;
  /** Whether this is a streaming request */
  isStreaming?: boolean;
  /** Whether this request was blocked */
  isBlocked?: boolean;
  /** Throttle rate in KB/s (if throttled) */
  throttleRateKbps?: number;
  /** Intelligence signals for the request */
  intelligence?: IntelligenceInfo;
}

/**
 * Checks if any intelligence signals are present.
 */
function hasIntelligenceSignals(intelligence: IntelligenceInfo | undefined): boolean {
  if (intelligence === undefined) {
    return false;
  }
  return (
    intelligence.verified ||
    intelligence.drift !== null ||
    intelligence.aiGenerated ||
    intelligence.boundToSpec
  );
}

/**
 * TimingTab displays timing waterfall visualization with streaming, blocked,
 * throttled states, and intelligence signals for expanded panel view.
 *
 * @example
 * ```tsx
 * <TimingTab
 *   segments={{ dns: 10, connect: 20, tls: 30, wait: 50, download: 40 }}
 *   totalMs={150}
 *   isStreaming={false}
 *   intelligence={{ verified: true, drift: null, aiGenerated: false, boundToSpec: true, specOperation: 'getUsers' }}
 * />
 * ```
 */
export const TimingTab = ({
  segments,
  totalMs,
  isStreaming = false,
  isBlocked = false,
  throttleRateKbps,
  intelligence,
}: TimingTabProps): React.JSX.Element => {
  const shouldReduceMotion = useReducedMotion();

  // Blocked state takes precedence
  if (isBlocked) {
    return (
      <section aria-label="Timing" role="region" className="space-y-4">
        <div
          data-testid="blocked-message"
          role="alert"
          className={cn(
            'p-4 rounded-lg border text-center',
            'bg-signal-error/10 border-signal-error/30'
          )}
        >
          <span className="font-semibold text-signal-error">⊘ Request Blocked</span>
          <p className="mt-2 text-sm text-text-secondary">
            This request was blocked by a filter rule
          </p>
        </div>
      </section>
    );
  }

  const showIntelligence = hasIntelligenceSignals(intelligence);

  return (
    <section aria-label="Timing" role="region" className="space-y-5">
      {/* Header with streaming indicator and total time */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Timing Waterfall
        </span>
        <div className="flex items-center gap-3">
          {isStreaming && (
            <span
              data-testid="streaming-indicator"
              className="flex items-center gap-1.5 text-xs text-signal-success"
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full bg-signal-success',
                  shouldReduceMotion !== true && 'animate-pulse'
                )}
              />
              STREAMING
            </span>
          )}
          <span className="text-sm font-mono text-text-primary">{totalMs}ms</span>
        </div>
      </div>

      {/* Waterfall visualization */}
      <TimingWaterfall
        segments={segments}
        totalMs={totalMs}
        showLegend
        height="h-7"
        showInlineLabels
      />

      {/* Throttle indicator */}
      {throttleRateKbps !== undefined && (
        <div
          data-testid="throttle-indicator"
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg border',
            'bg-signal-warning/10 border-signal-warning/30 text-signal-warning'
          )}
        >
          <span className="text-sm">⏱ Throttled to {throttleRateKbps} KB/s</span>
        </div>
      )}

      {/* Intelligence signals section */}
      {showIntelligence && intelligence !== undefined && (
        <div data-testid="intelligence-signals-section" className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Intelligence Signals
          </span>
          <div className="flex flex-wrap gap-2">
            {intelligence.verified && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm',
                  'bg-signal-success/10 border border-signal-success/30 text-signal-success'
                )}
              >
                ✓ Verified against spec
              </span>
            )}
            {intelligence.boundToSpec && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm',
                  'bg-accent-blue/10 border border-accent-blue/30 text-accent-blue'
                )}
              >
                ⎯ Bound to{' '}
                {intelligence.specOperation !== null && intelligence.specOperation !== '' && (
                  <code className="font-mono">{intelligence.specOperation}</code>
                )}
              </span>
            )}
            {intelligence.drift !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm',
                  'bg-signal-warning/10 border border-signal-warning/30 text-signal-warning'
                )}
              >
                ! {intelligence.drift.message}
              </span>
            )}
            {intelligence.aiGenerated && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm',
                  'bg-signal-ai/10 border border-signal-ai/30 text-signal-ai'
                )}
              >
                ✦ AI Generated
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
