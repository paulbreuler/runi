/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useEffect } from 'react';
import { executeRequest } from '@/api/http';
import { isAppError, type AppError } from '@/types/errors';
import { getConsoleService } from '@/services/console-service';
import { getCorrelationId } from '@/utils/correlation-id';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { createRequestParams, type HttpMethod } from '@/types/http';
import { UrlBar } from '@/components/UrlBar/UrlBar';
import { RequestBuilder } from '@/components/Request/RequestBuilder';
import { ResponseViewer } from '@/components/Response/ResponseViewer';
import { VigilanceMonitor } from '@/components/ui/VigilanceMonitor';
import { useRequestStore } from '@/stores/useRequestStore';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { useTabSync } from '@/hooks/useTabSync';

const getStatusColorClass = (status: number): string => {
  if (status >= 200 && status < 300) {
    return 'text-signal-success';
  }
  if (status >= 300 && status < 400) {
    return 'text-accent-blue';
  }
  if (status >= 400 && status < 500) {
    return 'text-signal-warning';
  }
  if (status >= 500) {
    return 'text-signal-error';
  }
  return 'text-text-secondary';
};

export const HomePage = (): React.JSX.Element => {
  const {
    method,
    url,
    headers,
    body,
    response,
    isLoading,
    setMethod,
    setUrl,
    setResponse,
    setLoading,
  } = useRequestStore();

  const { addEntry, loadHistory } = useHistoryStore();
  const { enabled: collectionsEnabled } = useFeatureFlag('http', 'collectionsEnabled');

  const initialSidebarVisible =
    (typeof window !== 'undefined' &&
      (window.location.search.includes('e2eSidebar=1') ||
        (window as { __RUNI_E2E__?: { sidebarVisible?: boolean } }).__RUNI_E2E__?.sidebarVisible ===
          true)) ||
    collectionsEnabled;

  const [localUrl, setLocalUrl] = useState('https://httpbin.org/get');
  const [localMethod, setLocalMethod] = useState<HttpMethod>(method as HttpMethod);

  useEffect(() => {
    setLocalUrl(url);
    setLocalMethod(method as HttpMethod);
  }, [method, url]);

  // Load history on mount
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const isValidUrl = localUrl.length > 0;

  // Tab ↔ Request store sync: manages multi-tab state, event handlers,
  // and bidirectional sync between useTabStore and useRequestStore.
  useTabSync();

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

  const handleSendClick = (): void => {
    void handleSend();
  };

  const getVigilanceLabel = (): React.ReactNode => {
    if (isLoading) {
      return 'Executing request...';
    }
    if (response !== null) {
      const bytes = new Blob([response.body]).size;
      let size = `${String(bytes)} B`;
      if (bytes >= 1024 * 1024) {
        size = `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      } else if (bytes >= 1024) {
        size = `${(bytes / 1024).toFixed(1)} KB`;
      }
      const statusColor = getStatusColorClass(response.status);
      return (
        <>
          <span className={statusColor}>
            {response.status} {response.status_text}
          </span>
          {' · '}
          {response.timing.total_ms}ms · {size}
        </>
      );
    }
    return 'Ready';
  };

  return (
    <MainLayout
      initialSidebarVisible={initialSidebarVisible}
      headerContent={
        <UrlBar
          method={localMethod}
          url={localUrl}
          loading={isLoading}
          onMethodChange={handleMethodChange}
          onUrlChange={handleUrlChange}
          onSend={handleSendClick}
        />
      }
      requestContent={
        <div className="h-full flex flex-col bg-bg-app">
          <div className="flex-1 overflow-hidden">
            <RequestBuilder />
          </div>
        </div>
      }
      responseContent={
        <div className="h-full flex flex-col bg-bg-app">
          <div className="flex-1 flex flex-col overflow-hidden">
            <ResponseViewer
              response={response}
              vigilanceSlot={
                <VigilanceMonitor visible active={isLoading} label={getVigilanceLabel()} />
              }
            />
          </div>
        </div>
      }
    />
  );
};
