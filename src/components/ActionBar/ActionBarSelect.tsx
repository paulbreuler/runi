import { cn } from '@/utils/cn';
import * as Select from '@/components/ui/select';
import { useOptionalActionBarContext, type ActionBarVariant } from './ActionBarContext';

interface SelectOption {
  /** Unique value for this option */
  value: string;
  /** Display label for this option */
  label: string;
}

interface ActionBarSelectProps {
  /** Currently selected value */
  value: string;
  /** Callback when selection changes */
  onValueChange: (value: string) => void;
  /** Available options */
  options: SelectOption[];
  /** Icon to show in icon mode */
  icon: React.ReactNode;
  /** ARIA label for the select (required for accessibility) */
  'aria-label': string;
  /** Additional CSS classes */
  className?: string;
  /** Override the variant from context */
  variant?: ActionBarVariant;
  /** Data testid for testing */
  'data-testid'?: string;
}

/**
 * ActionBarSelect - Radix Select wrapper for ActionBar context.
 *
 * Automatically responds to ActionBar's responsive variant context.
 * In icon mode, displays only the icon. In full/compact modes,
 * shows the selected value label.
 *
 * @example
 * ```tsx
 * <ActionBarSelect
 *   value={filters.method}
 *   onValueChange={(v) => onFilterChange('method', v)}
 *   options={[
 *     { value: 'ALL', label: 'All Methods' },
 *     { value: 'GET', label: 'GET' },
 *     { value: 'POST', label: 'POST' },
 *   ]}
 *   icon={<Code size={14} />}
 *   aria-label="Filter by HTTP method"
 * />
 * ```
 */
export const ActionBarSelect = ({
  value,
  onValueChange,
  options,
  icon,
  'aria-label': ariaLabel,
  className,
  variant: variantOverride,
  'data-testid': testId,
}: ActionBarSelectProps): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const variant = variantOverride ?? context?.variant ?? 'full';
  const isIconMode = variant === 'icon';

  // Trigger classes for icon mode
  const iconTriggerClasses = 'size-7 p-0 min-w-0 justify-center [&>svg:last-child]:hidden';

  // Trigger classes for full/compact mode
  const normalTriggerClasses = 'h-7 px-2 py-1 text-xs';

  return (
    <Select.Select value={value} onValueChange={onValueChange}>
      <Select.SelectTrigger
        data-testid={testId}
        className={cn(isIconMode ? iconTriggerClasses : normalTriggerClasses, className)}
        aria-label={ariaLabel}
      >
        {isIconMode ? <span className="text-text-muted">{icon}</span> : <Select.SelectValue />}
      </Select.SelectTrigger>
      <Select.SelectContent>
        {options.map((option) => (
          <Select.SelectItem key={option.value} value={option.value}>
            {option.label}
          </Select.SelectItem>
        ))}
      </Select.SelectContent>
    </Select.Select>
  );
};
