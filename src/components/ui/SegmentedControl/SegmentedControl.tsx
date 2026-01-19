/**
 * SegmentedControl - A standalone segmented control component for mutually exclusive options.
 *
 * Features:
 * - Keyboard navigation (Tab, Enter, Space)
 * - Two display variants: full (label + icon), icon-only
 * - Badge counts with optional animation via Motion+
 * - Icon support
 * - Accessible with ARIA attributes
 * - Power-level animation Easter egg when badge counts exceed 9000
 *
 * @example
 * ```tsx
 * <SegmentedControl
 *   value={filter}
 *   onValueChange={setFilter}
 *   options={[
 *     { value: 'all', label: 'All' },
 *     { value: 'error', label: 'Errors', icon: <AlertCircle />, badge: 5 },
 *     { value: 'warn', label: 'Warnings', icon: <AlertTriangle /> },
 *   ]}
 *   aria-label="Filter by log level"
 * />
 * ```
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/utils/cn';
import { MUI_TIER_CONFIG, getSettlingConfig } from './config';
import { usePowerLevel, PowerLevelContext, type PowerLevelContextValue } from './usePowerLevel';
import {
  EnergyEdge,
  EnergyRing,
  BurstFlash,
  ShockwaveRing,
  EdgeFlares,
  EnhancedDissipatingParticles,
} from './effects';
import { BadgeCount } from './BadgeCount';

// ============================================================================
// TYPES
// ============================================================================

interface SegmentOption<T extends string> {
  /** Unique value for this option */
  value: T;
  /** Display label */
  label: string;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Badge count (e.g., error count) */
  badge?: number;
  /** Whether this option is disabled */
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  /** Currently selected value */
  value: T;
  /** Callback when selection changes */
  onValueChange: (value: T) => void;
  /** Available options */
  options: Array<SegmentOption<T>>;
  /** Allow deselection (clicking selected option clears it) */
  allowEmpty?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Display variant: full shows label+icon, icon shows icon only */
  displayVariant?: 'full' | 'icon';
  /** ARIA label for the segment group (required for accessibility) */
  'aria-label': string;
  /** Additional CSS classes */
  className?: string;
  /** Disable the entire control */
  disabled?: boolean;
  /** Maximum badge count before showing + suffix */
  maxBadgeCount?: number;
  /** Whether to animate badge changes using Motion+ */
  animateBadge?: boolean;
}

// ============================================================================
// SIZE CLASSES
// ============================================================================

const sizeClasses = {
  sm: 'h-6 px-1.5 text-xs',
  md: 'h-7 px-2 text-xs',
  lg: 'h-8 px-2.5 text-sm',
};

// ============================================================================
// COMPONENT
// ============================================================================

