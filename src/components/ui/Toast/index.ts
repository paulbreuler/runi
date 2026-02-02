/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Toast notification system using Base UI and Motion.
 *
 * @example
 * ```tsx
 * // In App.tsx - wrap with provider
 * import { ToastProvider } from '@/components/ui/Toast';
 *
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // Anywhere - trigger toasts
 * import { toast } from '@/components/ui/Toast';
 *
 * toast.success({ message: 'Request sent!' });
 * toast.error({ message: 'Failed', details: 'Network error' });
 *
 * // Or via event bus (loose coupling)
 * globalEventBus.emit('toast.show', {
 *   type: 'success',
 *   message: 'Request sent!',
 * });
 * ```
 */

export { ToastProvider } from './ToastProvider';
export { Toast } from './Toast';
export { ToastBell } from './ToastBell';
export { toast, useToastCount, setupToastEventBridge } from './useToast';
export type { ToastData, ToastVariant, ToastOptions } from './toast.types';
export { DEFAULT_DURATIONS, DEDUPLICATION_WINDOW_MS } from './toast.types';
