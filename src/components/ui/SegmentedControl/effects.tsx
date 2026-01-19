/**
 * Energy effect components for SegmentedControl power-level animations.
 *
 * These components create the visual effects that appear during the
 * power-up animation cycle: energy edges, pulsing rings, and dissipating particles.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ENERGY_PATHS, MUI_TIER_CONFIG, type TierConfig, type SettlingConfig } from './config';

// ============================================================================
// ENERGY EDGE - SVG path morphing at container edges
// ============================================================================

interface EnergyEdgeProps {
  config: TierConfig;
  color: string;
  isFinale: boolean;
  isAnimating: boolean;
  isSettling?: boolean;
  position: 'top' | 'bottom';
}

/**
 * Energy edge component - tightly bound path morphing at container edges.
 * Creates a "hair standing up" effect that intensifies with tier level.
 */
export const EnergyEdge = ({
  config,
  color,
  isFinale,
  isAnimating,
  isSettling = false,
  position,
}: EnergyEdgeProps): React.JSX.Element => {
  const { path: targetPath, duration, glowSize } = config;

  // For finale, use MUI config
  const finaleConfig = MUI_TIER_CONFIG;
  const effectivePath = isFinale ? finaleConfig.path : targetPath;
  const effectiveDuration = isFinale ? finaleConfig.duration : duration;
  const effectiveGlowSize = isFinale ? finaleConfig.glowSize : glowSize;

  // When not actively animating, show a subtle settled state
  const settledPath = ENERGY_PATHS.calm;

  // Calculate glow size based on state - fade out during settling
  const getGlowSize = (): number => {
    if (isAnimating) {
      return effectiveGlowSize;
    }
    if (isSettling) {
      return effectiveGlowSize * 0.2; // Fade glow during settling
    }
    return 0;
  };

  // Calculate stroke width based on state
  const getSettledStrokeWidth = (): number => {
    if (isSettling) {
      return 0.5; // Thin out as it settles
    }
    return 1;
  };

  return (
    <svg
      className="absolute left-0 w-full pointer-events-none"
      style={{
        height: '8px',
        top: position === 'top' ? '-3px' : undefined,
        bottom: position === 'bottom' ? '-3px' : undefined,
        transform: position === 'bottom' ? 'scaleY(-1)' : undefined,
      }}
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id={`edge-gradient-${position}-${String(effectiveGlowSize)}`}
          x1="0%"
          y1="0%"
          x2="100%"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="15%" stopColor={color} stopOpacity={isFinale ? '0.9' : '0.6'} />
          <stop offset="50%" stopColor={color} stopOpacity={isFinale ? '1' : '0.8'} />
          <stop offset="85%" stopColor={color} stopOpacity={isFinale ? '0.9' : '0.6'} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d={isAnimating ? ENERGY_PATHS.calm : settledPath}
        fill="none"
        stroke={`url(#edge-gradient-${position}-${String(effectiveGlowSize)})`}
        strokeWidth={isFinale ? 2.5 : 1.5}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 ${String(getGlowSize())}px ${color})`,
          transition: 'filter 0.4s ease-out',
        }}
        animate={
          isAnimating
            ? {
                d: [ENERGY_PATHS.calm, effectivePath, ENERGY_PATHS.calm],
                strokeWidth: isFinale ? [1.5, 3, 1.5] : [1, 2, 1],
              }
            : {
                d: settledPath,
                strokeWidth: getSettledStrokeWidth(),
              }
        }
        transition={
          isAnimating
            ? {
                duration: effectiveDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {
                duration: 0.5,
                ease: 'easeOut',
              }
        }
      />

      {/* Secondary path for depth at higher tiers */}
      {effectiveGlowSize >= 8 && isAnimating && (
        <motion.path
          d={ENERGY_PATHS.calm}
          fill="none"
          stroke={color}
          strokeWidth={0.75}
          strokeLinecap="round"
          opacity={0.4}
          style={{
            filter: `drop-shadow(0 0 ${String(effectiveGlowSize * 0.5)}px ${color})`,
          }}
          animate={{
            d: [ENERGY_PATHS.rising, effectivePath, ENERGY_PATHS.rising],
          }}
          transition={{
            duration: effectiveDuration * 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: effectiveDuration * 0.2,
          }}
        />
      )}
    </svg>
  );
};

// ============================================================================
// ENERGY RING - Pulsing rings around the container
// ============================================================================

interface EnergyRingProps {
  config: TierConfig;
  color: string;
  delay?: number;
  isAnimating: boolean;
  isSettling?: boolean;
  settlingConfig?: SettlingConfig;
  isSecondary?: boolean;
}

/**
 * Energy ring component - tightly bound pulsing rings.
 * Creates a contained energy field effect around the container.
 * During settling, expands dramatically based on tier for explosive dispel.
 */
export const EnergyRing = ({
  config,
  color,
  delay = 0,
  isAnimating,
  isSettling = false,
  settlingConfig,
  isSecondary = false,
}: EnergyRingProps): React.JSX.Element => {
  const { glowSize } = config;

  // Get settling scale from config, fallback to 1.1 for backwards compatibility
  const settlingScale = settlingConfig?.shockwaveScale ?? 1.1;
  // Secondary ring is slower and larger
  const secondaryScale = settlingScale * 1.15;
  const effectiveScale = isSecondary ? secondaryScale : settlingScale;

  // Determine animation state: animating, settling (expand outward), or idle
  const getAnimateProps = (): {
    opacity: number | number[];
    scale: number | number[];
    borderWidth?: number | number[];
  } => {
    if (isAnimating) {
      return {
        opacity: [0, 0.5, 0],
        scale: [0.98, 1.02, 1.02], // Tighter scale - contained energy
      };
    }
    if (isSettling) {
      // Expand outward as it fades - "dissipating into the ether"
      // Border thins as it expands for more dramatic effect
      return {
        opacity: 0,
        scale: effectiveScale,
        borderWidth: 0,
      };
    }
    return {
      opacity: 0,
      scale: 1,
    };
  };

  const getTransitionProps = (): object => {
    if (isAnimating) {
      return {
        duration: 1.0,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      };
    }
    // Settling: use tier-specific duration, secondary ring is slower
    const baseDuration =
      settlingConfig?.shockwaveDuration !== undefined && settlingConfig.shockwaveDuration > 0
        ? settlingConfig.shockwaveDuration / 1000
        : 0.5;
    const effectiveDuration = isSecondary ? baseDuration * 1.3 : baseDuration;
    const effectiveDelay = isSecondary ? 0.05 : 0;

    return {
      duration: effectiveDuration,
      delay: effectiveDelay,
      ease: [0.22, 1, 0.36, 1], // Overshoot ease for explosive feel
    };
  };

  return (
    <motion.div
      className="absolute inset-0 rounded pointer-events-none"
      style={{
        border: `1px solid ${color}`,
        boxShadow: `0 0 ${String(glowSize * 1.5)}px ${color}, inset 0 0 ${String(glowSize * 0.75)}px ${color}40`,
      }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={getAnimateProps()}
      transition={getTransitionProps()}
    />
  );
};

// ============================================================================
// DISSIPATING PARTICLES - Sparks flying off during settling
// ============================================================================

type EdgePosition = 'top' | 'bottom' | 'left' | 'right';

interface ParticleConfig {
  id: number;
  edge: EdgePosition;
  edgePosition: number; // 0-100% along the edge
  angle: number; // Direction to travel (outward from edge)
  distance: number;
  delay: number;
  size: number;
}

interface ParticleGenerationOptions {
  particlesPerEdge: number;
  angleSpread: number; // +/- degrees from base angle
  distanceRange: { min: number; max: number };
  delayRange: { min: number; max: number };
  sizeRange: { min: number; max: number };
  distanceMultiplier?: number;
}

// Shared utility: Get starting CSS position based on edge
const getParticleStartPosition = (
  p: ParticleConfig
): { left?: string; right?: string; top?: string; bottom?: string } => {
  switch (p.edge) {
    case 'top':
      return { left: `${String(p.edgePosition)}%`, top: '0' };
    case 'bottom':
      return { left: `${String(p.edgePosition)}%`, bottom: '0' };
    case 'left':
      return { left: '0', top: `${String(p.edgePosition)}%` };
    case 'right':
      return { right: '0', top: `${String(p.edgePosition)}%` };
  }
};

// Shared utility: Get base angle for edge
const getBaseAngleForEdge = (edge: EdgePosition): number => {
  switch (edge) {
    case 'top':
      return -90; // Up
    case 'bottom':
      return 90; // Down
    case 'left':
      return 180; // Left
    case 'right':
      return 0; // Right
  }
};

// Shared utility: Generate particles with configurable options
const generateParticles = (options: ParticleGenerationOptions): ParticleConfig[] => {
  const edges: EdgePosition[] = ['top', 'bottom', 'left', 'right'];
  const allParticles: ParticleConfig[] = [];

  edges.forEach((edge, edgeIndex) => {
    for (let i = 0; i < options.particlesPerEdge; i++) {
      const basePosition = ((i + 0.5) / options.particlesPerEdge) * 100;
      const edgePosition = basePosition + (Math.random() * 10 - 5);
      const baseAngle = getBaseAngleForEdge(edge);
      const angle = baseAngle + (Math.random() * options.angleSpread * 2 - options.angleSpread);

      const baseDistance =
        options.distanceRange.min +
        Math.random() * (options.distanceRange.max - options.distanceRange.min);
      const distance = baseDistance * (options.distanceMultiplier ?? 1);

      allParticles.push({
        id: edgeIndex * options.particlesPerEdge + i,
        edge,
        edgePosition,
        angle,
        distance,
        delay:
          options.delayRange.min +
          Math.random() * (options.delayRange.max - options.delayRange.min),
        size:
          options.sizeRange.min + Math.random() * (options.sizeRange.max - options.sizeRange.min),
      });
    }
  });

  return allParticles;
};

interface DissipatingParticlesProps {
  color: string;
  isActive: boolean; // true when animationState === 'settling'
}

/**
 * Dissipating particles component - sparks flying off from edges during settle phase.
 * Creates the effect of energy dissipating "into the ether".
 */
export const DissipatingParticles = ({
  color,
  isActive,
}: DissipatingParticlesProps): React.JSX.Element | null => {
  const particles = React.useMemo(
    () =>
      generateParticles({
        particlesPerEdge: 8,
        angleSpread: 20, // +/-20 degree spread
        distanceRange: { min: 8, max: 18 },
        delayRange: { min: 0, max: 0.15 },
        sizeRange: { min: 1, max: 2.5 },
      }),
    []
  );

  return (
    <AnimatePresence>
      {isActive && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                backgroundColor: color,
                width: p.size,
                height: p.size,
                ...getParticleStartPosition(p),
                boxShadow: `0 0 4px ${color}, 0 0 8px ${color}80`,
              }}
              initial={{
                x: 0,
                y: 0,
                opacity: 0.9,
                scale: 1,
              }}
              animate={{
                x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                opacity: 0,
                scale: 0.3,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.4,
                delay: p.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// BURST FLASH - Brief light flash at settling start
// ============================================================================

interface BurstFlashProps {
  color: string;
  isActive: boolean;
  settlingConfig: SettlingConfig;
}

/**
 * Burst flash component - creates a quick "release" sensation at settling start.
 * Quick scale pop with opacity fade based on tier intensity.
 */
export const BurstFlash = ({
  color,
  isActive,
  settlingConfig,
}: BurstFlashProps): React.JSX.Element | null => {
  const { flashOpacity, flashDuration } = settlingConfig;

  if (flashOpacity === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded pointer-events-none z-30"
          style={{
            backgroundColor: color,
          }}
          initial={{
            opacity: flashOpacity,
            scale: 1.0,
          }}
          animate={{
            opacity: 0,
            scale: 1.05 + flashOpacity * 0.15, // 1.05-1.15x based on tier
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: flashDuration / 1000,
            ease: 'easeOut',
          }}
        />
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// SHOCKWAVE RING - Expanding ring shockwave during settling
// ============================================================================

interface ShockwaveRingProps {
  color: string;
  isActive: boolean;
  settlingConfig: SettlingConfig;
  delay?: number;
}

/**
 * Shockwave ring component - expanding ring that creates explosion sensation.
 * Scales outward while border thins and fades.
 */
export const ShockwaveRing = ({
  color,
  isActive,
  settlingConfig,
  delay = 0,
}: ShockwaveRingProps): React.JSX.Element | null => {
  const { shockwaveScale, shockwaveDuration } = settlingConfig;

  if (shockwaveScale <= 1.0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded pointer-events-none z-15"
          style={{
            border: `2px solid ${color}`,
          }}
          initial={{
            opacity: 0.7,
            scale: 1.0,
            borderWidth: 2,
          }}
          animate={{
            opacity: 0,
            scale: shockwaveScale,
            borderWidth: 0,
          }}
          exit={{
            opacity: 0,
          }}
          transition={{
            duration: shockwaveDuration / 1000,
            delay,
            ease: [0.22, 1, 0.36, 1], // Custom ease-out with overshoot feel
          }}
        />
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// EDGE FLARES - Energy flares shooting outward (Tier 5+ only)
// ============================================================================

interface EdgeFlaresProps {
  color: string;
  isActive: boolean;
  settlingConfig: SettlingConfig;
}

interface FlareConfig {
  id: number;
  angle: number; // Direction to travel (degrees)
  distance: number;
  delay: number;
  initialWidth: number;
  initialHeight: number;
}

/**
 * Edge flares component - energy flares shooting outward at advanced tiers.
 * Flares elongate as they travel, then shrink and fade.
 */
export const EdgeFlares = ({
  color,
  isActive,
  settlingConfig,
}: EdgeFlaresProps): React.JSX.Element | null => {
  const { hasEdgeFlares, flareCount } = settlingConfig;

  // Generate flares distributed around the container
  const flares = React.useMemo((): FlareConfig[] => {
    if (!hasEdgeFlares || flareCount === 0) {
      return [];
    }

    const angleStep = 360 / flareCount;
    const allFlares: FlareConfig[] = [];

    for (let i = 0; i < flareCount; i++) {
      const baseAngle = i * angleStep;
      // Add slight randomness to angle for organic feel
      const angle = baseAngle + (Math.random() * 15 - 7.5);

      allFlares.push({
        id: i,
        angle,
        distance: 25 + Math.random() * 15, // 25-40px travel
        delay: Math.random() * 0.05, // Staggered start
        initialWidth: 3 + Math.random() * 2, // 3-5px wide
        initialHeight: 8 + Math.random() * 4, // 8-12px tall
      });
    }

    return allFlares;
  }, [hasEdgeFlares, flareCount]);

  if (!hasEdgeFlares || flares.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isActive && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-25">
          {flares.map((flare) => (
            <motion.div
              key={flare.id}
              className="absolute rounded-full"
              style={{
                backgroundColor: color,
                width: flare.initialWidth,
                height: flare.initialHeight,
                left: '50%',
                top: '50%',
                marginLeft: -flare.initialWidth / 2,
                marginTop: -flare.initialHeight / 2,
                boxShadow: `0 0 6px ${color}, 0 0 12px ${color}60`,
                transform: `rotate(${String(flare.angle)}deg)`,
              }}
              initial={{
                x: 0,
                y: 0,
                opacity: 0.9,
                scaleX: 1,
                scaleY: 1,
              }}
              animate={{
                x: Math.cos((flare.angle * Math.PI) / 180) * flare.distance,
                y: Math.sin((flare.angle * Math.PI) / 180) * flare.distance,
                opacity: [0.9, 0.7, 0],
                scaleX: [1, 0.5, 0.2], // Shrink width
                scaleY: [1, 2, 0.5], // Elongate then shrink
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.35,
                delay: flare.delay,
                ease: [0.22, 1, 0.36, 1], // Custom overshoot ease
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// ENHANCED DISSIPATING PARTICLES - Tier-scaled particle burst
// ============================================================================

interface EnhancedDissipatingParticlesProps {
  color: string;
  isActive: boolean;
  settlingConfig: SettlingConfig;
}

/**
 * Enhanced dissipating particles with tier-scaled count, distance, and timing.
 * Creates more intense "explosion" at higher tiers.
 */
export const EnhancedDissipatingParticles = ({
  color,
  isActive,
  settlingConfig,
}: EnhancedDissipatingParticlesProps): React.JSX.Element | null => {
  const { particleCount, particleDistance } = settlingConfig;

  const particles = React.useMemo((): ParticleConfig[] => {
    if (particleCount === 0) {
      return [];
    }

    return generateParticles({
      particlesPerEdge: Math.floor(particleCount / 4),
      angleSpread: 25, // Wider spread for more explosive feel
      distanceRange: { min: 10, max: 22 },
      delayRange: { min: 0, max: 0.08 }, // Tighter burst timing
      sizeRange: { min: 1.5, max: 3.5 },
      distanceMultiplier: particleDistance,
    });
  }, [particleCount, particleDistance]);

  if (particleCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isActive && (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                backgroundColor: color,
                width: p.size,
                height: p.size,
                ...getParticleStartPosition(p),
                boxShadow: `0 0 6px ${color}, 0 0 12px ${color}60`,
              }}
              initial={{
                x: 0,
                y: 0,
                opacity: 0.95,
                scale: 1,
              }}
              animate={{
                x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                opacity: 0,
                scale: 0.2,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.55,
                delay: p.delay,
                ease: [0.22, 1, 0.36, 1], // Overshoot easing for explosive feel
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};
