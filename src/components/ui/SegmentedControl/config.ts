/**
 * Configuration and types for SegmentedControl power-level animations.
 *
 * This module contains the tier configuration system that powers the
 * visual effects when badge counts exceed certain thresholds.
 */

export const OVER_9000_THRESHOLD = 9000;

// SVG energy edge paths for path morphing effect
// Paths trace the top edge, morphing from smooth to spiky
// viewBox is "0 0 100 10" - 100 units wide, 10 units tall
export const ENERGY_PATHS = {
  // Tier 1: Gentle wave, barely perceptible
  calm: 'M0,8 Q25,7 50,8 Q75,7 100,8',
  // Tier 2: More pronounced undulation
  rising: 'M0,7 Q15,5 30,8 Q45,4 60,8 Q75,5 90,7 L100,8',
  // Tier 3: Starting to spike
  spiky: 'M0,6 L10,8 L20,3 L30,7 L40,2 L50,8 L60,3 L70,7 L80,2 L90,8 L100,6',
  // Tier 4: Aggressive spikes
  aggressive: 'M0,5 L8,8 L15,1 L22,7 L30,0 L38,8 L45,2 L52,7 L60,0 L68,8 L75,1 L82,7 L90,0 L100,5',
  // Tier 5+/Finale: Maximum chaos
  chaos:
    'M0,4 L5,8 L10,0 L15,6 L20,1 L25,8 L30,0 L35,7 L40,1 L45,8 L50,0 L55,6 L60,1 L65,8 L70,0 L75,7 L80,1 L85,8 L90,0 L95,6 L100,4',
} as const;

export interface TierConfig {
  name: string;
  color: string; // Primary color
  glow: string; // Glow rgba
  path: string; // SVG path shape
  duration: number; // Animation speed (faster at higher tiers)
  glowSize: number; // Drop shadow size
  sparkColor?: string; // Optional secondary color for electric sparks
}

/**
 * Tier configurations - single source of truth for all tier properties
 *
 * Tier progression:
 * - Tiers 1-4: Based on COUNT of badges over 9000
 * - Tiers 5-8: Based on TOTAL POWER LEVEL once all badges are over 9000
 */
export const SAIYAN_TIERS: Record<number, TierConfig> = {
  0: {
    name: 'Base',
    color: 'transparent',
    glow: 'transparent',
    path: ENERGY_PATHS.calm,
    duration: 2.0,
    glowSize: 0,
  },
  1: {
    name: 'Saiyan',
    color: '#fbbf24', // amber-400
    glow: 'rgba(251, 191, 36, 0.3)',
    path: ENERGY_PATHS.calm,
    duration: 2.0,
    glowSize: 4,
  },
  2: {
    name: 'Super Saiyan',
    color: '#facc15', // yellow-400
    glow: 'rgba(250, 204, 21, 0.4)',
    path: ENERGY_PATHS.rising,
    duration: 1.5,
    glowSize: 6,
  },
  3: {
    name: 'Super Saiyan 2',
    color: '#fde047', // yellow-300
    glow: 'rgba(253, 224, 71, 0.5)',
    path: ENERGY_PATHS.spiky,
    duration: 1.0,
    glowSize: 8,
    sparkColor: '#60a5fa', // Blue electric sparks
  },
  4: {
    name: 'Super Saiyan 3',
    color: '#fef08a', // yellow-200
    glow: 'rgba(254, 240, 138, 0.6)',
    path: ENERGY_PATHS.aggressive,
    duration: 0.7,
    glowSize: 12,
  },
  5: {
    name: 'Super Saiyan God',
    color: '#f87171', // red-400
    glow: 'rgba(248, 113, 113, 0.5)',
    path: ENERGY_PATHS.chaos,
    duration: 0.5,
    glowSize: 16,
  },
  6: {
    name: 'Super Saiyan Blue',
    color: '#22d3d1', // cyan-400
    glow: 'rgba(34, 211, 209, 0.5)',
    path: ENERGY_PATHS.chaos,
    duration: 0.4,
    glowSize: 18,
  },
  7: {
    name: 'Ultra Instinct Sign',
    color: '#a78bfa', // violet-400 (ethereal blue-violet aura)
    glow: 'rgba(167, 139, 250, 0.5)',
    path: ENERGY_PATHS.chaos,
    duration: 0.35,
    glowSize: 20,
    sparkColor: '#c4b5fd', // violet-300 (lighter violet sparks)
  },
  8: {
    name: 'Mastered Ultra Instinct',
    color: '#e5e7eb', // gray-200 (silver/white)
    glow: 'rgba(229, 231, 235, 0.7)',
    path: ENERGY_PATHS.chaos,
    duration: 0.3,
    glowSize: 24,
  },
};

