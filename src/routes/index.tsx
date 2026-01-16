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
        <div className="h-full flex flex-col bg-bg-app">
          {error && (
            <div
              className="p-4 mx-6 mt-6 bg-signal-error/10 border border-signal-error/20 rounded-xl text-signal-error"
              role="alert"
              data-testid="error-panel"
            >
              <strong>Error:</strong> {error}
            </div>
          )}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-bg-surface/50 border border-border-subtle">
              <span
                className="text-sm"
                style={{ fontFamily: "'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', emoji, sans-serif" }}
              >
                🚧
              </span>
              <span className="text-sm text-text-muted">Request builder coming soon</span>
            </div>
          </div>
        </div>
      }
      responseContent={
        <div className="h-full flex flex-col bg-bg-app">
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
                <div className="flex justify-between items-center px-6 py-3 border-b border-border-subtle bg-bg-surface">
                  <StatusBadge status={response.status} statusText={response.status_text} />
                  <span
                    className="text-text-muted text-xs font-mono transition-colors duration-200"
                    data-testid="response-timing"
                  >
                    {response.timing.total_ms}ms
                  </span>
                </div>

                <div className="flex-1 overflow-auto p-6 bg-bg-app">
                  <pre
                    className="font-mono text-sm whitespace-pre-wrap break-words text-text-secondary leading-relaxed"
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
                className="flex-1 flex flex-col items-center justify-center px-8"
              >
                <div className="text-center max-w-md p-8 rounded-xl bg-bg-surface/30 border border-border-subtle">
                  <h3 className="text-xl font-semibold text-text-primary mb-3 tracking-tight">
                    Ready to make your first request?
                  </h3>
                  <p className="text-sm text-text-secondary mb-5 leading-relaxed">
                    We've pre-filled a sample URL for you. Click{' '}
                    <span className="text-accent-blue font-medium">Send</span> to see it in action.
                  </p>
                  <p className="text-xs text-text-muted leading-relaxed opacity-70">
                    This is <span className="text-signal-success">Rung 1</span> of the Adoption Ladder — your first request reveals the response viewer.
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
