/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { Tooltip as TooltipPrimitive } from 'radix-ui';
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
  'data-testid'?: string;
}

/**
 * Tooltip Provider component.
 * Should be placed at a high level (e.g., app root) to provide tooltip context.
 */
export const TooltipProvider: React.FC<{ children: React.ReactNode; delayDuration?: number }> = ({
  children,
  delayDuration = 300,
}) => {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>{children}</TooltipPrimitive.Provider>
  );
};

/**
 * Tooltip component using Radix UI.
 *
 * Provides accessible tooltips that work with keyboard navigation.
 * Requires TooltipProvider to be present in the component tree.
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  'data-testid': testId = 'tooltip',
}) => {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className={cn(
            'z-50 rounded-md bg-bg-elevated px-2 py-1.5 text-xs text-text-primary shadow-lg',
            'border border-border-subtle max-w-xs break-words',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1',
            'data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1'
          )}
          sideOffset={5}
          data-testid={testId}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-bg-elevated" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};
