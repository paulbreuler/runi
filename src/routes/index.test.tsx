/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from './index';
import { useRequestStore } from '@/stores/useRequestStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { executeRequest } from '@/api/http';

// Mock the stores
vi.mock('@/stores/useRequestStore');
vi.mock('@/stores/useHistoryStore');
vi.mock('@/api/http');

// Mock useTabSync — it's tested in its own test file.
// Mocking prevents it from crashing when useRequestStore is mocked.
vi.mock('@/hooks/useTabSync', () => ({
  useTabSync: vi.fn(),
}));

// Mock event bus (needed for toast emission tests)
vi.mock('@/events/bus', async () => {
  const actual = await vi.importActual('@/events/bus');
  const mockEmit = vi.fn();
  return {
    ...actual,
    globalEventBus: {
      emit: mockEmit,
      on: vi.fn(() => vi.fn()),
      off: vi.fn(),
      once: vi.fn(),
      removeAllListeners: vi.fn(),
      listenerCount: vi.fn(),
    },
    __mockEmit: mockEmit,
  };
});

describe('HomePage - Auto-save to history', () => {
  const mockSetMethod = vi.fn();
  const mockSetUrl = vi.fn();
  const mockSetResponse = vi.fn();
  const mockSetLoading = vi.fn();
  const mockAddEntry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock request store
    vi.mocked(useRequestStore).mockImplementation((selector) => {
      const state = {
        method: 'GET' as const,
        url: 'https://httpbin.org/get',
        headers: {},
        body: '',
        response: null,
        isLoading: false,
        setMethod: mockSetMethod,
        setUrl: mockSetUrl,
        setHeaders: vi.fn(),
        setBody: vi.fn(),
        setResponse: mockSetResponse,
        setLoading: mockSetLoading,
        reset: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return selector !== undefined ? selector(state) : state;
    });

    // Mock history store
    vi.mocked(useHistoryStore).mockImplementation((selector) => {
      const state = {
        entries: [],
        isLoading: false,
        error: null,
        filters: {
          search: '',
          method: 'ALL' as const,
          status: 'All' as const,
          intelligence: 'All' as const,
        },
        selectedId: null,
        selectedIds: new Set<string>(),
        lastSelectedIndex: null,
        expandedId: null,
        compareMode: false,
        compareSelection: [],
        loadHistory: vi.fn(),
        addEntry: mockAddEntry,
        deleteEntry: vi.fn(),
        clearHistory: vi.fn(),
        setFilter: vi.fn(),
        resetFilters: vi.fn(),
        setSelectedId: vi.fn(),
        toggleSelection: vi.fn(),
        selectRange: vi.fn(),
        selectAll: vi.fn(),
        deselectAll: vi.fn(),
        setExpandedId: vi.fn(),
        setCompareMode: vi.fn(),
        toggleCompareSelection: vi.fn(),
        filteredEntries: vi.fn(() => []),
      };
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return selector !== undefined ? selector(state) : state;
    });
  });

  it('should auto-save to history after successful request', async () => {
    const user = userEvent.setup();

    const mockResponse = {
      status: 200,
      status_text: 'OK',
      headers: {},
      body: '{"test": true}',
      timing: {
        total_ms: 150,
        dns_ms: null,
        connect_ms: null,
        tls_ms: null,
        first_byte_ms: null,
      },
    };

    vi.mocked(executeRequest).mockResolvedValue(mockResponse);

    render(<HomePage />);

    // Find URL input and send button
    const urlInput = screen.getByLabelText('Request URL');
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Enter URL and send request
    await user.clear(urlInput);
    await user.type(urlInput, 'https://httpbin.org/get');
    await user.click(sendButton);

    // Wait for request to complete
    await waitFor(() => {
      expect(mockSetResponse).toHaveBeenCalledWith(mockResponse);
    });

    // Verify that addEntry was called with the request params and response
    await waitFor(() => {
      expect(mockAddEntry).toHaveBeenCalled();
      const calls = mockAddEntry.mock.calls;
      const lastCall = calls[calls.length - 1];
      if (lastCall === undefined) {
        throw new Error('lastCall is undefined');
      }
      expect(lastCall[0]).toMatchObject({
        url: 'https://httpbin.org/get',
        method: 'GET',
      });
      expect(lastCall[1]).toEqual(mockResponse);
    });
  });

  it('should NOT save to history if request fails', async () => {
    const user = userEvent.setup();

    const errorMessage = 'Network error';
    vi.mocked(executeRequest).mockRejectedValue(new Error(errorMessage));

    render(<HomePage />);

    const urlInput = screen.getByLabelText('Request URL');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.clear(urlInput);
    await user.type(urlInput, 'https://httpbin.org/get');
    await user.click(sendButton);

    // Wait for toast event to be emitted
    await waitFor(async () => {
      // Import mocked module (__mockEmit is added by vi.mock)
      const busModule = await import('@/events/bus');
      // Type assertion for test-only mock property
      const mockEmit = (busModule as { __mockEmit?: ReturnType<typeof vi.fn> }).__mockEmit;
      expect(mockEmit).toHaveBeenCalledWith(
        'toast.show',
        expect.objectContaining({
          type: 'error',
          message: errorMessage,
        })
      );
    });

    // Verify that addEntry was NOT called
    expect(mockAddEntry).not.toHaveBeenCalled();
  });

  it('should save request with correct headers and body', async () => {
    const user = userEvent.setup();

    // Mock store with headers and body
    vi.mocked(useRequestStore).mockReturnValue({
      method: 'POST',
      url: 'https://httpbin.org/post',
      headers: { 'Content-Type': 'application/json' },
      body: '{"test": true}',
      response: null,
      isLoading: false,
      setMethod: mockSetMethod,
      setUrl: mockSetUrl,
      setHeaders: vi.fn(),
      setBody: vi.fn(),
      setResponse: mockSetResponse,
      setLoading: mockSetLoading,
      reset: vi.fn(),
    });

    const mockResponse = {
      status: 201,
      status_text: 'Created',
      headers: {},
      body: '{"id": 1}',
      timing: {
        total_ms: 200,
        dns_ms: null,
        connect_ms: null,
        tls_ms: null,
        first_byte_ms: null,
      },
    };

    vi.mocked(executeRequest).mockResolvedValue(mockResponse);

    render(<HomePage />);

    const urlInput = screen.getByLabelText('Request URL');
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.clear(urlInput);
    await user.type(urlInput, 'https://httpbin.org/post');
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockAddEntry).toHaveBeenCalled();
      const callArgs = mockAddEntry.mock.calls[0];
      if (callArgs === undefined) {
        throw new Error('callArgs is undefined');
      }
      expect(callArgs[0]).toMatchObject({
        url: 'https://httpbin.org/post',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"test": true}',
      });
      expect(callArgs[1]).toEqual(mockResponse);
    });
  });

  it('syncs URL and method from request store updates', async () => {
    const { rerender } = render(<HomePage />);
    const urlInput = screen.getByLabelText<HTMLInputElement>('Request URL');

    expect(urlInput.value).toBe('https://httpbin.org/get');

    vi.mocked(useRequestStore).mockReturnValue({
      method: 'POST',
      url: 'https://api.example.com/test',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
      setMethod: mockSetMethod,
      setUrl: mockSetUrl,
      setHeaders: vi.fn(),
      setBody: vi.fn(),
      setResponse: mockSetResponse,
      setLoading: mockSetLoading,
      reset: vi.fn(),
    });

    rerender(<HomePage />);

    await waitFor(() => {
      expect(urlInput.value).toBe('https://api.example.com/test');
    });
  });

  // Event-driven tests (history.entry-selected, collection.request-selected) are now tested
  // in useTabSync.test.ts. HomePage delegates to useTabSync for event handling.
  describe('Tab sync delegation', () => {
    it('calls useTabSync hook', async () => {
      const { useTabSync } = await import('@/hooks/useTabSync');
      render(<HomePage />);
      expect(useTabSync).toHaveBeenCalled();
    });
  });
});
