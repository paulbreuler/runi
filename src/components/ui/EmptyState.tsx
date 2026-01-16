import React from 'react';
import { motion, type Variant } from 'motion/react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  muted?: boolean;
}

// Motion variants following best practices - reusable animation states
const containerVariants: Record<string, Variant> = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1], // Custom bezier for smooth Apple-like motion
      staggerChildren: 0.1, // Stagger child animations
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Record<string, Variant> = {
  hidden: {
    opacity: 0,
    y: 5,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1], // Apple's preferred easing curve
    },
  },
};

const iconVariants: Record<string, Variant> = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * Beautiful, zen-mode empty state component.
 * Inspired by Apple's calm, minimal design language.
 * Uses Motion variants for clean, maintainable animations.
 */
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = '',
  muted = false,
}: EmptyStateProps): React.JSX.Element => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={
        muted
          ? `flex flex-col items-center justify-center h-full text-center ${className}`
          : `flex flex-col items-center justify-center px-8 py-16 text-center ${className}`
      }
    >
      {/* Icon - subtle, soft, Apple-style (only show when not muted) */}
      {icon && !muted && (
        <motion.div
          variants={iconVariants}
          className="mb-8"
        >
          {icon}
        </motion.div>
      )}
      
      {/* Wrapper for muted content to match request empty states */}
      {muted ? (
        <motion.div
          variants={itemVariants}
          className="text-text-muted/50 max-w-md px-6"
        >
          <p className="text-sm leading-relaxed">{title}</p>
          {description && (
            <p className="text-xs mt-2 leading-relaxed">{description}</p>
          )}
        </motion.div>
      ) : (
        <>
          {/* Title - clear, readable, Apple-style typography */}
          <motion.h3
            variants={itemVariants}
            className="text-2xl font-semibold text-text-primary mb-3 tracking-tight"
          >
            {title}
          </motion.h3>

          {/* Description - warm, helpful, Apple-style spacing */}
          {description && (
            <motion.p
              variants={itemVariants}
              className="text-base text-text-secondary max-w-md leading-relaxed mb-8"
            >
              {description}
            </motion.p>
          )}
        </>
      )}


      {/* Action - clear CTA */}
      {action && (
        <motion.div variants={itemVariants}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
};
