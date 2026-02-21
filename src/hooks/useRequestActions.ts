/**
 * useRequestActions hook
 *
 * Manages request execution, including sending requests, updating state,
 * handling errors, and adding entries to history.
 *
 * Extracted from HomePage to enable reuse across request contexts.
 */

import { useState, useLayoutEffect, useContext } from 'react';
import { executeRequest } from '@/api/http';
import { isAppError, type AppError } from '@/types/errors';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { createRequestParams, type HttpMethod } from '@/types/http';
import { useRequestStore, RequestContextIdContext } from '@/stores/useRequestStore';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { resolveVariables } from '@/utils/variables';

export interface UseRequestActionsReturn {
  /** Local URL state (optimistic) */
  localUrl: string;
  /** Local method state (optimistic) */
  localMethod: HttpMethod;
  /** Whether request is currently loading */
  isLoading: boolean;
  /** Whether URL is valid (non-empty) */
  isValidUrl: boolean;
  /** Send the request */
  handleSend: () => Promise<void>;
  /** Update method (local and store) */
  handleMethodChange: (method: HttpMethod) => void;
  /** Update URL (local only) */
  handleUrlChange: (url: string) => void;
}

/**
 * Hook for request actions (send, method change, URL change)
 */
export const useRequestActions = (): UseRequestActionsReturn => {
  const contextId = useContext(RequestContextIdContext) ?? 'global';
  const { method, url, headers, body, isLoading, setMethod, setUrl, setResponse, setLoading } =
    useRequestStore();

  const { addEntry } = useHistoryStore();

  const [localUrl, setLocalUrl] = useState(() => url);
  const [localMethod, setLocalMethod] = useState<HttpMethod>(() => method as HttpMethod);

  // Keep local draft state aligned with active context before paint to avoid stale URL flashes.
  useLayoutEffect(() => {
    setLocalUrl(url);
    setLocalMethod(method as HttpMethod);
  }, [contextId, method, url]);

  const isValidUrl = localUrl.length > 0;

  const handleSend = async (): Promise<void> => {
    // Guard against invalid URL or double-click while loading
    if (!isValidUrl || isLoading) {
      return;
    }

    // Resolve environment variables before sending
    const canvasState = useCanvasStore.getState();
    const { activeContextId, getContextState } = canvasState;
    const tabState =
      activeContextId !== null
        ? (getContextState(activeContextId) as { source?: { collectionId?: string } })
        : undefined;
    const collectionId = tabState?.source?.collectionId;
    const collection =
      collectionId !== undefined
        ? useCollectionStore.getState().collections.find((c) => c.id === collectionId)
        : undefined;
    const activeEnv = collection?.environments.find(
      (e) => e.name === collection.active_environment
    );
    const envVars: Record<string, string> = {
      ...(collection?.variables ?? {}),
      ...(activeEnv?.variables ?? {}),
    };
    const resolvedUrl = resolveVariables(localUrl, envVars);

    setLoading(true);
    setResponse(null);
    setUrl(localUrl);
    setMethod(localMethod);

    try {
      // Get current request state (headers and body from RequestBuilder)
      const currentHeaders = headers;
      const currentBody = body === '' ? null : body;

      const params = createRequestParams(resolvedUrl, localMethod, {
        headers: currentHeaders,
        body: currentBody,
      });
      const result = await executeRequest(params);
      setResponse(result);

      // Auto-save to history after successful request (use resolved URL)
      await addEntry(
        {
          url: resolvedUrl,
          method: localMethod,
          headers: currentHeaders,
          body: currentBody,
          timeout_ms: params.timeout_ms,
        },
        result
      );

      // Check for history errors and surface via toast
      const historyError = useHistoryStore.getState().error;
      if (historyError !== null) {
        globalEventBus.emit<ToastEventPayload>('toast.show', {
          type: 'error',
          message: historyError,
        });
      }
    } catch (e) {
      // Handle AppError (includes correlation ID for tracing)
      // Extract AppError - may be directly on error object or nested in appError property
      let appError: AppError | undefined;

      // Check if AppError is nested in appError property (when wrapped in Error object)
      if (typeof e === 'object' && e !== null && 'appError' in e && e.appError !== undefined) {
        const err = e as Record<string, unknown>;
        if (isAppError(err.appError)) {
          appError = err.appError;
        }
      } else if (isAppError(e)) {
        // AppError properties are directly on the object (isAppError() type guard guarantees this)
        appError = e;
      }

      if (appError !== undefined) {
        const errorMessage = `[${appError.code}] ${appError.message}`;
        // Show toast notification via event bus (loose coupling)
        globalEventBus.emit<ToastEventPayload>('toast.show', {
          type: 'error',
          message: errorMessage,
          correlationId: appError.correlationId,
        });
        // Do not addLog here; executeRequest already logged to console with correlation ID
      } else {
        const errorMessage = e instanceof Error ? e.message : String(e);
        // Show toast notification via event bus (loose coupling)
        globalEventBus.emit<ToastEventPayload>('toast.show', {
          type: 'error',
          message: errorMessage,
        });
      }
      // Don't save to history on error
    } finally {
      setLoading(false);
    }
  };

  const handleMethodChange = (newMethod: HttpMethod): void => {
    setLocalMethod(newMethod);
    setMethod(newMethod);
  };

  const handleUrlChange = (newUrl: string): void => {
    setLocalUrl(newUrl);
  };

  return {
    localUrl,
    localMethod,
    isLoading,
    isValidUrl,
    handleSend,
    handleMethodChange,
    handleUrlChange,
  };
};
