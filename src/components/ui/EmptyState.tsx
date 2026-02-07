/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { motion, type Variant, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';

export type EmptyStateVariant = 'muted' | 'prominent' | 'minimal';
export type EmptyStateSize = 'sm' | 'md' | 'lg';
export type AriaLive = 'polite' | 'assertive' | 'off';

interface EmptyStateProps {
  /** Icon to display (only shown in prominent variant) */
  icon?: React.ReactNode;
  /** Title text (required) */
  title: string;
  /** Description text */
  description?: string;
  /** Action button or element */
  action?: React.ReactNode;
  /** Custom CSS class */
  className?: string;
  /** @deprecated Use variant="muted" instead */
  muted?: boolean;
  /** Visual variant: muted (subtle), prominent (full-featured), minimal (visual placeholder) */
  variant?: EmptyStateVariant;
  /** Size variant: sm, md (default), lg */
  size?: EmptyStateSize;
  /** Custom content slot */
  children?: React.ReactNode;
  /** ARIA live region behavior for dynamic content */
  ariaLive?: AriaLive;
  /** Heading level (1-6, default: 3 for h3) */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** ARIA label override */
  ariaLabel?: string;
  /** ARIA labelledby reference */
  ariaLabelledBy?: string;
  /** ARIA describedby reference */
  ariaDescribedBy?: string;
}

// Size configurations
const sizeConfig = {
  sm: {
    title: 'text-lg',
    description: 'text-sm',
    icon: 'size-8',
    spacing: 'mb-2',
  },
  md: {
    title: 'text-2xl',
    description: 'text-base',
    icon: 'size-12',
    spacing: 'mb-3',
  },
  lg: {
    title: 'text-3xl',
    description: 'text-lg',
    icon: 'size-16',
    spacing: 'mb-4',
  },
} as const;

// Motion variants following best practices - reusable animation states
const createContainerVariants = (reducedMotion: boolean): Record<string, Variant> => ({
  hidden: {
    opacity: 0,
    y: reducedMotion ? 0 : 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: reducedMotion
      ? { duration: 0 }
      : {
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1], // Custom bezier for smooth Apple-like motion
          staggerChildren: 0.1, // Stagger child animations
          delayChildren: 0.05,
        },
  },
});

const createItemVariants = (reducedMotion: boolean): Record<string, Variant> => ({
  hidden: {
    opacity: 0,
    y: reducedMotion ? 0 : 5,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: reducedMotion
      ? { duration: 0 }
      : {
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1], // Apple's preferred easing curve
        },
  },
});

const createIconVariants = (reducedMotion: boolean): Record<string, Variant> => ({
  hidden: {
    opacity: 0,
    scale: reducedMotion ? 1 : 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: reducedMotion
      ? { duration: 0 }
      : {
          duration: 0.5,
          delay: 0.1,
          ease: [0.16, 1, 0.3, 1],
        },
  },
});

