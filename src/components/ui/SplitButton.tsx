/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { ChevronDown } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';
import { Button } from '@/components/ui/button';

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

const _splitButtonVariants = cva(
  `${focusRingClasses} inline-flex items-center justify-center gap-1.5 font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50`,
  {
    variants: {
      variant: {
        default: 'bg-accent-blue text-accent-contrast hover:bg-accent-blue-hover',
        destructive: 'bg-signal-error text-accent-contrast hover:bg-signal-error/90',
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

interface SplitButtonProps extends VariantProps<typeof _splitButtonVariants> {
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
  /** Data testid for testing */
  'data-testid'?: string;
}

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
  'data-testid': testId,
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
        return 'bg-accent-blue text-accent-contrast hover:bg-accent-blue-hover';
      case 'destructive':
        return 'bg-signal-error text-accent-contrast hover:bg-signal-error/90';
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
      {/* Primary button - using Button component */}
      <Button
        onClick={handlePrimaryClick}
        disabled={disabled}
        variant={variant === 'destructive' ? 'destructive-outline' : variant}
        size={size}
        className={cn(
          'rounded-l-lg rounded-r-none',
          variant === 'destructive' &&
            'bg-signal-error text-accent-contrast hover:bg-signal-error/90'
        )}
        data-testid={testId}
      >
        {icon !== undefined && (
          <span className="shrink-0" data-testid="split-button-icon">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </Button>

      {/* Visual separator */}
      <div className={cn('w-px self-stretch', getSeparatorColor())} aria-hidden="true" />

      {/* Dropdown menu */}
      <Menu.Root open={open} onOpenChange={setOpen}>
        <Menu.Trigger
          render={(props) => (
            <Button
              {...props}
              variant={variant}
              size={size}
              className={cn(
                'rounded-r-lg rounded-l-none',
                getTriggerClasses(),
                getTriggerSizeClasses()
              )}
              aria-label={dropdownAriaLabel}
              aria-haspopup="menu"
              aria-expanded={open}
              data-testid={testId !== undefined ? `${testId}-dropdown` : undefined}
            >
              <ChevronDown
                size={size === 'xs' ? 12 : 14}
                className={cn('transition-transform', open && 'rotate-180')}
              />
            </Button>
          )}
        />

        <Menu.Portal>
          {/* Fixed overlay ensures dropdown stacks above sticky/pinned columns */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: OVERLAY_Z_INDEX,
              pointerEvents: 'none',
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <Menu.Positioner sideOffset={4} align="end">
                <Menu.Popup
                  style={{ zIndex: OVERLAY_Z_INDEX }}
                  className="min-w-[140px] bg-bg-elevated border border-border-default rounded-lg shadow-lg overflow-hidden py-1 animate-in fade-in-0 zoom-in-95"
                >
                  {items.map((item, index) => {
                    if (!isMenuItemGuard(item)) {
                      return (
                        <Menu.Separator
                          key={`separator-${String(index)}`}
                          className="h-px bg-border-subtle my-1"
                        />
                      );
                    }

                    return (
                      <Menu.Item
                        key={item.id}
                        label={item.label}
                        className={cn(
                          'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer outline-none transition-colors',
                          item.destructive === true
                            ? 'text-signal-error hover:bg-signal-error/10 focus:bg-signal-error/10'
                            : 'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus:bg-bg-raised focus:text-text-primary',
                          item.disabled === true && 'opacity-50 cursor-not-allowed'
                        )}
                        disabled={item.disabled}
                        onClick={() => {
                          handleItemClick(item);
                        }}
                        closeOnClick={true}
                      >
                        {item.icon !== undefined && <span className="shrink-0">{item.icon}</span>}
                        <span>{item.label}</span>
                      </Menu.Item>
                    );
                  })}
                </Menu.Popup>
              </Menu.Positioner>
            </div>
          </div>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
};
