/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import type { SignalType } from '@/types/history';

interface SignalDotProps {
  /** The type of signal to display */
  type: SignalType;
  /** Size of the dot: sm (default), md, lg */
  size?: 'sm' | 'md' | 'lg';
  /** Tooltip text shown on hover */
  tooltip?: string;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
} as const;

const signalConfig = {
  verified: {
    bg: 'bg-signal-success',
    glow: 'shadow-[0_0_4px_1px] shadow-signal-success/40',
    pulse: false,
  },
  drift: {
    bg: 'bg-signal-warning',
    glow: 'shadow-[0_0_4px_1px] shadow-signal-warning/40',
    pulse: true,
  },
  ai: {
    bg: 'bg-signal-ai',
    glow: 'shadow-[0_0_4px_1px] shadow-signal-ai/40',
    pulse: false,
  },
  bound: {
    bg: 'bg-accent-blue',
    glow: 'shadow-[0_0_4px_1px] shadow-accent-blue/40',
    pulse: false,
  },
} as const;

/**
 * Visual signal dot for intelligence indicators.
 * Used to show verification status, drift detection, AI involvement, and spec binding.
 */
export const SignalDot = ({ type, size = 'sm', tooltip }: SignalDotProps): React.JSX.Element => {
  const shouldReduceMotion = useReducedMotion();
  const config = signalConfig[type];

  return (
    <motion.span
      data-testid={`signal-dot-${type}`}
      className={cn(
        'inline-block rounded-full cursor-pointer',
        sizeClasses[size],
        config.bg,
        config.glow,
        config.pulse && 'animate-pulse'
      )}
      whileHover={shouldReduceMotion === true ? undefined : { scale: 1.3 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      title={tooltip}
      aria-label={tooltip}
    />
  );
};
