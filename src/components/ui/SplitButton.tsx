import * as React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, type Variant } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

interface SplitButtonMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface SplitButtonSeparator {
  type: 'separator';
}

type SplitButtonItem = SplitButtonMenuItem | SplitButtonSeparator;

const splitButtonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-accent-blue text-white hover:bg-accent-blue-hover',
        destructive: 'bg-signal-error text-white hover:bg-signal-error/90',
        outline:
          'bg-transparent border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-raised/50',
        ghost: 'bg-transparent text-text-muted hover:text-text-secondary hover:bg-bg-raised/50',
      },
      size: {
        default: 'h-9 px-3 text-sm',
        sm: 'h-8 px-2.5 text-sm',
        xs: 'h-7 px-2 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface SplitButtonProps extends VariantProps<typeof splitButtonVariants> {
  /** Button label */
  label: string;
  /** Button icon (optional) */
  icon?: React.ReactNode;
  /** Click handler for the primary button */
  onClick: () => void;
  /** Whether the primary button is disabled */
  disabled?: boolean;
  /** Dropdown menu items */
  items: SplitButtonItem[];
  /** Additional CSS classes */
  className?: string;
  /** Custom aria-label for the dropdown trigger */
  dropdownAriaLabel?: string;
}

// Motion animation variants
const buttonMotionVariants: Record<string, Variant> = {
  rest: {
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  hover: {
    scale: 1.02,
    transition: { type: 'spring', stiffness: 400, damping: 25 },
  },
  tap: {
    scale: 0.98,
    transition: { type: 'spring', stiffness: 600, damping: 30 },
  },
};

/**
 * SplitButton - A true split button with independent primary action and dropdown menu.
 *
 * Features:
 * - Primary button can be clicked independently
 * - Dropdown trigger opens a menu with additional options
 * - Visual separator between primary and dropdown
 * - Supports icons, disabled items, and destructive styling
 * - Full keyboard navigation via Radix DropdownMenu
 *
 * @example
 * ```tsx
 * <SplitButton
 *   label="Save"
 *   icon={<Download size={14} />}
 *   onClick={() => saveFile()}
 *   items={[
 *     { id: 'save', label: 'Save', onClick: () => saveFile() },
 *     { id: 'save-as', label: 'Save As...', onClick: () => saveFileAs() },
 *     { type: 'separator' },
 *     { id: 'export', label: 'Export', onClick: () => exportFile() },
 *   ]}
 * />
 * ```
 */
export const SplitButton = ({
  label,
  icon,
  onClick,
  disabled = false,
  items,
  variant = 'default',
  size = 'default',
  className,
  dropdownAriaLabel = 'More options',
}: SplitButtonProps): React.JSX.Element => {
  const [open, setOpen] = React.useState(false);

  const handlePrimaryClick = (): void => {
    if (!disabled) {
      onClick();
    }
  };

  const handleItemClick = (item: SplitButtonMenuItem): void => {
    if (item.disabled !== true) {
      item.onClick();
    }
  };

  // Get variant-specific classes for the dropdown trigger
  const getTriggerClasses = (): string => {
    switch (variant) {
      case 'default':
        return 'bg-accent-blue text-white hover:bg-accent-blue-hover';
      case 'destructive':
        return 'bg-signal-error text-white hover:bg-signal-error/90';
      case 'outline':
        return 'bg-transparent border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-bg-raised/50 border-l-0';
      case 'ghost':
        return 'bg-transparent text-text-muted hover:text-text-secondary hover:bg-bg-raised/50';
      default:
        return '';
    }
  };

  // Get separator color based on variant
  const getSeparatorColor = (): string => {
    switch (variant) {
      case 'default':
      case 'destructive':
        return 'bg-white/20';
      default:
        return 'bg-border-subtle';
    }
  };

  // Get size-specific classes for the dropdown trigger
  const getTriggerSizeClasses = (): string => {
    switch (size) {
      case 'default':
        return 'h-9 px-2';
      case 'sm':
        return 'h-8 px-1.5';
      case 'xs':
        return 'h-7 px-1';
      default:
        return 'h-9 px-2';
    }
  };

  const isMenuItemGuard = (item: SplitButtonItem): item is SplitButtonMenuItem => {
    return !('type' in item);
  };

  return (
    <div className={cn('inline-flex', className)}>
      {/* Primary button */}
      <motion.button
        type="button"
        onClick={handlePrimaryClick}
        disabled={disabled}
        className={cn(splitButtonVariants({ variant, size }), 'rounded-l-lg rounded-r-none')}
        variants={buttonMotionVariants}
        initial="rest"
        whileHover={disabled ? undefined : 'hover'}
        whileTap={disabled ? undefined : 'tap'}
      >
        {icon !== undefined && <span className="shrink-0">{icon}</span>}
        <span>{label}</span>
      </motion.button>

      {/* Visual separator */}
      <div className={cn('w-px self-stretch', getSeparatorColor())} aria-hidden="true" />

      {/* Dropdown trigger */}
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <motion.button
            type="button"
            className={cn(
              'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg-app rounded-r-lg rounded-l-none',
              getTriggerClasses(),
              getTriggerSizeClasses()
            )}
            aria-label={dropdownAriaLabel}
            aria-haspopup="menu"
            aria-expanded={open}
            variants={buttonMotionVariants}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <ChevronDown
              size={size === 'xs' ? 12 : 14}
              className={cn('transition-transform', open && 'rotate-180')}
            />
          </motion.button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[140px] bg-bg-surface border border-border-default rounded-lg shadow-lg overflow-hidden py-1 animate-in fade-in-0 zoom-in-95"
            sideOffset={4}
            align="end"
          >
            {items.map((item, index) => {
              if (!isMenuItemGuard(item)) {
                return (
                  <DropdownMenu.Separator
                    key={`separator-${String(index)}`}
                    className="h-px bg-border-subtle my-1"
                  />
                );
              }

              return (
                <DropdownMenu.Item
                  key={item.id}
                  className={cn(
                    'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer outline-none transition-colors',
                    item.destructive === true
                      ? 'text-signal-error hover:bg-signal-error/10 focus:bg-signal-error/10'
                      : 'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus:bg-bg-raised focus:text-text-primary',
                    item.disabled === true && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={item.disabled}
                  onSelect={() => {
                    handleItemClick(item);
                  }}
                >
                  {item.icon !== undefined && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};
