import * as React from 'react';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

const OVER_9000_THRESHOLD = 9000;

// Saiyan transformation tiers based on how many badges are over 9000
const SAIYAN_TIERS = {
  1: { name: 'Saiyan', color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)' }, // amber-400
  2: { name: 'Super Saiyan', color: '#facc15', glow: 'rgba(250, 204, 21, 0.4)' }, // yellow-400
  3: { name: 'Super Saiyan 2', color: '#fde047', glow: 'rgba(253, 224, 71, 0.5)' }, // yellow-300 + sparks
  4: { name: 'Super Saiyan 3', color: '#fef08a', glow: 'rgba(254, 240, 138, 0.6)' }, // yellow-200
  5: { name: 'Super Saiyan God', color: '#f87171', glow: 'rgba(248, 113, 113, 0.5)' }, // red-400
  finale: { name: 'Ultra Instinct', color: '#e5e7eb', glow: 'rgba(229, 231, 235, 0.7)' }, // gray-200 (silver)
} as const;

interface SegmentOption<T extends string> {
  /** Unique value for this option */
  value: T;
  /** Display label */
  label: string;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Badge count (e.g., error count) */
  badge?: number;
  /** Whether this option is disabled */
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onValueChange: (value: T) => void;
  /** Available options */
  options: Array<SegmentOption<T>>;
  /** Allow deselection (clicking selected option clears it) */
  allowEmpty?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Display variant: full shows label+icon, compact shows smaller, icon shows icon only */
  displayVariant?: 'full' | 'compact' | 'icon';
  /** ARIA label for the segment group (required for accessibility) */
  'aria-label': string;
  /** Additional CSS classes */
  className?: string;
  /** Disable the entire control */
  disabled?: boolean;
  /** Maximum badge count before showing + suffix */
  maxBadgeCount?: number;
  /** Whether to animate badge changes using Motion+ */
  animateBadge?: boolean;
}

const sizeClasses = {
  sm: 'h-6 px-1.5 text-xs',
  md: 'h-7 px-2 text-xs',
  lg: 'h-8 px-2.5 text-sm',
};

// SVG energy edge paths for path morphing effect
// Paths trace the top edge, morphing from smooth to spiky (Super Saiyan hair metaphor)
// viewBox is "0 0 100 10" - 100 units wide, 10 units tall (tight!)
const ENERGY_EDGE_PATHS = {
  // Tier 1: Gentle wave, barely perceptible
  calm: 'M0,8 Q25,7 50,8 Q75,7 100,8',
  // Tier 2: More pronounced undulation
  rising: 'M0,7 Q15,5 30,8 Q45,4 60,8 Q75,5 90,7 L100,8',
  // Tier 3: Starting to spike - hair standing up
  spiky: 'M0,6 L10,8 L20,3 L30,7 L40,2 L50,8 L60,3 L70,7 L80,2 L90,8 L100,6',
  // Tier 4: Aggressive spikes - full Super Saiyan hair
  aggressive: 'M0,5 L8,8 L15,1 L22,7 L30,0 L38,8 L45,2 L52,7 L60,0 L68,8 L75,1 L82,7 L90,0 L100,5',
  // Tier 5/Finale: Maximum chaos
  chaos:
    'M0,4 L5,8 L10,0 L15,6 L20,1 L25,8 L30,0 L35,7 L40,1 L45,8 L50,0 L55,6 L60,1 L65,8 L70,0 L75,7 L80,1 L85,8 L90,0 L95,6 L100,4',
};

// Get target path based on tier
const getTargetPath = (tier: number, isFinale: boolean): string => {
  if (isFinale) {
    return ENERGY_EDGE_PATHS.chaos;
  }
  switch (tier) {
    case 1:
      return ENERGY_EDGE_PATHS.calm;
    case 2:
      return ENERGY_EDGE_PATHS.rising;
    case 3:
      return ENERGY_EDGE_PATHS.spiky;
    case 4:
      return ENERGY_EDGE_PATHS.aggressive;
    case 5:
      return ENERGY_EDGE_PATHS.chaos;
    default:
      return ENERGY_EDGE_PATHS.calm;
  }
};

// Get animation speed based on tier (faster at higher tiers)
const getAnimationDuration = (tier: number, isFinale: boolean): number => {
  if (isFinale) {
    return 0.3;
  }
  switch (tier) {
    case 1:
      return 2.0;
    case 2:
      return 1.5;
    case 3:
      return 1.0;
    case 4:
      return 0.7;
    case 5:
      return 0.5;
    default:
      return 2.0;
  }
};

