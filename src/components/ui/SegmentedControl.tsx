import * as React from 'react';
import { cn } from '@/utils/cn';

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
            {/* Badge - only show in full/compact mode when count > 0 */}
            {!isIconMode && option.badge !== undefined && option.badge > 0 && (
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

/**
 * Badge component that optionally animates count changes using Motion+
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

  const badgeClasses = cn(
    'shrink-0 px-1 py-0.5 rounded text-[10px] font-semibold min-w-[16px] text-center',
    isSelected ? 'bg-text-muted/20 text-text-secondary' : 'bg-text-muted/10 text-text-muted'
  );

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
