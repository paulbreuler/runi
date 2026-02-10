/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

interface VigilanceMonitorProps {
  /** Whether the monitor is active */
  active: boolean;
  /** Label describing the current check (e.g., "Verifying request against user.yaml...") */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * VigilanceMonitor - State transparency component for background checks.
 * Shows a progress bar with a semantic label to keep users informed.
 * Follows Zen design principles: minimal, informative, and deliberate.
 */
export const VigilanceMonitor = ({
  active,
  label,
  className,
}: VigilanceMonitorProps): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'linear' }}
          className={cn('w-full overflow-hidden', className)}
          data-test-id="vigilance-monitor"
        >
          <div className="flex flex-col relative">
            <div className="vigilance-progress w-full relative z-10" />
            <div
              className="absolute inset-0 bg-repeat-x opacity-10 pointer-events-none z-20"
              style={{
                backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 50%)',
                backgroundSize: '100% 2px',
              }}
            />
            {label !== undefined && label !== '' && (
              <div className="px-3 py-0.5 bg-bg-surface/50 border-b border-border-subtle/30">
                <span
                  className={cn(
                    'text-[9px] font-mono uppercase tracking-widest text-text-muted',
                    prefersReducedMotion !== true && 'animate-pulse'
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
