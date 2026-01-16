import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { executeRequest } from '@/api/http';
import { createRequestParams, type HttpMethod } from '@/types/http';
import { RequestHeader } from '@/components/Request/RequestHeader';
import { RequestBuilder } from '@/components/Request/RequestBuilder';
import { StatusBadge } from '@/components/Response/StatusBadge';
import { ResponseViewer } from '@/components/Response/ResponseViewer';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRequestStore } from '@/stores/useRequestStore';
import { MainLayout } from '@/components/Layout/MainLayout';

export const HomePage = (): React.JSX.Element => {
  const {
    method,
    response,
    isLoading,
    error,
    setMethod,
    setUrl,
    setResponse,
    setLoading,
    setError,
  } = useRequestStore();

  const [localUrl, setLocalUrl] = useState('https://httpbin.org/get');
  const [localMethod, setLocalMethod] = useState<HttpMethod>(method as HttpMethod);

  const isValidUrl = localUrl.length > 0;

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
      const params = createRequestParams(localUrl, localMethod);
      const result = await executeRequest(params);
      setResponse(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage);
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
