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
  /** Additional CSS classes */
  className?: string;
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
          className={cn('w-full overflow-hidden', className)}
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
            {label !== null && label !== undefined && label !== '' && (
              <div className="px-3 py-0.5 bg-bg-surface/50 border-b border-border-subtle/30">
                <span
                  className={cn(
                    'text-[9px] font-mono uppercase tracking-widest text-text-muted',
                    active && prefersReducedMotion !== true && 'animate-pulse'
                  )}
                >
                  {label}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
