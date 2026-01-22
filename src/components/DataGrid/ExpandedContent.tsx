/**
 * @file ExpandedContent component
 * @description Wrapper component for expanded row content with animation and alignment
 *
 * This component provides:
 * - Smooth height/opacity animation for row expansion (Feature #16)
 * - Proper left margin alignment with first data column (Feature #17)
 * - Respects prefers-reduced-motion setting
 *
 * @example
 * ```tsx
 * <ExpandedContent>
 *   <ExpandedPanel entry={entry} />
 * </ExpandedContent>
 * ```
 */

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { EXPANDED_CONTENT_LEFT_MARGIN_PX } from './constants';

export interface ExpandedContentProps {
  /** Content to display in expanded row */
  children: React.ReactNode;
  /** Whether the content is visible (for AnimatePresence) */
  isVisible?: boolean;
  /** Custom className for the inner wrapper div (default: bg-bg-elevated border-t border-border-subtle) */
  innerClassName?: string;
}

/**
 * ExpandedContent - Wrapper for expanded row content with animation and alignment.
 *
 * Handles:
 * - Smooth expansion/collapse animation (height and opacity)
 * - Left margin alignment with first data column
 * - Respects prefers-reduced-motion preference
 *
 * This component should be used inside a `<td colSpan={columnCount}>` element
 * to span all columns in the expanded row.
 */
export const ExpandedContent = ({
  children,
  isVisible = true,
  innerClassName = 'bg-bg-elevated border-t border-border-subtle',
}: ExpandedContentProps): React.JSX.Element => {
  const shouldReduceMotion = useReducedMotion() === true;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-testid="expanded-section"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div
            className={innerClassName}
            style={{ marginLeft: `${String(EXPANDED_CONTENT_LEFT_MARGIN_PX)}px` }}
          >
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
