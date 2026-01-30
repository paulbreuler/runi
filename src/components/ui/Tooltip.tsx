/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { Tooltip as BaseUITooltip } from '@base-ui/react/tooltip';
import React from 'react';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Child element that triggers the tooltip */
  children: React.ReactNode;
  /** Optional delay before showing tooltip (ms) */
  delayDuration?: number;
  /** Optional test ID */
  'data-test-id'?: string;
}

/**
 * Tooltip Provider component.
 * Should be placed at a high level (e.g., app root) to provide tooltip context.
 */
export const TooltipProvider: React.FC<{
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}> = ({ children, delayDuration = 300, skipDelayDuration }) => {
  return (
    <BaseUITooltip.Provider delay={delayDuration} closeDelay={skipDelayDuration}>
      {children}
    </BaseUITooltip.Provider>
  );
};

/**
 * Tooltip component using Base UI.
 *
 * Provides accessible tooltips that work with keyboard navigation.
 * Requires TooltipProvider to be present in the component tree.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delayDuration,
  'data-test-id': testId = 'tooltip',
}) => {
  const childElement = React.Children.only(children) as React.ReactElement;
  const contentTestId = testId.includes('-trigger')
    ? testId.replace('-trigger', '-content')
    : `${testId}-content`;

  return (
    <BaseUITooltip.Root>
      <BaseUITooltip.Trigger
        delay={delayDuration}
        render={(props) => React.cloneElement(childElement, props)}
      />
      <BaseUITooltip.Portal>
        <BaseUITooltip.Positioner sideOffset={5}>
          <BaseUITooltip.Popup
            className={cn(
              'z-50 rounded-md bg-bg-elevated px-2 py-1.5 text-xs text-text-primary shadow-lg',
              'border border-border-subtle max-w-xs break-words',
              'animate-in fade-in-0 zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1',
              'data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1'
            )}
            data-test-id={contentTestId}
          >
            {content}
            <BaseUITooltip.Arrow className="fill-bg-elevated" />
          </BaseUITooltip.Popup>
        </BaseUITooltip.Positioner>
      </BaseUITooltip.Portal>
    </BaseUITooltip.Root>
  );
};
