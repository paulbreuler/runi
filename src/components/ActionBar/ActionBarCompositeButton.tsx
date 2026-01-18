import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
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
 * Ideal for actions with related alternatives, like "Save Selected" with
 * a "Save All" option in the dropdown.
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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const dropdown = dropdownRef.current;
      if (dropdown !== null && !dropdown.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return (): void => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return undefined;
  }, [isDropdownOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return (): void => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
    return undefined;
  }, [isDropdownOpen]);

  const handlePrimaryClick = (): void => {
    if (primary.disabled !== true) {
      primary.onClick();
      setIsDropdownOpen(false);
    }
  };

  const handleOptionClick = (option: CompositeButtonOption): void => {
    if (option.disabled !== true) {
      option.onClick();
      setIsDropdownOpen(false);
    }
  };

  // Icon-only mode - use simple button with tooltip
  if (isIconMode) {
    return (
      <Button
        type="button"
        onClick={handlePrimaryClick}
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

  // Get variant-specific styles
  const getButtonStyles = (): string => {
    switch (variant) {
      case 'default':
        return primary.disabled === true
          ? 'bg-accent-blue/50 text-white/50 cursor-not-allowed'
          : 'bg-accent-blue text-white hover:bg-accent-blue-hover';
      case 'outline':
        return primary.disabled === true
          ? 'text-text-muted/50 cursor-not-allowed bg-bg-surface border border-border-subtle'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50 bg-bg-surface border border-border-subtle';
      case 'ghost':
      default:
        return primary.disabled === true
          ? 'text-text-muted/50 cursor-not-allowed bg-bg-surface border border-border-subtle'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50 bg-bg-surface border border-border-subtle';
    }
  };

  // Full/compact mode - use composite button
  return (
    <div ref={dropdownRef} className={cn('relative inline-flex', className)}>
      {/* Primary button */}
      <button
        type="button"
        onClick={handlePrimaryClick}
        disabled={primary.disabled}
        className={cn(
          'px-2 py-1 text-xs rounded-l rounded-r-none transition-colors flex items-center gap-1 border-r-0',
          getButtonStyles()
        )}
        title={primary.label}
      >
        {primary.icon}
        <span>{primary.label}</span>
      </button>

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => {
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className={cn(
          'px-1 py-1 text-xs rounded-r rounded-l-none transition-colors flex items-center border-l-0',
          variant === 'default'
            ? 'bg-accent-blue text-white hover:bg-accent-blue-hover border border-accent-blue'
            : 'text-text-muted hover:text-text-primary hover:bg-bg-raised/50 bg-bg-surface border border-border-subtle'
        )}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={isDropdownOpen}
      >
        <ChevronDown
          size={12}
          className={cn('transition-transform', isDropdownOpen && 'rotate-180')}
        />
      </button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div
          role="menu"
          aria-label="Options"
          className="absolute right-0 top-full mt-1 z-50 min-w-[140px] bg-bg-surface border border-border-default rounded shadow-lg overflow-hidden"
        >
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              role="menuitem"
              onClick={() => {
                handleOptionClick(option);
              }}
              disabled={option.disabled}
              className={cn(
                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 transition-colors',
                option.disabled === true
                  ? 'text-text-muted/50 cursor-not-allowed'
                  : 'text-text-secondary hover:bg-bg-raised hover:text-text-primary'
              )}
            >
              {option.icon !== undefined && <span className="shrink-0">{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
