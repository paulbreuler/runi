/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { motion, useReducedMotion } from 'motion/react';
import { Circle } from 'lucide-react';
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
  { key: 'dns', label: 'DNS', colorClass: 'bg-signal-ai', legendColorClass: 'text-signal-ai' },
  {
    key: 'connect',
    label: 'Connect',
    colorClass: 'bg-signal-warning',
    legendColorClass: 'text-signal-warning',
  },
  { key: 'tls', label: 'TLS', colorClass: 'bg-accent-blue', legendColorClass: 'text-accent-blue' },
  {
    key: 'wait',
    label: 'Wait',
    colorClass: 'bg-signal-success',
    legendColorClass: 'text-signal-success',
  },
  {
    key: 'download',
    label: 'Download',
    colorClass: 'bg-bg-raised',
    legendColorClass: 'text-bg-raised',
  },
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
        data-test-id="timing-waterfall-empty"
        className={cn('w-full bg-bg-raised/50 rounded-full', height)}
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
        data-test-id="timing-waterfall"
        className={cn('w-full flex rounded-full overflow-hidden bg-bg-raised/30', height)}
      >
        {segmentConfig.map(({ key, colorClass }, index) => {
          const ms = segments[key as keyof TimingWaterfallSegments];
          const widthPercent = getWidth(ms);
          const showLabel = showInlineLabels && widthPercent >= inlineLabelMinWidth;
          return (
            <motion.div
              key={key}
              data-test-id={`timing-${key}`}
              className={cn(
                colorClass as string,
                showLabel && 'flex justify-center items-center overflow-hidden'
              )}
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
                <span className="text-[10px] font-mono font-bold text-bg-app whitespace-nowrap px-1">
                  {ms}ms
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Compact total display */}
      {compact && (
        <span className="text-xs font-mono text-text-secondary text-right">{totalMs}ms</span>
      )}

      {/* Full legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] mt-1">
          {segmentConfig.map(({ key, label, legendColorClass }) => {
            const ms = segments[key as keyof TimingWaterfallSegments];
            if (ms <= 0) {
              return null;
            }
            return (
              <div key={key} className="flex items-center gap-1.5">
                <Circle
                  size={8}
                  className={cn('shrink-0', legendColorClass as string)}
                  fill="currentColor"
                  aria-hidden="true"
                />
                <span className="text-text-muted">{label}</span>
                <span className="font-mono text-text-secondary">{ms}ms</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
