/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { motion } from 'motion/react';

export interface PulsingGlowProps {
  /** Animation state */
  state: 'init' | 'tracking' | 'idle';
  /** Glow color (default: accent-blue) */
  color?: string;
  /** Glow intensity multiplier (default: 1) */
  intensity?: number;
  /** Glow size in pixels (default: 8) */
  size?: number;
  /** Child elements to wrap */
  children: React.ReactNode;
  /** Optional test ID */
  'data-testid'?: string;
}

/**
 * Pulsing glow animation component that wraps elements with animated glow effect.
 *
 * States:
 * - init: Strong pulse (1.5s cycle) - for initializing state
 * - tracking: Faint pulse (3s cycle) - for active tracking
 * - idle: No animation - for inactive state
 *
 * Extracted and simplified from SegmentedControl EnergyRing pattern.
 */
export const PulsingGlow: React.FC<PulsingGlowProps> = ({
  state,
  color = '#3b82f6', // accent-blue
  intensity = 1,
  size = 8,
  children,
  'data-testid': testId = 'pulsing-glow',
}) => {
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If idle or reduced motion, no animation
  if (state === 'idle' || prefersReducedMotion) {
    return (
      <div
        className="relative inline-flex items-center justify-center"
        data-testid={testId}
        data-state={state}
      >
        {children}
      </div>
    );
  }

  // Animation configs based on state
  const configs = {
    init: {
      opacity: [0.6, 1.0, 0.6],
      scale: [0.98, 1.02, 0.98],
      duration: 1.5,
      glowSize: size * intensity * 1.5, // Stronger glow for init
    },
    tracking: {
      opacity: [0.85, 0.95, 0.85],
      scale: [0.99, 1.01, 0.99],
      duration: 3.0,
      glowSize: size * intensity * 0.6, // Fainter glow for tracking
    },
  };

  const config = configs[state];

  return (
    <div
      className="relative inline-flex items-center justify-center"
      data-testid={testId}
      data-state={state}
      data-testid-init={state === 'init' ? `${testId}-init` : undefined}
      data-testid-tracking={state === 'tracking' ? `${testId}-tracking` : undefined}
    >
      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `0 0 ${String(config.glowSize)}px ${color}, inset 0 0 ${String(config.glowSize * 0.5)}px ${color}40`,
        }}
        animate={{
          opacity: config.opacity,
          scale: config.scale,
        }}
        transition={{
          duration: config.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      {children}
    </div>
  );
};
