import { Button } from '@/components/ui/button';
import { SplitButton } from '@/components/ui/SplitButton';
import { useOptionalActionBarContext, type ActionBarVariant } from './ActionBarContext';

interface CompositeButtonPrimary {
  /** Button label (shown in full/compact modes) */
  label: string;
  /** Button icon */
  icon: React.ReactNode;
  /** Click handler for the primary action */
  onClick: () => void;
  /** Whether the primary button is disabled */
  disabled?: boolean;
}

interface CompositeButtonOption {
  /** Option label */
  label: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Click handler for this option */
  onClick: () => void;
  /** Whether this option is disabled */
  disabled?: boolean;
}

interface ActionBarCompositeButtonProps {
  /** Primary action configuration */
  primary: CompositeButtonPrimary;
  /** Dropdown options */
  options: CompositeButtonOption[];
  /** Button variant style */
  variant?: 'default' | 'outline' | 'ghost';
  /** Additional CSS classes */
  className?: string;
  /** Override the variant from context */
  displayVariant?: ActionBarVariant;
}

/**
 * ActionBarCompositeButton - Split button with primary action and dropdown menu.
 *
 * Wraps the standalone SplitButton component with ActionBar context awareness.
 * In icon mode, displays a simple icon button. In full/compact modes, shows
 * a true split button with independent primary action and dropdown.
 *
 * @example
 * ```tsx
 * <ActionBarCompositeButton
 *   primary={{
 *     label: 'Save Selected',
 *     icon: <Download size={12} />,
 *     onClick: onSaveSelection,
 *     disabled: isSaveSelectionDisabled,
 *   }}
 *   options={[
 *     { label: 'Save Selected', icon: <Download />, onClick: onSaveSelection },
 *     { label: 'Save All', icon: <Download />, onClick: onSaveAll },
 *   ]}
 * />
 * ```
 */
export const ActionBarCompositeButton = ({
  primary,
  options,
  variant = 'ghost',
  className,
  displayVariant: displayVariantOverride,
}: ActionBarCompositeButtonProps): React.JSX.Element => {
  const context = useOptionalActionBarContext();
  const displayVariant = displayVariantOverride ?? context?.variant ?? 'full';
  const isIconMode = displayVariant === 'icon';

  // Icon-only mode - use simple button with tooltip
  if (isIconMode) {
    return (
      <Button
        type="button"
        onClick={primary.onClick}
        disabled={primary.disabled}
        variant={variant}
        size="icon-xs"
        title={primary.label}
        aria-label={primary.label}
        className={className}
      >
        {primary.icon}
      </Button>
    );
  }

  // Map options to SplitButton items format
  const items = options.map((option, index) => ({
    id: `option-${String(index)}`,
    label: option.label,
    icon: option.icon,
    onClick: option.onClick,
    disabled: option.disabled,
  }));

  // Full/compact mode - use SplitButton
  return (
    <SplitButton
      label={primary.label}
      icon={primary.icon}
      onClick={primary.onClick}
      disabled={primary.disabled}
      items={items}
      variant={variant}
      size="xs"
      className={className}
    />
  );
};
