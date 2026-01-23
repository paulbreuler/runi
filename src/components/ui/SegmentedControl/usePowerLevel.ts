/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import {
  OVER_9000_THRESHOLD,
  getTierConfig,
  deriveVisualFlags,
  BASE_TIER_CONFIG,
  MUI_TIER_CONFIG,
  type SaiyanAnimationState,
  type PowerLevelState,
  type TierConfig,
} from './config';

/**
 * Options interface for tier calculation.
 */
export interface SegmentOptionForPower {
  badge?: number;
}

/**
 * Calculates the power tier based on badge counts and thresholds.
 *
 * @param options - Array of options with optional badge counts
 * @returns The calculated tier (0-8)
 */
export function calculateTier(options: SegmentOptionForPower[]): number {
  const badges = options.filter((o) => o.badge !== undefined && o.badge > 0);
  const badgesOver9000 = badges.filter((o) => (o.badge ?? 0) >= OVER_9000_THRESHOLD).length;
  const totalBadges = badges.length;
  const totalPower = badges.reduce((sum, o) => sum + (o.badge ?? 0), 0);
  const allOver9000 = badgesOver9000 > 0 && badgesOver9000 === totalBadges;

  // Advanced tiers: all badges exceed threshold + total power thresholds
  if (allOver9000) {
    if (totalPower >= 100000) {
      return 8;
    }
    if (totalPower >= 80000) {
      return 7;
    }
    if (totalPower >= 50000) {
      return 6;
    }
    return 5;
  }

  // Standard tiers: based on count of badges exceeding threshold
  return Math.min(badgesOver9000, 4);
}

/**
 * State machine hook for power level animations.
 *
 * This hook manages the complete animation lifecycle:
 * - idle: No transformation - normal UI
 * - powering_up: Transitioning to tier (1.5s celebratory animation)
 * - finale: Burst effect for tier 5+ ascension
 * - sustained: Brief "powered" state (0.5s)
 * - settling: Fading back to idle (0.3s)
 *
 * @param options - Array of options with optional badge counts
 * @param prefersReducedMotion - Whether the user prefers reduced motion
 * @returns PowerLevelState with tier, animation state, config, and visual flags
 */
export function usePowerLevel(
  options: SegmentOptionForPower[],
  prefersReducedMotion: boolean | null
): PowerLevelState {
  // Calculate tier from options
  const tier = React.useMemo(() => calculateTier(options), [options]);

  // Animation state machine
  const [animationState, setAnimationState] = React.useState<SaiyanAnimationState>('idle');
  const prevTierRef = React.useRef(tier);
  const timersRef = React.useRef<NodeJS.Timeout[]>([]);

  // Clear all pending timers
  const clearTimers = React.useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // State transitions
  React.useEffect((): (() => void) | undefined => {
    if (tier !== prevTierRef.current && prefersReducedMotion !== true) {
      clearTimers();

      if (tier > 0) {
        // Animate for any tier > 0 (works for both increasing and decreasing)
        setAnimationState('powering_up');

        // Check if we're INCREASING to tier 5+ from a lower tier
        // Only trigger grand finale when ascending, not descending
        const wasLowerTier = prevTierRef.current < 5;
        const isNowAdvancedTier = tier >= 5;
        const isAscending = tier > prevTierRef.current;

        if (wasLowerTier && isNowAdvancedTier && isAscending) {
          // Grand finale for reaching tier 5+ (ascending only)
          timersRef.current.push(
            setTimeout(() => {
              setAnimationState('finale');
            }, 300),
            setTimeout(() => {
              setAnimationState('sustained');
            }, 2500),
            setTimeout(() => {
              setAnimationState('settling');
            }, 2800),
            setTimeout(() => {
              setAnimationState('idle');
            }, 3100)
          );
        } else {
          // Standard animation (for both power-up and power-down to non-zero tiers)
          timersRef.current.push(
            setTimeout(() => {
              setAnimationState('sustained');
            }, 1500),
            setTimeout(() => {
              setAnimationState('settling');
            }, 1800),
            setTimeout(() => {
              setAnimationState('idle');
            }, 2100)
          );
        }
      } else {
        // Going to tier 0: instant reset
        setAnimationState('idle');
      }

      prevTierRef.current = tier;
    }

    return clearTimers;
  }, [tier, prefersReducedMotion, clearTimers]);

  // Get tier config
  const config = getTierConfig(tier);

  // Derive visual flags from animation state
  const visualFlags = deriveVisualFlags(animationState, tier);

  // Determine effect color based on animation state
  const getEffectColor = (): string => {
    if (animationState === 'finale') {
      return MUI_TIER_CONFIG.color;
    }
    if (animationState !== 'idle') {
      return config.color;
    }
    return BASE_TIER_CONFIG.color;
  };

  // Compute derived states
  const isFinale = animationState === 'finale';
  const isSettling = animationState === 'settling';

  return {
    tier,
    animationState,
    config: animationState !== 'idle' ? config : BASE_TIER_CONFIG,
    effectColor: getEffectColor(),
    visualFlags,
    isFinale,
    isSettling,
  };
}

/**
 * Context value for child components to access tier info.
 */
export interface PowerLevelContextValue {
  tier: number;
  config: TierConfig;
  animationState: SaiyanAnimationState;
  visualFlags: {
    shouldShowEffects: boolean;
    shouldAnimateEffects: boolean;
    shouldShowTierColors: boolean;
    shouldShowGlow: boolean;
  };
  isSettling: boolean;
}

/**
 * Context for sharing power level state with child components.
 */
export const PowerLevelContext = React.createContext<PowerLevelContextValue | null>(null);

/**
 * Hook to access power level context.
 * Returns null if used outside of a PowerLevelContext provider.
 */
export function usePowerLevelContext(): PowerLevelContextValue | null {
  return React.useContext(PowerLevelContext);
}
