/**
 * Energy effect components for SegmentedControl power-level animations.
 *
 * These components create the visual effects that appear during the
 * power-up animation cycle: energy edges, pulsing rings, and dissipating particles.
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ENERGY_PATHS, MUI_TIER_CONFIG, type TierConfig } from './config';

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
}

/**
 * Energy ring component - tightly bound pulsing rings.
 * Creates a contained energy field effect around the container.
 */
export const EnergyRing = ({
  config,
  color,
  delay = 0,
  isAnimating,
  isSettling = false,
}: EnergyRingProps): React.JSX.Element => {
  const { glowSize } = config;

  // Determine animation state: animating, settling (expand outward), or idle
  const getAnimateProps = (): { opacity: number | number[]; scale: number | number[] } => {
    if (isAnimating) {
      return {
        opacity: [0, 0.5, 0],
        scale: [0.98, 1.02, 1.02], // Tighter scale - contained energy
      };
    }
    if (isSettling) {
      // Expand outward as it fades - "dissipating into the ether"
      return {
        opacity: 0,
        scale: 1.1,
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
    // Settling/idle: smooth fade out
    return {
      duration: 0.5,
      ease: 'easeOut',
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

interface DissipatingParticlesProps {
  color: string;
  isActive: boolean; // true when animationState === 'settling'
}

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

/**
 * Dissipating particles component - sparks flying off from edges during settle phase.
 * Creates the effect of energy dissipating "into the ether".
 */
export const DissipatingParticles = ({
  color,
  isActive,
}: DissipatingParticlesProps): React.JSX.Element | null => {
  // Generate particles distributed around all edges
  const particles = React.useMemo((): ParticleConfig[] => {
    const edges: EdgePosition[] = ['top', 'bottom', 'left', 'right'];
    const particlesPerEdge = 8;
    const allParticles: ParticleConfig[] = [];

    edges.forEach((edge, edgeIndex) => {
      for (let i = 0; i < particlesPerEdge; i++) {
        // Distribute along edge with some randomness
        const basePosition = ((i + 0.5) / particlesPerEdge) * 100;
        const edgePosition = basePosition + (Math.random() * 10 - 5);

        // Angle points outward from the edge
        let baseAngle: number;
        switch (edge) {
          case 'top':
            baseAngle = -90;
            break; // Up
          case 'bottom':
            baseAngle = 90;
            break; // Down
          case 'left':
            baseAngle = 180;
            break; // Left
          case 'right':
            baseAngle = 0;
            break; // Right
        }
        const angle = baseAngle + (Math.random() * 40 - 20); // +/-20 degree spread

        allParticles.push({
          id: edgeIndex * particlesPerEdge + i,
          edge,
          edgePosition,
          angle,
          distance: 8 + Math.random() * 10, // 8-18px from edge
          delay: Math.random() * 0.15,
          size: 1 + Math.random() * 1.5, // Slightly smaller
        });
      }
    });

    return allParticles;
  }, []);

  // Get starting CSS position based on edge
  const getStartPosition = (
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
                ...getStartPosition(p),
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
