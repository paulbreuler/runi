/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { FC } from 'react';
import type { CanvasToolbarProps } from '@/types/canvas';
import { ActionButtons } from '@/components/ActionBar/ActionButtons';
import { UrlBar } from '@/components/UrlBar/UrlBar';
import { useRequestStore } from '@/stores/useRequestStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useTabStore } from '@/stores/useTabStore';
import { usePanelStore } from '@/stores/usePanelStore';
import { useRequestActions } from '@/hooks/useRequestActions';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';

/**
 * RequestCanvasToolbar - Toolbar for the Request context.
 *
 * Provides action buttons for:
 * - Test: Run tests (coming soon)
 * - Code: Generate code snippet (coming soon)
 * - Docs: Open API documentation (coming soon)
 * - Save: Save to collection (coming soon)
 * - History: Toggle history panel
 * - Env: Environment selector (coming soon)
 *
 * Extracted from HomePage to make Request view a pluggable canvas context.
 */
export const RequestCanvasToolbar: FC<CanvasToolbarProps> = ({
  contextId: _contextId,
  isPopout: _isPopout = false,
}): React.JSX.Element => {
  const { response } = useRequestStore();
  const { toggleVisibility } = usePanelStore();
  const { getActiveTab } = useTabStore();
  const { entries } = useHistoryStore();

  // Request actions from useRequestActions hook
  const { handleSend, handleMethodChange, handleUrlChange, localUrl, localMethod, isLoading } =
    useRequestActions();

  // Secondary action handlers (test, code, docs, save, history, env)

  const handleTest = (): void => {
    void handleSend();
  };

  const handleCode = (): void => {
    globalEventBus.emit<ToastEventPayload>('toast.show', {
      type: 'info',
      message: 'Code generation coming soon',
    });
  };

  const handleDocs = (): void => {
    globalEventBus.emit<ToastEventPayload>('toast.show', {
      type: 'info',
      message: 'API docs feature coming soon',
    });
  };

  const handleSave = (): void => {
    globalEventBus.emit<ToastEventPayload>('toast.show', {
      type: 'info',
      message: 'Save to collection coming soon',
    });
  };

  const handleHistory = (): void => {
    toggleVisibility();
  };

  const handleEnv = (): void => {
    globalEventBus.emit<ToastEventPayload>('toast.show', {
      type: 'info',
      message: 'Environment selector coming soon',
    });
  };

  const activeTab = getActiveTab();
  const historyCount = entries.length;

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0" data-test-id="request-canvas-toolbar">
      <UrlBar
        method={localMethod}
        url={localUrl}
        loading={isLoading}
        onMethodChange={handleMethodChange}
        onUrlChange={handleUrlChange}
        onSend={handleSend}
      />
      <div className="w-px h-5 bg-border-default mx-2 shrink-0" aria-hidden="true" />
      <ActionButtons
        onTest={handleTest}
        onCode={handleCode}
        onDocs={handleDocs}
        onSave={handleSave}
        onHistory={handleHistory}
        onEnv={handleEnv}
        hasResponse={response !== null}
        hasUrl={localUrl.length > 0}
        isDirty={activeTab?.isDirty ?? false}
        historyCount={historyCount}
        envName={undefined}
      />
    </div>
  );
};
