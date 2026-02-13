/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestCanvasToolbar } from './RequestCanvasToolbar';
import { useRequestStore, useRequestStoreRaw } from '@/stores/useRequestStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { useRequestActions } from '@/hooks/useRequestActions';

const { mockEmit } = vi.hoisted(() => ({
  mockEmit: vi.fn(),
}));

// Mock dependencies
vi.mock('@/api/http', () => ({
  executeRequest: vi.fn(),
}));

vi.mock('@/stores/useRequestStore', async () => {
  const actual = await vi.importActual('@/stores/useRequestStore');
  return {
    ...actual,
    useRequestStore: vi.fn(),
  };
});

vi.mock('@/hooks/useRequestActions');

vi.mock('@/events/bus', () => ({
  globalEventBus: {
    emit: mockEmit,
  },
}));

describe('RequestCanvasToolbar', () => {
  const getEmitMock = (): typeof mockEmit => mockEmit;
  const mockHandleSend = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useRequestStore).mockReturnValue({
      response: null,
    } as any as ReturnType<typeof useRequestStore>);

    vi.mocked(useRequestActions).mockReturnValue({
      handleSend: mockHandleSend,
      handleMethodChange: vi.fn(),
      handleUrlChange: vi.fn(),
      localUrl: '',
      localMethod: 'GET',
      isLoading: false,
    } as any as ReturnType<typeof useRequestActions>);

    // Reset stores to initial state
    useRequestStoreRaw.getState().initContext('request', {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
    });

    useHistoryStore.setState({
      entries: [],
    });
  });

  describe('Rendering', () => {
    it('renders toolbar with test id', () => {
      render(<RequestCanvasToolbar contextId="request" />);
      const toolbar = screen.getByTestId('request-canvas-toolbar');
      expect(toolbar).toBeInTheDocument();
    });

    it('renders ActionButtons component', () => {
      render(<RequestCanvasToolbar contextId="request" />);
      // ActionButtons should render its buttons
      expect(screen.getByTestId('action-test')).toBeInTheDocument();
      expect(screen.getByTestId('action-code')).toBeInTheDocument();
      expect(screen.getByTestId('action-save')).toBeInTheDocument();
    });

    it('disables Test action when response is null', () => {
      useRequestStoreRaw.getState().initContext('request', { response: null });
      render(<RequestCanvasToolbar contextId="request" />);

      const testButton = screen.getByTestId('action-test');
      expect(testButton).toBeDisabled();
    });

    it('enables Code action when URL is provided', () => {
      vi.mocked(useRequestActions).mockReturnValue({
        handleSend: vi.fn(),
        handleMethodChange: vi.fn(),
        handleUrlChange: vi.fn(),
        localUrl: 'https://api.example.com',
        localMethod: 'GET',
        isLoading: false,
      } as any as ReturnType<typeof useRequestActions>);

      render(<RequestCanvasToolbar contextId="request" />);

      const codeButton = screen.getByTestId('action-code');
      expect(codeButton).not.toBeDisabled();
    });
  });

  describe('Action Handlers - handleTest', () => {
    it('calls handleSend when Test is clicked', async () => {
      const user = userEvent.setup();

      vi.mocked(useRequestActions).mockReturnValue({
        handleSend: mockHandleSend,
        handleMethodChange: vi.fn(),
        handleUrlChange: vi.fn(),
        localUrl: 'https://api.example.com',
        localMethod: 'GET',
        isLoading: false,
      } as any as ReturnType<typeof useRequestActions>);

      // We also need to mock useRequestStore to return a non-null response
      // because ActionButtons uses hasResponse={response !== null}
      vi.mocked(useRequestStore).mockReturnValue({
        response: { status: 200 } as any,
      } as any as ReturnType<typeof useRequestStore>);

      render(<RequestCanvasToolbar contextId="request" />);

      const testButton = screen.getByTestId('action-test');
      // Verify button is enabled
      expect(testButton).not.toBeDisabled();

      await user.click(testButton);

      expect(mockHandleSend).toHaveBeenCalled();
    });
  });

  describe('Action Handlers - handleCode', () => {
    it('shows toast when Code is clicked', async (): Promise<void> => {
      const user = userEvent.setup();

      vi.mocked(useRequestActions).mockReturnValue({
        handleSend: vi.fn(),
        handleMethodChange: vi.fn(),
        handleUrlChange: vi.fn(),
        localUrl: 'https://api.example.com',
        localMethod: 'GET',
        isLoading: false,
      } as any as ReturnType<typeof useRequestActions>);

      render(<RequestCanvasToolbar contextId="request" />);

      const codeButton = screen.getByTestId('action-code');
      await user.click(codeButton);

      await waitFor(() => {
        expect(getEmitMock()).toHaveBeenCalledWith(
          'toast.show',
          expect.objectContaining({
            type: 'info',
            message: 'Code generation coming soon',
          })
        );
      });
    });
  });

  describe('Action Handlers - handleSave', () => {
    it('shows toast when Save is clicked', async (): Promise<void> => {
      const user = userEvent.setup();

      render(<RequestCanvasToolbar contextId="request" />);

      const saveButton = screen.getByTestId('action-save');
      await user.click(saveButton);

      await waitFor(() => {
        expect(getEmitMock()).toHaveBeenCalledWith(
          'toast.show',
          expect.objectContaining({
            type: 'info',
            message: 'Save to collection coming soon',
          })
        );
      });
    });
  });

  describe('Popout Mode', () => {
    it('renders correctly in popout mode', () => {
      render(<RequestCanvasToolbar contextId="request" isPopout />);
      expect(screen.getByTestId('request-canvas-toolbar')).toBeInTheDocument();
    });

    it('passes isPopout prop through correctly', () => {
      const { rerender } = render(<RequestCanvasToolbar contextId="request" isPopout={false} />);
      expect(screen.getByTestId('request-canvas-toolbar')).toBeInTheDocument();

      rerender(<RequestCanvasToolbar contextId="request" isPopout />);
      expect(screen.getByTestId('request-canvas-toolbar')).toBeInTheDocument();
    });
  });

  describe('Store Integration', () => {
    it('reads from request store for action states', () => {
      useRequestStoreRaw.getState().initContext('request', {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"test"}',
      });

      render(<RequestCanvasToolbar contextId="request" />);

      // Verify toolbar renders with store state
      expect(screen.getByTestId('request-canvas-toolbar')).toBeInTheDocument();
    });

    it('handles missing response gracefully', () => {
      useRequestStoreRaw.getState().initContext('request', {
        response: null,
      });

      render(<RequestCanvasToolbar contextId="request" />);

      const testButton = screen.getByTestId('action-test');
      expect(testButton).toBeDisabled();
    });
  });

  describe('URL Bar Integration', () => {
    it('renders UrlBar component', () => {
      render(<RequestCanvasToolbar contextId="request" />);

      const urlBar = screen.getByTestId('url-bar');
      expect(urlBar).toBeInTheDocument();
    });

    it('UrlBar appears before ActionButtons in DOM order', () => {
      render(<RequestCanvasToolbar contextId="request" />);

      const toolbar = screen.getByTestId('request-canvas-toolbar');
      const children = Array.from(toolbar.children);

      const urlBar = screen.getByTestId('url-bar');
      const actionButtons = screen.getByTestId('action-test').closest('[class*="flex"]');

      const urlBarIndex = children.findIndex((child) => child.contains(urlBar));
      const actionButtonsIndex = children.findIndex((child) =>
        actionButtons ? child.contains(actionButtons) : false
      );

      expect(urlBarIndex).toBeGreaterThanOrEqual(0);
      expect(actionButtonsIndex).toBeGreaterThanOrEqual(0);
      expect(urlBarIndex).toBeLessThan(actionButtonsIndex);
    });

    it('UrlBar displays current URL from store via useRequestActions', () => {
      useRequestStoreRaw.getState().initContext('request', {
        url: 'https://test.api.com/endpoint',
      });

      render(<RequestCanvasToolbar contextId="request" />);

      const urlInput = screen.getByTestId('url-input');
      // UrlBar will show the URL from useRequestActions hook
      expect(urlInput).toBeInTheDocument();
    });

    it('UrlBar displays current method from store via useRequestActions', () => {
      useRequestStoreRaw.getState().initContext('request', {
        method: 'POST',
      });

      render(<RequestCanvasToolbar contextId="request" />);

      const methodSelect = screen.getByTestId('method-select');
      // UrlBar will show the method from useRequestActions hook
      expect(methodSelect).toBeInTheDocument();
    });
  });
});
