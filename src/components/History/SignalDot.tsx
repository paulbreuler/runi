/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck, AlertTriangle, Sparkles, Link } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { SignalType } from '@/types/history';

interface SignalDotProps {
  /** The type of signal to display */
  type: SignalType;
  /** Size of the icon: sm (default), md, lg */
  size?: 'sm' | 'md' | 'lg';
  /** Tooltip text shown on hover */
  tooltip?: string;
}

const iconSizes = {
  sm: 10,
  md: 12,
  lg: 14,
} as const;

const signalConfig = {
  verified: {
    color: 'text-signal-success',
    Icon: ShieldCheck,
    pulse: false,
  },
  drift: {
    color: 'text-signal-warning',
    Icon: AlertTriangle,
    pulse: true,
  },
  ai: {
    color: 'text-signal-ai',
    Icon: Sparkles,
    pulse: false,
  },
  bound: {
    color: 'text-accent-blue',
    Icon: Link,
    pulse: false,
  },
} as const;

/**
 * Visual signal icon for intelligence indicators.
 * Used to show verification status, drift detection, AI involvement, and spec binding.
 */
export const SignalDot = ({ type, size = 'sm', tooltip }: SignalDotProps): React.JSX.Element => {
  const shouldReduceMotion = useReducedMotion();
  const config = signalConfig[type];
  const { Icon } = config;

  return (
    <motion.span
      data-test-id={`signal-icon-${type}`}
      className={cn(
        'inline-flex items-center justify-center shrink-0',
        config.color,
        config.pulse && 'animate-pulse'
      )}
      whileHover={shouldReduceMotion === true ? undefined : { scale: 1.3 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      title={tooltip}
      aria-label={tooltip}
    >
      <Icon size={iconSizes[size]} />
    </motion.span>
  );
};
