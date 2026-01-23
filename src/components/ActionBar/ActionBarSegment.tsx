/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useOptionalActionBarContext, type ActionBarVariant } from './ActionBarContext';

interface SegmentOption<T extends string> {
  /** Unique value for this option */
  value: T;
  /** Display label (used in full mode) */
  label: string;
  /** Icon to display (used in all modes when present) */
  icon?: React.ReactNode;
  /** Badge count (e.g., error count) */
  badge?: number;
  /** Whether this option is disabled */
  disabled?: boolean;
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
  /** Whether to animate badge changes using Motion+ (default: true) */
  animateBadge?: boolean;
  /** Maximum badge count before showing + suffix */
  maxBadgeCount?: number;
}

/**
 * ActionBarSegment - Segmented control for mutually exclusive options.
 *
 * Wraps the standalone SegmentedControl component with ActionBar context
 * awareness for responsive behavior. Enables animated badges by default.
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
  animateBadge = true,
  maxBadgeCount = 99,
}: ActionBarSegmentProps<T>): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const variant = variantOverride ?? context?.variant ?? 'full';

  // Map ActionBar variant to SegmentedControl displayVariant
  // Note: ActionBar 'compact' maps to 'full' as SegmentedControl only supports 'full' | 'icon'
  const displayVariant: 'full' | 'icon' = variant === 'icon' ? 'icon' : 'full';

  return (
    <SegmentedControl
      value={value}
      onValueChange={onValueChange}
      options={options}
      allowEmpty={allowEmpty}
      displayVariant={displayVariant}
      aria-label={ariaLabel}
      className={className}
      size="md"
      animateBadge={animateBadge}
      maxBadgeCount={maxBadgeCount}
    />
  );
};
