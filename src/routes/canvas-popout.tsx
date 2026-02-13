/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { type FC, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { CanvasHost } from '@/components/Layout/CanvasHost';
import { globalEventBus } from '@/events/bus';
import { requestContextDescriptor } from '@/contexts/RequestContext';

export const CanvasPopout: FC = () => {
  const { contextId } = useParams<{ contextId: string }>();
  const [searchParams] = useSearchParams();
  const { contexts, setActiveContext, setPopout, registerTemplate, registerContext } =
    useCanvasStore();

  useEffect(() => {
    if (contextId === undefined) {
      return;
    }

    // Ensure templates are registered (required for reconstructing request contexts)
    registerTemplate(requestContextDescriptor);

    // If this is a request tab and context descriptor is missing (e.g. page reload),
    // reconstruct it from the template.
    if (contextId.startsWith('request-') && !contexts.has(contextId)) {
      registerContext({
        ...requestContextDescriptor,
        id: contextId,
      });
    }

    // Set active context for this popout
    setActiveContext(contextId);
    setPopout(contextId, true);

    // Restore state from URL params if provided
    const stateParam = searchParams.get('state');
    if (stateParam !== null && stateParam !== '') {
      try {
        const state = JSON.parse(stateParam) as Record<string, unknown>;
        useCanvasStore.getState().setContextState(contextId, state);
      } catch (err) {
        console.error('Failed to restore popout state:', err);
      }
    }

    // Emit opened event
    globalEventBus.emit<{ contextId: string; windowId: string }>('canvas.popout-opened', {
      contextId,
      windowId: window.name !== '' ? window.name : 'popout',
    });

    // Cleanup on unmount
    return (): void => {
      setPopout(contextId, false);
      globalEventBus.emit<{ contextId: string; windowId: string }>('canvas.popout-closed', {
        contextId,
        windowId: window.name !== '' ? window.name : 'popout',
      });
    };
  }, [
    contextId,
    searchParams,
    setActiveContext,
    setPopout,
    contexts,
    registerContext,
    registerTemplate,
  ]);

  if (contextId === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-app text-text-secondary">
        Invalid popout context
      </div>
    );
  }

  const context = contexts.get(contextId);

  if (context === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-app text-text-secondary">
        Context &quot;{contextId}&quot; not found
      </div>
    );
  }

  const ToolbarComponent = context.toolbar;

  return (
    <div className="h-screen flex flex-col bg-bg-app">
      {/* Toolbar */}
      {ToolbarComponent !== undefined && (
        <div className="border-b border-border-default">
          <ToolbarComponent contextId={contextId} isPopout />
        </div>
      )}

      {/* Canvas */}
      <CanvasHost className="flex-1" />
    </div>
  );
};
