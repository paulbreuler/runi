/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * BadgeCount component for SegmentedControl.
 *
 * Displays badge counts with tier-aware styling based on count thresholds.
 */

import * as React from 'react';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import { loadMotionPlusAnimateNumber } from '@/utils/loadMotionPlusAnimateNumber';
import { OVER_9000_THRESHOLD } from './config';
import { usePowerLevelContext } from './usePowerLevel';

interface BadgeCountProps {
  count: number;
  maxCount: number;
  animate: boolean;
  isSelected: boolean;
}

// Motion animation for threshold-crossing shake effect
const shakeAnimation = {
  x: [0, -2, 2, -2, 2, -2, 2, -2, 2, 0],
};

const shakeTransition = {
  duration: 0.5,
  ease: 'easeInOut' as const,
};

// Glow shadow value for threshold burst effect
const createGlowShadow = (color: string): string => `0 0 12px 4px ${color}`;

// No shadow - consistent format for Motion interpolation
const NO_SHADOW = '0 0 0 0 rgba(0, 0, 0, 0)';

/**
 * Badge component that optionally animates count changes using Motion+.
 */
export const BadgeCount = ({
  count,
  maxCount,
  animate,
  isSelected,
}: BadgeCountProps): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion() === true;
  // Access tier state from context
  const powerLevel = usePowerLevelContext();

  // Lazy load AnimateNumber from motion-plus only when animate is true
  const [AnimateNumber, setAnimateNumber] = React.useState<React.ComponentType<{
    children: number | bigint | string;
    transition?: object;
    suffix?: string;
    style?: React.CSSProperties;
  }> | null>(null);

  // High count threshold state
  const isOver9000 = count >= OVER_9000_THRESHOLD;
  const prevCountRef = React.useRef(count);
  const [justCrossed, setJustCrossed] = React.useState(false);
  const animationKey = React.useRef(0);

  // God tier check: tier 5+ means all badges exceed threshold
  const isGodTier = powerLevel !== null && powerLevel.tier >= 5;

  // FIX Bug 1: Use visualFlags.shouldShowTierColors instead of checking isAnimating
  // This ensures badge colors are correct during sustained phase
  const shouldUseTierColor = powerLevel?.visualFlags.shouldShowTierColors ?? false;

  // Show lightning bolt only during active animation (when tier colors are shown)
  // Fades out when animation completes (idle/settling states)
  const showLightningBolt = isOver9000 && shouldUseTierColor && !prefersReducedMotion;

  // Determine badge color based on tier and animation state
  const getBadgeColor = (): string => {
    // When NOT showing tier colors (idle/settling), use default muted styling
    if (!shouldUseTierColor) {
      return ''; // Use class-based coloring
    }

    // During animation, show special colors
    if (isOver9000) {
      return isGodTier ? powerLevel.config.color : '#fbbf24'; // amber-400
    }

    // Non-9K badges at tier 4+ during animation: evolve to tier color
    if (powerLevel !== null && powerLevel.tier >= 4) {
      return powerLevel.config.color;
    }

    return ''; // Use class-based coloring
  };

  const badgeColor = getBadgeColor();

  // Detect when we cross the 9000 threshold
  React.useEffect((): (() => void) | undefined => {
    const wasUnder = prevCountRef.current < OVER_9000_THRESHOLD;
    const isNowOver = count >= OVER_9000_THRESHOLD;

    if (wasUnder && isNowOver && !prefersReducedMotion) {
      // Just crossed the threshold - trigger animation!
      animationKey.current += 1;
      setJustCrossed(true);
      // Timer slightly longer than glowTransition (0.6s) to ensure animation completes
      const timer = setTimeout((): void => {
        setJustCrossed(false);
      }, 650);
      return (): void => {
        clearTimeout(timer);
      };
    }

    prevCountRef.current = count;
    return undefined;
  }, [count, prefersReducedMotion]);

  React.useEffect(() => {
    if (animate && AnimateNumber === null && !prefersReducedMotion) {
      void loadMotionPlusAnimateNumber().then((animateNumberComponent) => {
        if (animateNumberComponent !== null) {
          setAnimateNumber(() => animateNumberComponent);
        }
      });
    }
  }, [animate, AnimateNumber, prefersReducedMotion]);

  const displayCount = Math.min(count, maxCount);
  const showPlus = count > maxCount;

  // Determine badge background class based on state
  const getBadgeBackgroundClass = (): string => {
    // Only show special 9K+ gradient during animation
    if (isOver9000 && shouldUseTierColor && !prefersReducedMotion) {
      return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20';
    }
    if (isSelected) {
      return 'bg-text-muted/20 text-text-secondary';
    }
    return 'bg-text-muted/10 text-text-muted';
  };

  // Base badge classes - use tier color when available
  const badgeClasses = cn(
    'shrink-0 px-1 py-0.5 rounded text-xs font-semibold min-w-[16px] text-center',
    getBadgeBackgroundClass()
  );

  // High-count powered-up display with Motion animation
  if (isOver9000) {
    // Use tier color for glow when showing tier colors, otherwise amber
    const glowColor = isGodTier && shouldUseTierColor ? powerLevel.config.color : '#fbbf24';

    // Use 'inherit' when idle (no tier colors) to pick up class-based muted styling
    const animatedColor = badgeColor !== '' ? badgeColor : 'inherit';

    // Determine boxShadow: show glow during justCrossed burst, otherwise no shadow
    // Using consistent NO_SHADOW format ensures Motion can interpolate properly
    const boxShadowValue =
      justCrossed && !prefersReducedMotion ? createGlowShadow(glowColor) : NO_SHADOW;

    return (
      <AnimatePresence mode="wait">
        <motion.span
          key={animationKey.current}
          className={badgeClasses}
          title={`Count: ${String(count)}`}
          initial={{ boxShadow: NO_SHADOW }}
          animate={{
            color: animatedColor,
            boxShadow: boxShadowValue,
            ...(justCrossed && !prefersReducedMotion ? shakeAnimation : {}),
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: 0.3,
                  ...(justCrossed ? shakeTransition : {}),
                }
          }
        >
          <span className="flex items-center gap-0.5">
            <span>9K+</span>
            <AnimatePresence mode="wait">
              {showLightningBolt && (
                <motion.span
                  key="lightning-bolt"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 1.5,
                    filter: 'blur(2px)',
                    transition: { duration: 0.4, ease: 'easeOut' },
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Zap size={10} className="text-amber-400" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        </motion.span>
      </AnimatePresence>
    );
  }

  // Non-9K badge with tier-aware coloring
  // Use 'inherit' as default to pick up class-based coloring
  const animatedBadgeColor = badgeColor !== '' ? badgeColor : 'inherit';

  if (animate && AnimateNumber !== null && !prefersReducedMotion) {
    return (
      <motion.span
        className={badgeClasses}
        animate={{ color: animatedBadgeColor }}
        transition={{ duration: 0.3 }}
      >
        <AnimateNumber
          transition={{
            layout: { type: 'spring', duration: 0.5, bounce: 0 },
            y: { type: 'spring', duration: 0.5, bounce: 0 },
          }}
          suffix={showPlus ? '+' : undefined}
          style={{ fontSize: 'inherit', lineHeight: 'inherit' }}
        >
          {displayCount}
        </AnimateNumber>
      </motion.span>
    );
  }

  return (
    <motion.span
      className={badgeClasses}
      animate={{ color: animatedBadgeColor }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
    >
      {showPlus ? `${String(maxCount)}+` : count}
    </motion.span>
  );
};
