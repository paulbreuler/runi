/**
 * useRequestActions hook
 *
 * Manages request execution, including sending requests, updating state,
 * handling errors, and adding entries to history.
 *
 * Extracted from HomePage to enable reuse across request contexts.
 */

import { useState, useEffect } from 'react';
import { executeRequest } from '@/api/http';
import { isAppError, type AppError } from '@/types/errors';
import { getConsoleService } from '@/services/console-service';
import { getCorrelationId } from '@/utils/correlation-id';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { createRequestParams, type HttpMethod } from '@/types/http';
import { useRequestStore } from '@/stores/useRequestStore';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';

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
  const { method, url, headers, body, isLoading, setMethod, setUrl, setResponse, setLoading } =
    useRequestStore();

  const { addEntry } = useHistoryStore();

  const [localUrl, setLocalUrl] = useState('https://httpbin.org/get');
  const [localMethod, setLocalMethod] = useState<HttpMethod>(method as HttpMethod);

  // Sync local state with store on mount and when store changes
  useEffect(() => {
    setLocalUrl(url);
    setLocalMethod(method as HttpMethod);
  }, [method, url]);

  const isValidUrl = localUrl.length > 0;

  const handleSend = async (): Promise<void> => {
    // Guard against invalid URL or double-click while loading
    if (!isValidUrl || isLoading) {
      return;
    }

    setLoading(true);
    setResponse(null);
    setUrl(localUrl);
    setMethod(localMethod);

    try {
      // Get current request state (headers and body from RequestBuilder)
      const currentHeaders = headers;
      const currentBody = body === '' ? null : body;

      const params = createRequestParams(localUrl, localMethod, {
        headers: currentHeaders,
        body: currentBody,
      });
      const result = await executeRequest(params);
      setResponse(result);

      // Check for missing TLS certificate on HTTPS requests
      const isHttps = localUrl.toLowerCase().startsWith('https://');
      const hasTlsTiming = result.timing.tls_ms !== null && result.timing.tls_ms > 0;

      if (isHttps && hasTlsTiming) {
        // TLS was used but certificate data is not captured
        // This is expected behavior until certificate extraction is implemented
        getConsoleService().addLog({
          level: 'warn',
          message: `TLS certificate not captured for HTTPS request to ${localUrl}. Certificate extraction is not yet implemented. Consider opening an issue on GitHub if this is needed.`,
          args: [
            {
              url: localUrl,
              tlsTiming: result.timing.tls_ms,
              note: 'Certificate data extraction from curl is not currently implemented',
            },
          ],
          correlationId: getCorrelationId() ?? undefined,
        });
      }

      // Auto-save to history after successful request
      await addEntry(
        {
          url: localUrl,
          method: localMethod,
          headers: currentHeaders,
          body: currentBody,
          timeout_ms: params.timeout_ms,
        },
        result
      );
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
