/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Toast as ToastPrimitives } from 'radix-ui';
import { cn } from '@/utils/cn';
import { Toast } from './Toast';
import { useToastStore } from './useToast';

export interface ToastProviderProps {
  /** Children to render within the provider */
  children: React.ReactNode;
}

/**
 * Toast provider component.
 *
 * Wraps the application with Radix Toast provider and renders the viewport.
 * Sets up the event bus bridge on mount for loose coupling with other components.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // Select the raw Map to avoid creating new arrays on every render
  const toastsMap = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  // Sort toasts by creation time (newest first) - memoized to avoid recalculating
  const toasts = React.useMemo(
    () => Array.from(toastsMap.values()).sort((a, b) => b.createdAt - a.createdAt),
    [toastsMap]
  );

  // Note: Event bus bridge is set up at module load time in useToast.ts
  // This ensures events are captured even before React renders

  return (
    <ToastPrimitives.Provider swipeDirection="right">
      {children}

      {/* Toast viewport - bottom right */}
      <ToastPrimitives.Viewport
        className={cn(
          'fixed bottom-10 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4',
          'sm:max-w-[420px]'
        )}
        data-test-id="toast-viewport"
        asChild
      >
        <ol>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </ol>
      </ToastPrimitives.Viewport>
    </ToastPrimitives.Provider>
  );
};
