import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { executeRequest } from '@/api/http';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { createRequestParams, type HttpMethod } from '@/types/http';
import { RequestHeader } from '@/components/Request/RequestHeader';
import { RequestBuilder } from '@/components/Request/RequestBuilder';
import { StatusBadge } from '@/components/Response/StatusBadge';
import { ResponseViewer } from '@/components/Response/ResponseViewer';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRequestStore } from '@/stores/useRequestStore';
import { MainLayout } from '@/components/Layout/MainLayout';
import { ViewToggle } from '@/components/Layout/ViewToggle';
import { NetworkHistoryPanel } from '@/components/History/NetworkHistoryPanel';
import { globalEventBus } from '@/events/bus';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { NetworkHistoryEntry } from '@/types/history';

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

  const { addEntry, entries, loadHistory } = useHistoryStore();
  const { viewMode, setViewMode } = useSettingsStore();

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

  // Handle replay from history - populate request builder and switch to builder view
  const handleReplay = useCallback(
    (entry: NetworkHistoryEntry): void => {
      setMethod(entry.request.method);
      setUrl(entry.request.url);
      setHeaders(entry.request.headers);
      setBody(entry.request.body ?? '');
      setLocalUrl(entry.request.url);
      setLocalMethod(entry.request.method as HttpMethod);
      setResponse(null);
      setError(null);
      // Switch to builder view
      setViewMode('builder');
    },
    [setMethod, setUrl, setHeaders, setBody, setResponse, setError, setViewMode]
  );

  // Handle copy as cURL - copy request to clipboard as cURL command
  const handleCopyCurl = useCallback((entry: NetworkHistoryEntry): void => {
    const { request } = entry;
    let curl = `curl -X ${request.method} '${request.url}'`;

    // Add headers
    Object.entries(request.headers).forEach(([key, value]) => {
      curl += ` -H '${key}: ${value}'`;
    });

    // Add body
    if (request.body !== null && request.body !== '') {
      curl += ` -d '${request.body}'`;
    }

    void navigator.clipboard.writeText(curl);
  }, []);

  return (
    <MainLayout
      headerContent={
        <div className="flex items-center gap-4 w-full">
          {/* Request header (method selector, URL, send button) */}
          <div className="flex-1">
            <RequestHeader
              method={localMethod}
              url={localUrl}
              loading={isLoading}
              onMethodChange={handleMethodChange}
              onUrlChange={handleUrlChange}
              onSend={handleSendClick}
            />
          </div>

          {/* View toggle */}
          <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      }
      requestContent={
        viewMode === 'builder' ? (
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
        ) : (
          <div className="h-full bg-bg-app">
            <NetworkHistoryPanel
              entries={entries as NetworkHistoryEntry[]}
              onReplay={handleReplay}
              onCopyCurl={handleCopyCurl}
            />
          </div>
        )
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