// Get glow intensity based on tier
const getGlowSize = (tier: number, isFinale: boolean): number => {
  if (isFinale) {
    return 20;
  }
  switch (tier) {
    case 1:
      return 4;
    case 2:
      return 6;
    case 3:
      return 8;
    case 4:
      return 12;
    case 5:
      return 16;
    default:
      return 4;
  }
};

// Energy edge component - tightly bound path morphing at container edges
interface EnergyEdgeProps {
  tier: number;
  color: string;
  isFinale: boolean;
  isAnimating: boolean;
  position: 'top' | 'bottom';
}

const EnergyEdge = ({
  tier,
  color,
  isFinale,
  isAnimating,
  position,
}: EnergyEdgeProps): React.JSX.Element => {
  const targetPath = getTargetPath(tier, isFinale);
  const duration = getAnimationDuration(tier, isFinale);
  const glowSize = getGlowSize(tier, isFinale);

  // When not actively animating, show a subtle settled state
  const settledPath = ENERGY_EDGE_PATHS.calm;

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
        <linearGradient id={`edge-gradient-${position}-${String(tier)}`} x1="0%" y1="0%" x2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="15%" stopColor={color} stopOpacity={isFinale ? '0.9' : '0.6'} />
          <stop offset="50%" stopColor={color} stopOpacity={isFinale ? '1' : '0.8'} />
          <stop offset="85%" stopColor={color} stopOpacity={isFinale ? '0.9' : '0.6'} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d={isAnimating ? ENERGY_EDGE_PATHS.calm : settledPath}
        fill="none"
        stroke={`url(#edge-gradient-${position}-${String(tier)})`}
        strokeWidth={isFinale ? 2.5 : 1.5}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 ${String(isAnimating ? glowSize : glowSize * 0.4)}px ${color})`,
        }}
        animate={
          isAnimating
            ? {
                d: [ENERGY_EDGE_PATHS.calm, targetPath, ENERGY_EDGE_PATHS.calm],
                strokeWidth: isFinale ? [1.5, 3, 1.5] : [1, 2, 1],
              }
            : {
                d: settledPath,
                strokeWidth: 1,
              }
        }
        transition={
          isAnimating
            ? {
                duration,
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
      {tier >= 3 && isAnimating && (
        <motion.path
          d={ENERGY_EDGE_PATHS.calm}
          fill="none"
          stroke={color}
          strokeWidth={0.75}
          strokeLinecap="round"
          opacity={0.4}
          style={{
            filter: `drop-shadow(0 0 ${String(glowSize * 0.5)}px ${color})`,
          }}
          animate={{
            d: [ENERGY_EDGE_PATHS.rising, targetPath, ENERGY_EDGE_PATHS.rising],
          }}
          transition={{
            duration: duration * 1.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: duration * 0.2,
          }}
        />
      )}
    </svg>
  );
};

// Energy ring component - tightly bound pulsing rings
interface EnergyRingProps {
  tier: number;
  color: string;
  delay?: number;
  isAnimating: boolean;
}

const EnergyRing = ({
  tier,
  color,
  delay = 0,
  isAnimating,
}: EnergyRingProps): React.JSX.Element => (
  <motion.div
    className="absolute inset-0 rounded pointer-events-none"
    style={{
      border: `1px solid ${color}`,
      boxShadow: `0 0 ${String(tier * 3)}px ${color}, inset 0 0 ${String(tier * 1.5)}px ${color}40`,
    }}
    initial={{ opacity: 0, scale: 0.98 }}
    animate={
      isAnimating
        ? {
            opacity: [0, 0.5, 0],
            scale: [0.98, 1.02, 1.02], // Tighter scale - contained energy
          }
        : {
            opacity: 0.15,
            scale: 1,
          }
    }
    transition={
      isAnimating
        ? {
            duration: 1.0,
            delay,
            repeat: Infinity,
            ease: 'easeOut',
          }
        : {
            duration: 0.5,
            ease: 'easeOut',
          }
    }
  />
);

/**
 * SegmentedControl - A standalone segmented control component for mutually exclusive options.
 *
 * Features:
 * - Keyboard navigation (Tab, Enter, Space)
 * - Three display variants: full, compact, icon-only
 * - Badge counts with optional animation via Motion+
 * - Icon support
 * - Accessible with ARIA attributes
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   value={filter}
 *   onValueChange={setFilter}
 *   options={[
 *     { value: 'all', label: 'All' },
 *     { value: 'error', label: 'Errors', icon: <AlertCircle />, badge: 5 },
 *     { value: 'warn', label: 'Warnings', icon: <AlertTriangle /> },
 *   ]}
 *   aria-label="Filter by log level"
 * />
 * ```
 */

