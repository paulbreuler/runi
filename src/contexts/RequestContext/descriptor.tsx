/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { FC } from 'react';
import { Send, Square, Columns2 } from 'lucide-react';
import type { CanvasContextDescriptor, CanvasPanelProps } from '@/types/canvas';
import { RequestBuilder } from '@/components/Request/RequestBuilder';
import { ResponseViewer } from '@/components/Response/ResponseViewer';
import { RequestCanvasToolbar } from './RequestCanvasToolbar';
import { useRequestStore } from '@/stores/useRequestStore';

// Wrapper components to adapt existing components to CanvasPanelProps
const RequestBuilderPanel: FC<CanvasPanelProps> = (): React.JSX.Element => {
  return <RequestBuilder />;
};

const ResponseViewerPanel: FC<CanvasPanelProps> = (): React.JSX.Element => {
  const { response } = useRequestStore();
  return <ResponseViewer response={response} />;
};

/**
 * Request context descriptor
 *
 * Defines the Request context for the canvas architecture.
 * Registers existing RequestBuilder and ResponseViewer components
 * as panel slots with context-specific toolbar and layout presets.
 */
export const requestContextDescriptor: CanvasContextDescriptor = {
  id: 'request',
  label: 'Request',
  icon: Send,
  contextType: 'request', // Mark this as a template

  // Existing components as panel slots
  panels: {
    request: RequestBuilderPanel,
    response: ResponseViewerPanel,
  },

  // Context-specific toolbar
  toolbar: RequestCanvasToolbar,

  // Three layout presets
  layouts: [
    {
      id: 'request-default',
      label: 'Request + Response',
      description: 'Side by side',
      icon: Columns2,
      category: 'preset',
      arrangement: {
        type: 'columns',
        panels: ['request', 'response'],
        ratios: [50, 50],
      },
    },
    {
      id: 'request-only',
      label: 'Request Only',
      description: 'Full editor',
      icon: Square,
      category: 'preset',
      arrangement: {
        type: 'single',
        panel: 'request',
      },
    },
    {
      id: 'response-only',
      label: 'Response Only',
      description: 'Full viewer',
      icon: Square,
      category: 'preset',
      arrangement: {
        type: 'single',
        panel: 'response',
      },
    },
  ],

  popoutEnabled: true,
  popoutDefaults: {
    width: 1200,
    height: 800,
    title: 'runi - Request',
  },

  order: 10,
  shortcutHint: 'Cmd+1',
};
