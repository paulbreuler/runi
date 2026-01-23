/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import type { TimingWaterfallSegments } from '@/types/history';

interface TimingWaterfallProps {
  /** Timing segments in milliseconds */
  segments?: TimingWaterfallSegments;
  /** Total request time in milliseconds */
  totalMs: number;
  /** Show legend with segment names and ms values */
  showLegend?: boolean;
  /** Show compact version with just total time */
  compact?: boolean;
  /** Custom height class (default: h-2) */
  height?: string;
  /** Show inline timing labels inside segments when large enough (requires taller height) */
  showInlineLabels?: boolean;
  /** Minimum width percentage for showing inline labels (default: 15) */
  inlineLabelMinWidth?: number;
}

const segmentConfig = [
  { key: 'dns', label: 'DNS', color: 'bg-accent-purple' },
  { key: 'connect', label: 'Connect', color: 'bg-signal-warning' },
  { key: 'tls', label: 'TLS', color: 'bg-signal-ai' },
  { key: 'wait', label: 'Wait', color: 'bg-signal-success' },
  { key: 'download', label: 'Download', color: 'bg-accent-blue' },
] as const;

/**
 * Visual waterfall showing HTTP request timing breakdown.
 * Segments: DNS → Connect → TLS → Wait (TTFB) → Download
 */
export const TimingWaterfall = ({
  segments,
  totalMs,
  showLegend = false,
  compact = false,
  height = 'h-2',
  showInlineLabels = false,
  inlineLabelMinWidth = 15,
}: TimingWaterfallProps): React.JSX.Element => {
  const shouldReduceMotion = useReducedMotion();

  // Empty state when no segments
  if (segments === undefined) {
    return (
      <div
        data-testid="timing-waterfall-empty"
        className={cn('w-full bg-bg-raised rounded-full', height)}
      />
    );
  }

  // Calculate percentage width for each segment
  const getWidth = (ms: number): number => {
    if (totalMs <= 0 || ms <= 0) {
      return 0;
    }
    return (ms / totalMs) * 100;
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Waterfall bar */}
      <div
        data-testid="timing-waterfall"
        className={cn('w-full flex rounded-full overflow-hidden bg-bg-raised', height)}
      >
        {segmentConfig.map(({ key, color }, index) => {
          const ms = segments[key as keyof TimingWaterfallSegments];
          const widthPercent = getWidth(ms);
          const showLabel = showInlineLabels && widthPercent >= inlineLabelMinWidth;
          return (
            <motion.div
              key={key}
              data-testid={`timing-${key}`}
              className={cn(color, showLabel && 'flex justify-center items-center overflow-hidden')}
              initial={
                shouldReduceMotion === true
                  ? { width: `${String(widthPercent)}%` }
                  : { width: '0%' }
              }
              animate={{ width: `${String(widthPercent)}%` }}
              transition={
                shouldReduceMotion === true
                  ? { duration: 0 }
                  : { duration: 0.4, delay: index * 0.05, ease: 'easeOut' }
              }
              title={`${key}: ${String(ms)}ms`}
            >
              {showLabel && (
                <span className="text-[10px] font-mono font-medium text-white/90 whitespace-nowrap">
                  {ms}ms
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Compact total display */}
      {compact && <span className="text-xs font-mono text-text-muted text-right">{totalMs}ms</span>}

      {/* Full legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-3 text-xs">
          {segmentConfig.map(({ key, label, color }) => {
            const ms = segments[key as keyof TimingWaterfallSegments];
            if (ms <= 0) {
              return null;
            }
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', color)} />
                <span className="text-text-secondary">{label}</span>
                <span className="font-mono text-text-muted">{ms}ms</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
