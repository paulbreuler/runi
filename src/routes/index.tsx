import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { executeRequest } from '@/api/http';
import { createRequestParams, type HttpMethod } from '@/types/http';
import { RequestHeader } from '@/components/Request/RequestHeader';
import { StatusBadge } from '@/components/Response/StatusBadge';
import { useRequestStore } from '@/stores/useRequestStore';
import { MainLayout } from '@/components/Layout/MainLayout';

export const HomePage = (): React.JSX.Element => {
  const { method, response, isLoading, error, setMethod, setUrl, setResponse, setLoading, setError } =
    useRequestStore();

  const [localUrl, setLocalUrl] = useState('https://httpbin.org/get');
  const [localMethod, setLocalMethod] = useState<HttpMethod>(method as HttpMethod);

  const isValidUrl = localUrl.length > 0;

  const handleSend = async (): Promise<void> => {
    if (!isValidUrl) return;

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

  return (
    <MainLayout
      headerContent={
        <RequestHeader
          method={localMethod}
          url={localUrl}
          loading={isLoading}
          onMethodChange={handleMethodChange}
          onUrlChange={handleUrlChange}
          onSend={handleSend}
        />
      }
      requestContent={
        <div className="h-full flex flex-col">
          {error && (
            <div
              className="p-4 bg-signal-error/10 border border-signal-error/20 rounded-lg text-signal-error m-4"
              role="alert"
              data-testid="error-panel"
            >
              <strong>Error:</strong> {error}
            </div>
          )}
          <div className="flex-1 flex items-center justify-center text-text-secondary">
            <span
              className="text-xs font-semibold bg-bg-raised px-2 py-1 rounded mr-2"
              style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', emoji, sans-serif" }}
            >
              🚧 WIP
            </span>
            Request builder content will go here
          </div>
        </div>
      }
      responseContent={
        <div className="h-full flex flex-col">
          <AnimatePresence mode="wait">
            {response ? (
              <motion.div
                key="response"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex justify-between items-center px-4 py-2 border-b border-border-default bg-bg-surface">
                  <StatusBadge status={response.status} statusText={response.status_text} />
                  <span
                    className="text-text-secondary text-sm font-mono transition-colors duration-200"
                    data-testid="response-timing"
                  >
                    {response.timing.total_ms}ms
                  </span>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-bg-surface">
                  <pre
                    className="font-mono text-sm whitespace-pre-wrap break-words text-text-primary"
                    data-testid="response-body"
                  >
                    {response.body}
                  </pre>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-text-secondary px-6"
              >
                <div className="text-center max-w-md">
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Ready to make your first request?
                  </h3>
                  <p className="text-sm text-text-secondary mb-4">
                    We've pre-filled a sample URL for you. Click <strong>Send</strong> to see it in action, or try your
                    own API endpoint.
                  </p>
                  <p className="text-xs text-text-muted">
                    This is <strong>Rung 1</strong> of the Adoption Ladder: Your first request reveals the response
                    viewer and request history.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    />
  );
};
