import { cn } from '@/utils/cn';

interface ActionBarGroupProps {
  /** Child components within this group */
  children: React.ReactNode;
  /** Show vertical separator line after this group */
  separator?: boolean;
  /** Alignment of this group within the ActionBar */
  align?: 'start' | 'end';
  /** Additional CSS classes */
  className?: string;
  /** ARIA role for the group */
  role?: 'group' | 'none';
  /** ARIA label for the group */
  'aria-label'?: string;
}

/**
 * ActionBarGroup - Semantic grouping with optional visual separator.
 *
 * Use to group related controls together within an ActionBar.
 *
 * @example
 * ```tsx
 * <ActionBar>
 *   <ActionBarGroup>
 *     <ActionBarSearch ... />
 *     <ActionBarSelect ... />
 *   </ActionBarGroup>
 *   <ActionBarGroup align="end" separator>
 *     <Button>Save</Button>
 *   </ActionBarGroup>
 * </ActionBar>
 * ```
 */
export const ActionBarGroup = ({
  children,
  separator = false,
  align = 'start',
  className,
  role = 'group',
  'aria-label': ariaLabel,
}: ActionBarGroupProps): React.JSX.Element => {
  return (
    <div
      className={cn(
        'flex items-center gap-2',
        align === 'end' && 'ml-auto',
        separator && 'pr-3 border-r border-border-subtle',
        className
      )}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
};