export const SegmentedControl = <T extends string>({
  value,
  onValueChange,
  options,
  allowEmpty = false,
  size = 'md',
  displayVariant = 'full',
  'aria-label': ariaLabel,
  className,
  disabled = false,
  maxBadgeCount = 99,
  animateBadge = false,
}: SegmentedControlProps<T>): React.JSX.Element => {
  const isIconMode = displayVariant === 'icon';
  const prefersReducedMotion = useReducedMotion();

  // Count how many badges are over 9000
  const badgesOver9000Count = React.useMemo(() => {
    return options.filter((o) => (o.badge ?? 0) >= OVER_9000_THRESHOLD).length;
  }, [options]);

  const totalBadgeOptions = React.useMemo(() => {
    return options.filter((o) => o.badge !== undefined && o.badge > 0).length;
  }, [options]);

  const allBadgesOver9000 = badgesOver9000Count > 0 && badgesOver9000Count === totalBadgeOptions;

  // Current Saiyan tier (0 = none, 1-5 = tiers based on count)
  const saiyanTier = allBadgesOver9000 ? 5 : Math.min(badgesOver9000Count, 4);

  // Tier transition detection and transient animation state
  const prevTierRef = React.useRef(saiyanTier);
  const [showFinale, setShowFinale] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect((): (() => void) | undefined => {
    if (saiyanTier !== prevTierRef.current) {
      // Trigger transient animation on any tier change
      if (prefersReducedMotion !== true && saiyanTier > 0) {
        setIsAnimating(true);

        // Animation fades after 1.5 seconds (Discord-style celebratory moment)
        const animationTimer = setTimeout((): void => {
          setIsAnimating(false);
        }, 1500);

        // If we just hit ALL badges over 9000, trigger the grand finale
        if (allBadgesOver9000 && prevTierRef.current < 5) {
          const finaleStartTimer = setTimeout((): void => {
            setShowFinale(true);
          }, 300); // Brief pause for anticipation
          const finaleEndTimer = setTimeout((): void => {
            setShowFinale(false);
          }, 2500); // Finale duration

          prevTierRef.current = saiyanTier;
          return (): void => {
            clearTimeout(animationTimer);
            clearTimeout(finaleStartTimer);
            clearTimeout(finaleEndTimer);
          };
        }

        prevTierRef.current = saiyanTier;
        return (): void => {
          clearTimeout(animationTimer);
        };
      }

      prevTierRef.current = saiyanTier;
    }
    return undefined;
  }, [saiyanTier, allBadgesOver9000, prefersReducedMotion]);

  const handleClick = (optionValue: T, optionDisabled?: boolean): void => {
    if (disabled || optionDisabled === true) {
      return;
    }

    if (allowEmpty && value === optionValue) {
      onValueChange('' as T);
    } else {
      onValueChange(optionValue);
    }
  };

  const getTooltip = (option: SegmentOption<T>): string | undefined => {
    if (!isIconMode) {
      return undefined;
    }
    if (option.badge !== undefined && option.badge > 0) {
      return `${option.label} (${String(option.badge)})`;
    }
    return option.label;
  };

  // Get current tier styling
  const currentTierStyle =
    saiyanTier > 0 ? SAIYAN_TIERS[saiyanTier as keyof typeof SAIYAN_TIERS] : null;

  // Determine if finale should use the silver Ultra Instinct color
  const effectColor = showFinale ? SAIYAN_TIERS.finale.color : currentTierStyle?.color;

  // Determine aura box-shadow based on tier (only for non-reduced-motion)
  // Reduced intensity when not actively animating
  const glowIntensity = isAnimating || showFinale ? 1 : 0.3;
  const auraBoxShadow =
    prefersReducedMotion !== true && currentTierStyle !== null
      ? `0 0 ${String(saiyanTier * 6 * glowIntensity)}px ${String(saiyanTier * 2 * glowIntensity)}px ${showFinale ? SAIYAN_TIERS.finale.glow : currentTierStyle.glow}`
      : undefined;

  // Tier-based border color tinting
  const tierBorderColor =
    saiyanTier >= 2 && currentTierStyle !== null ? `${currentTierStyle.color}40` : undefined;

  // At tier 4+, the whole component gets tinted
  const tierBackgroundTint =
    isAnimating && saiyanTier >= 3 && currentTierStyle !== null
      ? `${currentTierStyle.color}10`
      : undefined;

  return (
    <div className={cn('relative', className)}>
      {/* Energy edge effects - tightly bound to container edges */}
      {saiyanTier > 0 && prefersReducedMotion !== true && effectColor !== undefined && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          <EnergyEdge
            tier={saiyanTier}
            color={effectColor}
            isFinale={showFinale}
            isAnimating={isAnimating || showFinale}
            position="top"
          />
          <EnergyEdge
            tier={saiyanTier}
            color={effectColor}
            isFinale={showFinale}
            isAnimating={isAnimating || showFinale}
            position="bottom"
          />
        </div>
      )}

      {/* Pulsing energy rings for higher tiers */}
      {saiyanTier >= 2 && prefersReducedMotion !== true && effectColor !== undefined && (
        <>
          <EnergyRing
            tier={saiyanTier}
            color={effectColor}
            delay={0}
            isAnimating={isAnimating || showFinale}
          />
          {saiyanTier >= 4 && (
            <EnergyRing
              tier={saiyanTier}
              color={effectColor}
              delay={0.4}
              isAnimating={isAnimating || showFinale}
            />
          )}
        </>
      )}

      {/* Button group with tier-based aura */}
      <motion.div
        className="flex items-center"
        role="group"
        aria-label={ariaLabel}
        animate={{
          boxShadow: auraBoxShadow ?? '0 0 0 0 transparent',
          borderColor: tierBorderColor,
          backgroundColor: tierBackgroundTint,
        }}
        transition={{ duration: 0.5 }}
      >
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;
          const isDisabled = disabled || option.disabled;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                handleClick(option.value, option.disabled);
              }}
              disabled={isDisabled}
              className={cn(
                'transition-colors flex items-center justify-center gap-1 border',
                sizeClasses[size],
                // Connected button group styling
                isFirst && 'rounded-l',
                isLast && 'rounded-r',
                !isFirst && '-ml-px',
                // Selected state
                isSelected
                  ? 'bg-bg-raised text-text-primary border-border-default z-10 relative'
                  : 'text-text-muted border-border-subtle hover:text-text-primary hover:bg-bg-raised/50',
                // Disabled state
                isDisabled === true &&
                  'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-text-muted',
                // Icon mode specific sizing
                isIconMode && 'min-w-[28px]'
              )}
              aria-pressed={isSelected}
              title={getTooltip(option)}
            >
              {option.icon !== undefined && <span className="shrink-0">{option.icon}</span>}
              {!isIconMode && <span>{option.label}</span>}
              {/* Badge - show in all modes when count > 0 */}
              {option.badge !== undefined && option.badge > 0 && (
                <BadgeCount
                  count={option.badge}
                  maxCount={maxBadgeCount}
                  animate={animateBadge}
                  isSelected={isSelected}
                />
              )}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
};

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