export const SegmentedControl = <T extends string>({
  value,
  onValueChange,
  options,
  allowEmpty = false,
  size = 'md',
  displayVariant = 'full',
  'aria-label': ariaLabel,
  className,
  disabled = false,
  maxBadgeCount = 99,
  animateBadge = false,
}: SegmentedControlProps<T>): React.JSX.Element => {
  const isIconMode = displayVariant === 'icon';
  const prefersReducedMotion = useReducedMotion();

  // Use the state machine hook for all power level state
  const powerLevel = usePowerLevel(options, prefersReducedMotion);
  const { tier, animationState, config, effectColor, visualFlags, isFinale, isSettling } =
    powerLevel;

  // Get tier-specific settling configuration for explosive dispel effects
  const settlingConfig = getSettlingConfig(tier);

  // Handle click on segment button
  const handleClick = (optionValue: T, optionDisabled?: boolean): void => {
    if (disabled || optionDisabled === true) {
      return;
    }

    if (allowEmpty && value === optionValue) {
      onValueChange('' as T);
    } else {
      onValueChange(optionValue);
    }
  };

  // Get tooltip text for icon mode
  const getTooltip = (option: SegmentOption<T>): string | undefined => {
    if (!isIconMode) {
      return undefined;
    }
    if (option.badge !== undefined && option.badge > 0) {
      return `${option.label} (${String(option.badge)})`;
    }
    return option.label;
  };

  // ============================================================================
  // VISUAL STATE DERIVATION (uses visualFlags for consistency)
  // ============================================================================

  // Aura glow - only during animation phases with glow enabled
  const getGlowIntensity = (): number => {
    if (!visualFlags.shouldShowGlow) {
      return 0;
    }
    if (visualFlags.shouldAnimateEffects) {
      return 1; // Full glow during active animation
    }
    return 0.5; // Reduced glow during sustained
  };
  const glowIntensity = getGlowIntensity();

  const auraBoxShadow =
    prefersReducedMotion !== true && visualFlags.shouldShowEffects && tier > 0 && glowIntensity > 0
      ? `0 0 ${String(config.glowSize * glowIntensity)}px ${String(config.glowSize * 0.3 * glowIntensity)}px ${isFinale ? MUI_TIER_CONFIG.glow : config.glow}`
      : undefined;

  // FIX Bug 2: Tier-based border color tinting - use explicit transparent fallback
  // Only show during tier color display phases, not settling
  const tierBorderColor =
    visualFlags.shouldShowTierColors && tier >= 2 ? `${config.color}40` : 'transparent';

  // FIX Bug 2: Background tint - use explicit transparent fallback
  // At tier 3+, the whole component gets tinted during animation
  const tierBackgroundTint =
    visualFlags.shouldAnimateEffects && tier >= 3 ? `${config.color}10` : 'transparent';

  // Context value for child components (BadgeCount)
  const powerLevelContextValue: PowerLevelContextValue = {
    tier,
    config,
    animationState,
    visualFlags,
    isSettling,
  };

  return (
    <PowerLevelContext.Provider value={powerLevelContextValue}>
      <div className={cn('relative', className)}>
        {/* Burst flash - initial "release" sensation at settling start */}
        {tier > 0 && prefersReducedMotion !== true && (
          <BurstFlash color={effectColor} isActive={isSettling} settlingConfig={settlingConfig} />
        )}

        {/* Enhanced dissipating particles - tier-scaled particle burst */}
        {tier > 0 && prefersReducedMotion !== true && (
          <EnhancedDissipatingParticles
            color={effectColor}
            isActive={isSettling}
            settlingConfig={settlingConfig}
          />
        )}

        {/* Shockwave ring - expanding ring shockwave */}
        {tier > 0 && prefersReducedMotion !== true && (
          <ShockwaveRing
            color={effectColor}
            isActive={isSettling}
            settlingConfig={settlingConfig}
          />
        )}

        {/* Secondary shockwave ring at tier 3+ */}
        {tier >= 3 && prefersReducedMotion !== true && settlingConfig.hasSecondaryRing && (
          <ShockwaveRing
            color={effectColor}
            isActive={isSettling}
            settlingConfig={settlingConfig}
            delay={0.05}
          />
        )}

        {/* Edge flares - energy flares shooting outward at tier 5+ */}
        {tier >= 5 && prefersReducedMotion !== true && settlingConfig.hasEdgeFlares && (
          <EdgeFlares color={effectColor} isActive={isSettling} settlingConfig={settlingConfig} />
        )}

        {/* Energy edge effects - tightly bound to container edges */}
        {tier > 0 && prefersReducedMotion !== true && visualFlags.shouldShowEffects && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            <EnergyEdge
              config={config}
              color={effectColor}
              isFinale={isFinale}
              isAnimating={visualFlags.shouldAnimateEffects}
              isSettling={isSettling}
              position="top"
            />
            <EnergyEdge
              config={config}
              color={effectColor}
              isFinale={isFinale}
              isAnimating={visualFlags.shouldAnimateEffects}
              isSettling={isSettling}
              position="bottom"
            />
          </div>
        )}

        {/* Pulsing energy rings for higher tiers */}
        {tier >= 2 && prefersReducedMotion !== true && visualFlags.shouldShowEffects && (
          <>
            <EnergyRing
              config={config}
              color={effectColor}
              delay={0}
              isAnimating={visualFlags.shouldAnimateEffects}
              isSettling={isSettling}
              settlingConfig={settlingConfig}
            />
            {tier >= 4 && (
              <EnergyRing
                config={config}
                color={effectColor}
                delay={0.4}
                isAnimating={visualFlags.shouldAnimateEffects}
                isSettling={isSettling}
                settlingConfig={settlingConfig}
                isSecondary
              />
            )}
          </>
        )}

        {/* Button group with tier-based aura */}
        <motion.div
          className="flex items-center"
          role="group"
          aria-label={ariaLabel}
          animate={{
            boxShadow: auraBoxShadow ?? '0 0 0 0 rgba(0, 0, 0, 0)',
            borderColor: tierBorderColor,
            backgroundColor: tierBackgroundTint,
          }}
          transition={{ duration: 0.5 }}
        >
          {options.map((option, index) => {
            const isSelected = value === option.value;
            const isFirst = index === 0;
            const isLast = index === options.length - 1;
            const isDisabled = disabled || option.disabled;

            // FIX: Text color - use visualFlags.shouldShowTierColors for consistency
            // At high tiers, text color shifts toward tier color only during active phases
            const tierTextColor =
              visualFlags.shouldShowTierColors && tier >= 4 && prefersReducedMotion !== true
                ? config.color
                : undefined;

            // FIX: Selected button background - use visualFlags.shouldShowTierColors
            // Selected button background tints with tier color at tier 3+ only during active phases
            const tierSelectedBg =
              isSelected &&
              visualFlags.shouldShowTierColors &&
              tier >= 3 &&
              prefersReducedMotion !== true
                ? `${config.color}15`
                : undefined;

            // Determine default text color based on selection state
            const defaultTextColor = isSelected
              ? 'var(--color-text-primary)'
              : 'var(--color-text-muted)';

            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => {
                  handleClick(option.value, option.disabled);
                }}
                disabled={isDisabled}
                className={cn(
                  'transition-colors flex items-center justify-center gap-1 border',
                  sizeClasses[size],
                  // Connected button group styling
                  isFirst && 'rounded-l',
                  isLast && 'rounded-r',
                  !isFirst && '-ml-px',
                  // Selected state (base styling, may be overridden by tier styling)
                  isSelected
                    ? 'bg-bg-raised border-border-default z-10 relative'
                    : 'border-border-subtle hover:bg-bg-raised/50',
                  // Disabled state
                  isDisabled === true &&
                    'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-text-muted',
                  // Icon mode specific sizing
                  isIconMode && 'min-w-[28px]'
                )}
                // FIX Bug 2 & 4: Always animate to explicit values, never undefined
                animate={{
                  color: tierTextColor ?? defaultTextColor,
                  backgroundColor: tierSelectedBg ?? 'transparent',
                }}
                transition={{ duration: 0.3 }}
                aria-pressed={isSelected}
                title={getTooltip(option)}
              >
                {option.icon !== undefined && <span className="shrink-0">{option.icon}</span>}
                {!isIconMode && <span>{option.label}</span>}
                {/* Badge - show in all modes when count > 0 */}
                {option.badge !== undefined && option.badge > 0 && (
                  <BadgeCount
                    count={option.badge}
                    maxCount={maxBadgeCount}
                    animate={animateBadge}
                    isSelected={isSelected}
                  />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </PowerLevelContext.Provider>
  );
};
