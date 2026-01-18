import * as React from 'react';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/utils/cn';

const OVER_9000_THRESHOLD = 9000;

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

  return (
    <div className={cn('flex items-center', className)} role="group" aria-label={ariaLabel}>
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
  React.useEffect(() => {
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
