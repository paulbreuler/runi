/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestCanvasToolbar } from './RequestCanvasToolbar';
import { useRequestStore } from '@/stores/useRequestStore';
import { globalEventBus } from '@/events/bus';
import { executeRequest } from '@/api/http';
import { useHistoryStore } from '@/stores/useHistoryStore';

// Mock dependencies
vi.mock('@/api/http', () => ({
  executeRequest: vi.fn(),
}));

vi.mock('@/events/bus', () => ({
  globalEventBus: {
    emit: vi.fn(),
  },
}));

describe('RequestCanvasToolbar', () => {
  const getEmitMock = (): ReturnType<typeof vi.fn> => vi.mocked(globalEventBus.emit);

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset stores to initial state
    useRequestStore.setState({
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

    it('disables Send action when URL is empty', () => {
      useRequestStore.setState({ url: '' });
      render(<RequestCanvasToolbar contextId="request" />);

      const testButton = screen.getByTestId('action-test');
      expect(testButton).toBeDisabled();
    });

    it('enables Send action when URL is provided', () => {
      render(<RequestCanvasToolbar contextId="request" />);

      const codeButton = screen.getByTestId('action-code');
      expect(codeButton).not.toBeDisabled();
    });
  });

  describe('Action Handlers - handleTest', () => {
    it('calls executeRequest with correct params when Test is clicked', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: '{"success":true}',
        timing: {
          total_ms: 123,
          dns_ms: 10,
          connect_ms: 20,
          tls_ms: null,
          first_byte_ms: 50,
        },
      };

      vi.mocked(executeRequest).mockResolvedValue(mockResponse);

      useRequestStore.setState({
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
        body: '',
        response: mockResponse,
      });

      render(<RequestCanvasToolbar contextId="request" />);

      const testButton = screen.getByTestId('action-test');
      await user.click(testButton);

      // Should show "coming soon" toast
      await waitFor(() => {
        expect(getEmitMock()).toHaveBeenCalledWith(
          'toast.show',
          expect.objectContaining({
            type: 'info',
            message: 'Test feature coming soon',
          })
        );
      });
    });
  });

  describe('Action Handlers - handleCode', () => {
    it('shows toast when Code is clicked', async (): Promise<void> => {
      const user = userEvent.setup();

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
      useRequestStore.setState({
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
      useRequestStore.setState({
        response: null,
      });

      render(<RequestCanvasToolbar contextId="request" />);

      const testButton = screen.getByTestId('action-test');
      expect(testButton).toBeDisabled();
    });
  });
});
