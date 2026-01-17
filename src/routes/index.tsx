import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { executeRequest } from '@/api/http';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { createRequestParams, type HttpMethod } from '@/types/http';
import { RequestHeader } from '@/components/Request/RequestHeader';
import { RequestBuilder } from '@/components/Request/RequestBuilder';
import { StatusBadge } from '@/components/Response/StatusBadge';
import { ResponseViewer } from '@/components/Response/ResponseViewer';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRequestStore } from '@/stores/useRequestStore';
import { MainLayout } from '@/components/Layout/MainLayout';
import { globalEventBus } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';

export const HomePage = (): React.JSX.Element => {
  const {
    method,
    headers,
    body,
    response,
    isLoading,
    error,
    setMethod,
    setUrl,
    setHeaders,
    setBody,
    setResponse,
    setLoading,
    setError,
  } = useRequestStore();

  const { addEntry, loadHistory } = useHistoryStore();

  const [localUrl, setLocalUrl] = useState('https://httpbin.org/get');
  const [localMethod, setLocalMethod] = useState<HttpMethod>(method as HttpMethod);

  // Load history on mount
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const isValidUrl = localUrl.length > 0;

  // Subscribe to history entry selection events
  useEffect(() => {
    const unsubscribe = globalEventBus.on<HistoryEntry>('history.entry-selected', (event) => {
      const entry = event.payload;
      // Update request store with history entry data
      setMethod(entry.request.method);
      setUrl(entry.request.url);
      setHeaders(entry.request.headers);
      setBody(entry.request.body ?? '');
      // Update local state to match
      setLocalUrl(entry.request.url);
      setLocalMethod(entry.request.method as HttpMethod);
      // Clear previous response when loading from history
      setResponse(null);
      setError(null);
    });

    return unsubscribe;
    // Zustand store setters are stable and don't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async (): Promise<void> => {
    if (!isValidUrl) {
      return;
    }

    setLoading(true);
    setError(null);
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
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage);
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

  return (
    <MainLayout
      headerContent={
        <RequestHeader
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
          {error !== null && (
            <div
              className="p-4 mx-4 mt-4 bg-signal-error/10 border border-signal-error/20 rounded-lg text-signal-error text-sm"
              role="alert"
              data-testid="error-panel"
            >
              {error}
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <RequestBuilder />
          </div>
        </div>
      }
      responseContent={
        <div className="h-full flex flex-col bg-bg-app">
          <AnimatePresence mode="wait">
            {response !== null ? (
              <motion.div
                key="response"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Status bar */}
                <div className="flex justify-between items-center px-4 py-2 border-b border-border-subtle bg-bg-surface">
                  <StatusBadge status={response.status} statusText={response.status_text} />
                </div>

                {/* Response viewer with tabs */}
                <ResponseViewer response={response} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 h-full"
              >
                <EmptyState
                  title="Response will appear here"
                  description="Send a request to see the response, headers, and timing information displayed in a clear, readable format."
                  muted
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    />
  );
};