// Motion animation for glow burst effect
const glowAnimation = {
  boxShadow: [
    '0 0 0 0 rgba(251, 191, 36, 0)',
    '0 0 12px 4px rgba(251, 191, 36, 0.7)',
    '0 0 4px 1px rgba(251, 191, 36, 0.3)',
  ],
};

const glowTransition = {
  duration: 0.6,
  ease: 'easeOut' as const,
};

/**
 * Badge component that optionally animates count changes using Motion+
 * Includes "It's Over 9000!" Easter egg when count crosses 9000 threshold
 */
const BadgeCount = ({
  count,
  maxCount,
  animate,
  isSelected,
}: BadgeCountProps): React.JSX.Element => {
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

  // Base badge classes (without animation)
  const badgeClasses = cn(
    'shrink-0 px-1 py-0.5 rounded text-[10px] font-semibold min-w-[16px] text-center',
    isOver9000
      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400'
      : isSelected
        ? 'bg-text-muted/20 text-text-secondary'
        : 'bg-text-muted/10 text-text-muted'
  );

  // "Over 9000" powered-up display with Motion animation
  if (isOver9000) {
    return (
      <AnimatePresence mode="wait">
        <motion.span
          key={animationKey.current}
          className={badgeClasses}
          title="IT'S OVER 9000!"
          animate={justCrossed ? { ...shakeAnimation, ...glowAnimation } : {}}
          transition={justCrossed ? { ...shakeTransition, ...glowTransition } : {}}
        >
          <span className="flex items-center gap-0.5">
            <span>9K+</span>
            <Zap size={10} className="text-amber-400" />
          </span>
        </motion.span>
      </AnimatePresence>
    );
  }

  if (animate && AnimateNumber !== null) {
    return (
      <span className={badgeClasses}>
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
      </span>
    );
  }

  return <span className={badgeClasses}>{showPlus ? `${String(maxCount)}+` : count}</span>;
};
