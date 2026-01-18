/**
 * BadgeCount component for SegmentedControl.
 *
 * Displays badge counts with tier-aware styling and the "It's Over 9000!" Easter egg.
 *
 * Badge visual states (via PowerLevelContext):
 * - Count < 9000: Normal badge styling
 * - Count >= 9000, tier 1-4: "9K+ lightning" with amber styling
 * - Count >= 9000, tier 5+: "9K+" in tier color (lightning fades out, whole bar shows effects)
 * - Non-9K badges at tier 4+ during animation: Evolve to tier color
 */

import * as React from 'react';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/utils/cn';
import { OVER_9000_THRESHOLD } from './config';
import { usePowerLevelContext } from './usePowerLevel';

interface BadgeCountProps {
  count: number;
  maxCount: number;
  animate: boolean;
  isSelected: boolean;
}

// Motion animation for "It's Over 9000!" shake effect
const shakeAnimation = {
  x: [0, -2, 2, -2, 2, -2, 2, -2, 2, 0],
};

const shakeTransition = {
  duration: 0.5,
  ease: 'easeInOut' as const,
};

// Motion animation for glow burst effect - uses dynamic color
const createGlowAnimation = (color: string): { boxShadow: string[] } => ({
  boxShadow: [`0 0 0 0 ${color}00`, `0 0 12px 4px ${color}b3`, `0 0 4px 1px ${color}4d`],
});

const glowTransition = {
  duration: 0.6,
  ease: 'easeOut' as const,
};

/**
 * Badge component that optionally animates count changes using Motion+.
 * Includes "It's Over 9000!" Easter egg when count crosses 9000 threshold.
 */
export const BadgeCount = ({
  count,
  maxCount,
  animate,
  isSelected,
}: BadgeCountProps): React.JSX.Element => {
  // Access tier state from context
  const powerLevel = usePowerLevelContext();

  // Lazy load AnimateNumber from motion-plus only when animate is true
  const [AnimateNumber, setAnimateNumber] = React.useState<React.ComponentType<{
    children: number | bigint | string;
    transition?: object;
    suffix?: string;
    style?: React.CSSProperties;
  }> | null>(null);

  // "It's Over 9000!" Easter egg state
  const isOver9000 = count >= OVER_9000_THRESHOLD;
  const prevCountRef = React.useRef(count);
  const [justCrossed, setJustCrossed] = React.useState(false);
  const animationKey = React.useRef(0);

  // God tier check: tier 5+ means all badges are over 9000
  const isGodTier = powerLevel !== null && powerLevel.tier >= 5;

  // FIX Bug 1: Use visualFlags.shouldShowTierColors instead of checking isAnimating
  // This ensures badge colors are correct during sustained phase
  const shouldUseTierColor = powerLevel?.visualFlags.shouldShowTierColors ?? false;

  // Show lightning bolt:
  // - Always for tiers 1-4
  // - For tier 5+: show during active animation (shouldShowTierColors), fade out after
  const showLightningBolt = isOver9000 && (!isGodTier || shouldUseTierColor);

  // Determine badge color based on tier and animation state
  // FIX Bug 3: Badge glow color matches badge text color consistently
  const getBadgeColor = (): string => {
    if (isOver9000) {
      // At god tier during tier color display, use tier color; otherwise amber
      if (isGodTier && shouldUseTierColor) {
        return powerLevel.config.color;
      }
      return '#fbbf24'; // amber-400
    }
    // Non-9K badges evolve at tier 4+ during tier color display
    if (powerLevel !== null && shouldUseTierColor && powerLevel.tier >= 4) {
      return powerLevel.config.color;
    }
    return ''; // Use class-based coloring
  };

  const badgeColor = getBadgeColor();

  // Detect when we cross the 9000 threshold
  React.useEffect((): (() => void) | undefined => {
    const wasUnder = prevCountRef.current < OVER_9000_THRESHOLD;
    const isNowOver = count >= OVER_9000_THRESHOLD;

    if (wasUnder && isNowOver) {
      // Just crossed the threshold - trigger animation!
      animationKey.current += 1;
      setJustCrossed(true);
      const timer = setTimeout((): void => {
        setJustCrossed(false);
      }, 600);
      return (): void => {
        clearTimeout(timer);
      };
    }

    prevCountRef.current = count;
    return undefined;
  }, [count]);

  React.useEffect(() => {
    if (animate && AnimateNumber === null) {
      import('motion-plus/react')
        .then((mod) => {
          setAnimateNumber(() => mod.AnimateNumber);
        })
        .catch(() => {
          // Fallback to static display if import fails
        });
    }
  }, [animate, AnimateNumber]);

  const displayCount = Math.min(count, maxCount);
  const showPlus = count > maxCount;

  // Determine badge background class based on state
  const getBadgeBackgroundClass = (): string => {
    if (isOver9000) {
      return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20';
    }
    if (isSelected) {
      return 'bg-text-muted/20 text-text-secondary';
    }
    return 'bg-text-muted/10 text-text-muted';
  };

  // Base badge classes - use tier color when available
  const badgeClasses = cn(
    'shrink-0 px-1 py-0.5 rounded text-[10px] font-semibold min-w-[16px] text-center',
    getBadgeBackgroundClass()
  );

  // "Over 9000" powered-up display with Motion animation
  if (isOver9000) {
    // Use tier color for glow animation when tier colors should be shown
    const glowColor = isGodTier && shouldUseTierColor ? powerLevel.config.color : '#fbbf24';
    const glowAnimation = createGlowAnimation(glowColor);

    // Default amber color for Over 9000 badges
    const defaultOver9000Color = '#fbbf24';
    const animatedColor = badgeColor !== '' ? badgeColor : defaultOver9000Color;

    return (
      <AnimatePresence mode="wait">
        <motion.span
          key={animationKey.current}
          className={badgeClasses}
          title="IT'S OVER 9000!"
          animate={{
            color: animatedColor,
            ...(justCrossed ? { ...shakeAnimation, ...glowAnimation } : {}),
          }}
          transition={{
            duration: 0.3,
            ...(justCrossed ? { ...shakeTransition, ...glowTransition } : {}),
          }}
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

  if (animate && AnimateNumber !== null) {
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
      transition={{ duration: 0.3 }}
    >
      {showPlus ? `${String(maxCount)}+` : count}
    </motion.span>
  );
};
