import { cn } from '@/utils/cn';
import { useOptionalActionBarContext, type ActionBarVariant } from './ActionBarContext';

interface SegmentOption<T extends string> {
  /** Unique value for this option */
  value: T;
  /** Display label (used in full/compact modes) */
  label: string;
  /** Icon to display (used in all modes when present) */
  icon?: React.ReactNode;
  /** Badge count (e.g., error count) */
  badge?: number;
}

interface ActionBarSegmentProps<T extends string> {
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onValueChange: (value: T) => void;
  /** Available options */
  options: Array<SegmentOption<T>>;
  /** Allow deselection (clicking selected option clears it) */
  allowEmpty?: boolean;
  /** ARIA label for the segment group (required for accessibility) */
  'aria-label': string;
  /** Additional CSS classes */
  className?: string;
  /** Override the variant from context */
  variant?: ActionBarVariant;
}

/**
 * ActionBarSegment - Segmented control for mutually exclusive options.
 *
 * Ideal for filter toggles like log levels. Automatically responds to
 * ActionBar's responsive variant context.
 *
 * @example
 * ```tsx
 * <ActionBarSegment
 *   value={filter}
 *   onValueChange={setFilter}
 *   options={[
 *     { value: 'all', label: 'All' },
 *     { value: 'error', label: 'Error', icon: <AlertCircle />, badge: 5 },
 *     { value: 'warn', label: 'Warn', icon: <AlertTriangle /> },
 *   ]}
 *   aria-label="Filter by log level"
 * />
 * ```
 */
export const ActionBarSegment = <T extends string>({
  value,
  onValueChange,
  options,
  allowEmpty = false,
  'aria-label': ariaLabel,
  className,
  variant: variantOverride,
}: ActionBarSegmentProps<T>): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const variant = variantOverride ?? context?.variant ?? 'full';
  const isIconMode = variant === 'icon';

  const handleClick = (optionValue: T): void => {
    if (allowEmpty && value === optionValue) {
      // TypeScript requires a cast here since we can't express "T | empty"
      onValueChange('' as T);
    } else {
      onValueChange(optionValue);
    }
  };

  return (
    <div className={cn('flex items-center', className)} role="group" aria-label={ariaLabel}>
      {options.map((option, index) => {
        const isSelected = value === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              handleClick(option.value);
            }}
            className={cn(
              'text-xs transition-colors flex items-center justify-center gap-1 border',
              // Connected button group styling
              isFirst && 'rounded-l',
              isLast && 'rounded-r',
              !isFirst && '-ml-px',
              // Selected state
              isSelected
                ? 'bg-bg-raised text-text-primary border-border-default z-10 relative'
                : 'text-text-muted border-border-subtle hover:text-text-primary hover:bg-bg-raised/50',
              // Size adjustments - fixed height for consistency
              isIconMode ? 'h-7 px-2 min-w-[28px]' : 'h-7 px-2'
            )}
            aria-pressed={isSelected}
            title={((): string | undefined => {
              if (!isIconMode) {
                return undefined;
              }
              if (option.badge !== undefined && option.badge > 0) {
                return `${option.label} (${String(option.badge)})`;
              }
              return option.label;
            })()}
          >
            {option.icon !== undefined && <span className="shrink-0">{option.icon}</span>}
            {!isIconMode && <span>{option.label}</span>}
            {/* Only show badges in full/compact mode for consistent sizing */}
            {!isIconMode && option.badge !== undefined && option.badge > 0 && (
              <span
                className={cn(
                  'shrink-0 px-1 py-0.5 rounded text-[10px] font-semibold min-w-[16px] text-center',
                  isSelected
                    ? 'bg-text-muted/20 text-text-secondary'
                    : 'bg-text-muted/10 text-text-muted'
                )}
              >
                {option.badge > 99 ? '99+' : option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
