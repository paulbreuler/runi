/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

interface VigilanceMonitorProps {
  /** Whether the monitor strip is visible (controls mount/unmount with animated enter/exit) */
  visible: boolean;
  /** Whether the progress bar animates (executing/verifying) */
  active: boolean;
  /** Label describing the current status (supports ReactNode for colored segments) */
  label?: React.ReactNode;
  /** Response status code */
  status?: number;
  /** Response status text */
  statusText?: string;
  /** Response size in bytes */
  size?: number;
  /** Response duration in ms */
  duration?: number;
  /** Callback when timing is clicked */
  onTimingClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format bytes to human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i] ?? 'B';
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${size}`;
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return 'text-signal-success';
  }
  if (status >= 300 && status < 400) {
    return 'text-accent-blue';
  }
  if (status >= 400 && status < 500) {
    return 'text-signal-warning';
  }
  if (status >= 500) {
    return 'text-signal-error';
  }
  return 'text-text-muted';
}

/**
 * VigilanceMonitor - State transparency component for background checks.
 * Shows a progress bar with a semantic label to keep users informed.
 * Persists after first use as a static idle strip (progressive disclosure).
 * Follows Zen design principles: minimal, informative, and deliberate.
 */
export const VigilanceMonitor = ({
  visible,
  active,
  label,
  status,
  statusText,
  size,
  duration,
  onTimingClick,
  className,
}: VigilanceMonitorProps): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'linear' }}
          className={cn('w-full overflow-hidden mt-[-1px]', className)}
          data-test-id="vigilance-monitor"
        >
          <div className="flex flex-col relative">
            <div
              className={cn(
                'w-full relative z-10',
                active ? 'vigilance-progress' : 'vigilance-progress-idle'
              )}
            />
            {active && (
              <div
                className="absolute inset-0 bg-repeat-x opacity-10 pointer-events-none z-20"
                style={{
                  backgroundImage:
                    'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 50%)',
                  backgroundSize: '100% 2px',
                }}
              />
            )}
            <div className="px-3 py-0.5 bg-bg-surface/50 border-b border-border-subtle/30 min-h-[18px] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {label !== null && label !== undefined && label !== '' && (
                  <span
                    className={cn(
                      'text-[9px] font-mono uppercase tracking-widest text-text-muted',
                      active && prefersReducedMotion !== true && 'animate-pulse'
                    )}
                  >
                    {label}
                  </span>
                )}
                {status !== undefined && (
                  <span className={cn('text-[9px] font-mono font-bold', getStatusColor(status))}>
                    {status} {statusText}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-[9px] font-mono text-text-muted uppercase tracking-wider">
                {size !== undefined && <span>{formatBytes(size)}</span>}
                {duration !== undefined && (
                  <button
                    type="button"
                    onClick={onTimingClick}
                    className="hover:text-text-primary transition-colors cursor-pointer outline-none focus-visible:text-text-primary"
                    title="View timing waterfall"
                  >
                    {duration}ms
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