/**
 * Beautiful, zen-mode empty state component.
 * Inspired by Apple's calm, minimal design language.
 * Uses Motion variants for clean, maintainable animations.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No items found"
 *   description="Try adjusting your filters"
 *   icon={<Search />}
 *   variant="prominent"
 *   action={<Button>Create Item</Button>}
 * />
 * ```
 */
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  muted = false, // Deprecated, use variant instead
  variant,
  size = 'md',
  children,
  ariaLive = 'off',
  headingLevel = 3,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
}: EmptyStateProps): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion() === true;

  // Determine actual variant (backward compatibility with muted prop)

  const actualVariant: EmptyStateVariant = variant ?? (muted ? 'muted' : 'prominent');

  // Create motion variants based on reduced motion preference
  const containerVariants = createContainerVariants(prefersReducedMotion);
  const itemVariants = createItemVariants(prefersReducedMotion);
  const iconVariants = createIconVariants(prefersReducedMotion);

  // Get size configuration
  const sizeStyles = sizeConfig[size];

  // Determine ARIA attributes (apply individually to avoid type conflicts with Motion)
  const getAriaProps = (): {
    role?: 'status';
    'aria-live'?: 'polite' | 'assertive';
    'aria-label'?: string;
    'aria-labelledby'?: string;
    'aria-describedby'?: string;
  } => {
    const props: {
      role?: 'status';
      'aria-live'?: 'polite' | 'assertive';
      'aria-label'?: string;
      'aria-labelledby'?: string;
      'aria-describedby'?: string;
    } = {};
    if (ariaLive !== 'off') {
      props.role = 'status';
      props['aria-live'] = ariaLive;
    }
    if (ariaLabel !== undefined && ariaLabel.length > 0) {
      props['aria-label'] = ariaLabel;
    }
    if (ariaLabelledBy !== undefined && ariaLabelledBy.length > 0) {
      props['aria-labelledby'] = ariaLabelledBy;
    }
    if (ariaDescribedBy !== undefined && ariaDescribedBy.length > 0) {
      props['aria-describedby'] = ariaDescribedBy;
    }
    return props;
  };

  // Create heading element with proper level
  const headingTags = {
    1: 'h1',
    2: 'h2',
    3: 'h3',
    4: 'h4',
    5: 'h5',
    6: 'h6',
  } as const;
  const HeadingTag = headingTags[headingLevel];

  // Container classes based on variant
  const getContainerPadding = (): string => {
    if (actualVariant === 'muted' || actualVariant === 'minimal') {
      return 'h-full';
    }
    return 'px-8 py-16';
  };
  const containerClasses = cn(
    'flex flex-col items-center justify-center text-center',
    getContainerPadding(),
    className
  );

  // Minimal variant - just visual placeholder
  if (actualVariant === 'minimal') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={containerClasses}
        {...getAriaProps()}
      >
        {children}
      </motion.div>
    );
  }

  // Muted variant
  if (actualVariant === 'muted') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={containerClasses}
        {...getAriaProps()}
        data-test-id="empty-state"
      >
        <motion.div variants={itemVariants} className="text-text-muted/50 max-w-md px-6">
          <p className="text-sm leading-relaxed" data-test-id="empty-state-title">
            {title}
          </p>
          {description !== undefined && (
            <p className="text-xs mt-2 leading-relaxed" data-test-id="empty-state-description">
              {description}
            </p>
          )}
        </motion.div>
        {children}
        {action !== undefined && (
          <motion.div variants={itemVariants} data-test-id="empty-state-action">
            {action}
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Prominent variant (default)
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={containerClasses}
      {...getAriaProps()}
      data-test-id="empty-state"
    >
      {/* Icon - subtle, soft, Apple-style (only show in prominent variant) */}
      {icon !== undefined && (
        <motion.div
          variants={iconVariants}
          className={cn('flex items-center justify-center mb-8', sizeStyles.icon)}
          data-test-id="empty-state-icon"
        >
          {icon}
        </motion.div>
      )}

      {/* Title - clear, readable, Apple-style typography */}
      <motion.div variants={itemVariants}>
        <HeadingTag
          className={cn(
            'font-semibold text-text-primary tracking-tight',
            sizeStyles.title,
            sizeStyles.spacing
          )}
          data-test-id="empty-state-title"
        >
          {title}
        </HeadingTag>
      </motion.div>

      {/* Description - warm, helpful, Apple-style spacing */}
      {description !== undefined && (
        <motion.p
          variants={itemVariants}
          className={cn(
            'text-text-secondary max-w-md leading-relaxed mb-8',
            sizeStyles.description
          )}
          data-test-id="empty-state-description"
        >
          {description}
        </motion.p>
      )}

      {/* Custom children content */}
      {children !== undefined && (
        <motion.div variants={itemVariants} data-test-id="empty-state-children">
          {children}
        </motion.div>
      )}

      {/* Action - clear CTA */}
      {action !== undefined && (
        <motion.div variants={itemVariants} data-test-id="empty-state-action">
          {action}
        </motion.div>
      )}
    </motion.div>
  );
};
