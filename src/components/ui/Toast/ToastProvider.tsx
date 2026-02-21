/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Toast as BaseUIToast } from '@base-ui/react/toast';
import { cn } from '@/utils/cn';
import { TOAST_Z_INDEX } from '@/utils/z-index';
import { Toast } from './Toast';
import { toastManager } from './useToast';

export interface ToastProviderProps {
  /** Children to render within the provider */
  children: React.ReactNode;
}

/**
 * Toast provider component.
 *
 * Wraps the application with Base UI Toast provider and renders the viewport.
 * Sets up the event bus bridge on mount for loose coupling with other components.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
const ToastViewport = (): React.JSX.Element => {
  const { toasts } = BaseUIToast.useToastManager();

  return (
    <BaseUIToast.Portal>
      <BaseUIToast.Viewport
        className={cn(
          'fixed bottom-10 right-0 flex max-h-screen w-full flex-col-reverse p-4',
          'sm:max-w-[420px]'
        )}
        style={{ zIndex: TOAST_Z_INDEX }}
        data-test-id="toast-viewport"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </BaseUIToast.Viewport>
    </BaseUIToast.Portal>
  );
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  // Note: Event bus bridge is set up at module load time in useToast.ts
  // This ensures events are captured even before React renders

  return (
    <BaseUIToast.Provider toastManager={toastManager}>
      {children}
      <ToastViewport />
    </BaseUIToast.Provider>
  );
};