// Base tier config - guaranteed to exist (used as fallback)
export const BASE_TIER_CONFIG: TierConfig = {
  name: 'Base',
  color: 'transparent',
  glow: 'transparent',
  path: ENERGY_PATHS.calm,
  duration: 2.0,
  glowSize: 0,
};

// MUI (Mastered Ultra Instinct) tier config - used for finale effects
export const MUI_TIER_CONFIG: TierConfig = {
  name: 'Mastered Ultra Instinct',
  color: '#e5e7eb',
  glow: 'rgba(229, 231, 235, 0.7)',
  path: ENERGY_PATHS.chaos,
  duration: 0.3,
  glowSize: 24,
};

// Helper function to safely get tier config with guaranteed return type
export const getTierConfig = (tier: number): TierConfig => SAIYAN_TIERS[tier] ?? BASE_TIER_CONFIG;

/**
 * Animation phase represents the current phase of the power-up animation cycle.
 *
 * State machine:
 * - idle: No transformation - normal UI, all effects OFF
 * - animating: Actively playing power-up animation (powering_up or finale)
 * - sustained: Brief "powered" state showing tier color (after animation, before fade)
 * - settling: Fading back to idle (dissipation effects)
 */
export type AnimationPhase = 'idle' | 'animating' | 'sustained' | 'settling';

/**
 * Internal animation state for the state machine.
 * Maps to AnimationPhase but with more granular states for timing.
 */
export type SaiyanAnimationState =
  | 'idle' // No transformation - normal UI
  | 'powering_up' // Transitioning to higher tier (1.5s celebratory animation)
  | 'sustained' // Brief "powered" state showing tier color (0.5s)
  | 'finale' // Ultra Instinct burst (2.5s special animation)
  | 'settling'; // Fading back to idle (0.3s transition)

/**
 * Visual flags derived from the animation phase.
 * These are the authoritative source for what should be visible.
 */
export interface VisualFlags {
  /** Energy edges, rings visible? */
  shouldShowEffects: boolean;
  /** Effects actively animating (morphing, pulsing)? */
  shouldAnimateEffects: boolean;
  /** Apply tier colors to text/badges? */
  shouldShowTierColors: boolean;
  /** Aura glow visible? */
  shouldShowGlow: boolean;
}

/**
 * Derives visual flags from the animation state and tier.
 * This is the single source of truth for what should be visible at each state.
 */
export const deriveVisualFlags = (
  animationState: SaiyanAnimationState,
  tier: number
): VisualFlags => {
  switch (animationState) {
    case 'idle':
      return {
        shouldShowEffects: false,
        shouldAnimateEffects: false,
        shouldShowTierColors: false,
        shouldShowGlow: false,
      };
    case 'powering_up':
    case 'finale':
      return {
        shouldShowEffects: true,
        shouldAnimateEffects: true,
        shouldShowTierColors: true,
        shouldShowGlow: true,
      };
    case 'sustained':
      return {
        shouldShowEffects: true,
        shouldAnimateEffects: false,
        shouldShowTierColors: true, // Keep colors during sustained!
        shouldShowGlow: tier >= 2, // Reduced glow
      };
    case 'settling':
      return {
        shouldShowEffects: true, // For particles/edge fade
        shouldAnimateEffects: false,
        shouldShowTierColors: false, // Reset colors during settling!
        shouldShowGlow: false, // No glow during settling
      };
  }
};

/**
 * Complete power level state returned by the state machine hook.
 */
export interface PowerLevelState {
  /** Current power tier (0-8) */
  tier: number;
  /** Current animation state */
  animationState: SaiyanAnimationState;
  /** Current tier's config */
  config: TierConfig;
  /** Current display color for effects */
  effectColor: string;
  /** Visual flags derived from animation state */
  visualFlags: VisualFlags;
  /** Is in finale state? */
  isFinale: boolean;
  /** Is in settling state? (for dissipation effects) */
  isSettling: boolean;
}

/**
 * Power level thresholds for god-tier forms (tier 5+)
 *
 * Threshold values:
 * - Tier 5 (SSJ God): 36,000 (4 x 9,000 minimum)
 * - Tier 6 (SSJ Blue): 50,000
 * - Tier 7 (UI Sign): 80,000
 * - Tier 8 (MUI): 100,000
 */
export const GOD_TIER_THRESHOLDS = {
  TIER_5: 36000,
  TIER_6: 50000,
  TIER_7: 80000,
  TIER_8: 100000,
} as const;

// ============================================================================
// SETTLING CONFIGURATION - Tier-scaled explosive dispel effects
// ============================================================================

