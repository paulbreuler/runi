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
  'data-test-id'?: string;
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
  color, // Default handled below to use CSS variable
  intensity = 1,
  size = 8,
  children,
  'data-test-id': testId = 'pulsing-glow',
}) => {
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Use CSS variable for default color (semantic token)
  const glowColor = color ?? 'var(--color-accent-blue)';

  // If idle or reduced motion, no animation
  if (state === 'idle' || prefersReducedMotion) {
    return (
      <div
        className="relative inline-flex items-center justify-center"
        data-test-id={testId}
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
      scale: [0.95, 1.05, 0.95],
      duration: 1.2,
      glowSize: size * intensity * 2.0, // Strong glow for init
    },
    tracking: {
      opacity: [0.5, 1.0, 0.5],
      scale: [0.97, 1.03, 0.97],
      duration: 1.5, // Faster pulse (was 2.5s)
      glowSize: size * intensity * 1.5, // Brighter glow (was 1.0)
    },
  };

  const config = configs[state];

  return (
    <div
      className="relative inline-flex items-center justify-center"
      data-test-id={testId}
      data-state={state}
      data-test-id-init={state === 'init' ? `${testId}-init` : undefined}
      data-test-id-tracking={state === 'tracking' ? `${testId}-tracking` : undefined}
    >
      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: `0 0 ${String(config.glowSize)}px ${glowColor}, inset 0 0 ${String(config.glowSize * 0.5)}px ${glowColor}`,
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