/**
 * Settling configuration for tier-specific dispel effects.
 * Higher tiers have more dramatic "explosion" when powering down.
 */
export interface SettlingConfig {
  /** Number of particles (24 at T1 → 64 at T8) */
  particleCount: number;
  /** Distance multiplier for particle travel (1.0x at T1 → 2.2x at T8) */
  particleDistance: number;
  /** Shockwave ring scale (1.3 at T1 → 2.2 at T8) */
  shockwaveScale: number;
  /** Flash opacity at settling start (0.3 at T1 → 0.6 at T8) */
  flashOpacity: number;
  /** Whether to show secondary ring (T3+) */
  hasSecondaryRing: boolean;
  /** Whether to show edge flares (T5+) */
  hasEdgeFlares: boolean;
  /** Number of edge flares (0 at T1-4, 4-8 at T5+) */
  flareCount: number;
  /** Burst flash duration in ms */
  flashDuration: number;
  /** Shockwave duration in ms */
  shockwaveDuration: number;
}

/**
 * Tier-specific settling configurations.
 * Each tier has progressively more intense dispel effects.
 */
export const SETTLING_CONFIG: Record<number, SettlingConfig> = {
  0: {
    particleCount: 0,
    particleDistance: 0,
    shockwaveScale: 1.0,
    flashOpacity: 0,
    hasSecondaryRing: false,
    hasEdgeFlares: false,
    flareCount: 0,
    flashDuration: 0,
    shockwaveDuration: 0,
  },
  1: {
    particleCount: 24,
    particleDistance: 1.0,
    shockwaveScale: 1.3,
    flashOpacity: 0.3,
    hasSecondaryRing: false,
    hasEdgeFlares: false,
    flareCount: 0,
    flashDuration: 120,
    shockwaveDuration: 400,
  },
  2: {
    particleCount: 32,
    particleDistance: 1.2,
    shockwaveScale: 1.4,
    flashOpacity: 0.35,
    hasSecondaryRing: false,
    hasEdgeFlares: false,
    flareCount: 0,
    flashDuration: 140,
    shockwaveDuration: 450,
  },
  3: {
    particleCount: 40,
    particleDistance: 1.4,
    shockwaveScale: 1.5,
    flashOpacity: 0.4,
    hasSecondaryRing: true,
    hasEdgeFlares: false,
    flareCount: 0,
    flashDuration: 160,
    shockwaveDuration: 500,
  },
  4: {
    particleCount: 48,
    particleDistance: 1.6,
    shockwaveScale: 1.7,
    flashOpacity: 0.45,
    hasSecondaryRing: true,
    hasEdgeFlares: false,
    flareCount: 0,
    flashDuration: 180,
    shockwaveDuration: 550,
  },
  5: {
    particleCount: 52,
    particleDistance: 1.8,
    shockwaveScale: 1.9,
    flashOpacity: 0.5,
    hasSecondaryRing: true,
    hasEdgeFlares: true,
    flareCount: 4,
    flashDuration: 200,
    shockwaveDuration: 600,
  },
  6: {
    particleCount: 56,
    particleDistance: 1.9,
    shockwaveScale: 2.0,
    flashOpacity: 0.52,
    hasSecondaryRing: true,
    hasEdgeFlares: true,
    flareCount: 5,
    flashDuration: 220,
    shockwaveDuration: 650,
  },
  7: {
    particleCount: 60,
    particleDistance: 2.0,
    shockwaveScale: 2.1,
    flashOpacity: 0.55,
    hasSecondaryRing: true,
    hasEdgeFlares: true,
    flareCount: 6,
    flashDuration: 240,
    shockwaveDuration: 700,
  },
  8: {
    particleCount: 64,
    particleDistance: 2.2,
    shockwaveScale: 2.2,
    flashOpacity: 0.6,
    hasSecondaryRing: true,
    hasEdgeFlares: true,
    flareCount: 8,
    flashDuration: 260,
    shockwaveDuration: 750,
  },
};

// Base settling config - guaranteed to exist (used as fallback)
export const BASE_SETTLING_CONFIG: SettlingConfig = {
  particleCount: 0,
  particleDistance: 0,
  shockwaveScale: 1.0,
  flashOpacity: 0,
  hasSecondaryRing: false,
  hasEdgeFlares: false,
  flareCount: 0,
  flashDuration: 0,
  shockwaveDuration: 0,
};

// Helper function to safely get settling config with guaranteed return type
export const getSettlingConfig = (tier: number): SettlingConfig =>
  SETTLING_CONFIG[tier] ?? BASE_SETTLING_CONFIG;
