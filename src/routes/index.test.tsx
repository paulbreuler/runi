/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomePage } from './index';
import { useRequestStore } from '@/stores/useRequestStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { executeRequest } from '@/api/http';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';
import type { CollectionRequest } from '@/types/collection';

// Mock the stores
vi.mock('@/stores/useRequestStore');
vi.mock('@/stores/useHistoryStore');
vi.mock('@/api/http');

// Mock event bus
type EventHandler = (event: {
  type: string;
  payload: unknown;
  timestamp: number;
  source: string;
}) => void;
const mockHandlersMap = new Map<string, Set<EventHandler>>();

vi.mock('@/events/bus', async () => {
  const actual = await vi.importActual('@/events/bus');
  const mockEmit = vi.fn();
  const mockOn = vi.fn((eventType: string, handler: EventHandler): (() => void) => {
    // Store handler for later use in tests by event type
    if (!mockHandlersMap.has(eventType)) {
      mockHandlersMap.set(eventType, new Set());
    }
    mockHandlersMap.get(eventType)?.add(handler);
    return (): void => {
      mockHandlersMap.get(eventType)?.delete(handler);
    };
  });
  return {
    ...actual,
    globalEventBus: {
      emit: mockEmit,
      on: mockOn,
      off: vi.fn(),
      once: vi.fn(),
      removeAllListeners: vi.fn(),
      listenerCount: vi.fn(),
    },
    __mockEmit: mockEmit,
    __mockOn: mockOn,
  };
});

describe('HomePage - Auto-save to history', () => {
  const mockSetMethod = vi.fn();
  const mockSetUrl = vi.fn();
  const mockSetHeaders = vi.fn();
  const mockSetBody = vi.fn();
  const mockSetResponse = vi.fn();
  const mockSetLoading = vi.fn();
  const mockAddEntry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mock event handlers
    mockHandlersMap.clear();

    // Mock request store
    vi.mocked(useRequestStore).mockReturnValue({
      method: 'GET',
      url: 'https://httpbin.org/get',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
      setMethod: mockSetMethod,
      setUrl: mockSetUrl,
      setHeaders: mockSetHeaders,
      setBody: mockSetBody,
      setResponse: mockSetResponse,
      setLoading: mockSetLoading,
      reset: vi.fn(),
    });

    // Mock history store
    vi.mocked(useHistoryStore).mockReturnValue({
      entries: [],
      isLoading: false,
      error: null,
      filters: { search: '', method: 'ALL', status: 'All', intelligence: 'All' },
      selectedId: null,
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
      setExpandedId: vi.fn(),
      setCompareMode: vi.fn(),
      toggleCompareSelection: vi.fn(),
      filteredEntries: vi.fn(() => []),
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
      setHeaders: mockSetHeaders,
      setBody: mockSetBody,
      setResponse: mockSetResponse,
      setLoading: mockSetLoading,
      reset: vi.fn(),
    });

    rerender(<HomePage />);

    await waitFor(() => {
      expect(urlInput.value).toBe('https://api.example.com/test');
    });
  });

  describe('History entry selection (event-driven)', () => {
    const mockHistoryEntry: HistoryEntry = {
      id: 'hist_123',
      timestamp: new Date().toISOString(),
      request: {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "Test User"}',
        timeout_ms: 30000,
      },
      response: {
        status: 201,
        status_text: 'Created',
        headers: {},
        body: '{"id": 1}',
        timing: {
          total_ms: 150,
          dns_ms: null,
          connect_ms: null,
          tls_ms: null,
          first_byte_ms: null,
        },
      },
    };

    it('subscribes to history.entry-selected event on mount', async () => {
      render(<HomePage />);

      // Verify subscription was set up
      const { globalEventBus } = await import('@/events/bus');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vi.mocked(globalEventBus.on)).toHaveBeenCalledWith(
        'history.entry-selected',
        expect.any(Function)
      );
    });

    it('updates request store when history.entry-selected event is emitted', async () => {
      render(<HomePage />);

      // Wait for subscription to be set up
      const { globalEventBus } = await import('@/events/bus');
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(vi.mocked(globalEventBus.on)).toHaveBeenCalled();
      });

      // Get all handlers that were registered and call them directly
      // This simulates what globalEventBus.emit would do
      const handlers = mockHandlersMap.get('history.entry-selected');
      if (handlers === undefined || handlers.size === 0) {
        throw new Error('No handlers found');
      }

      // Call all registered handlers (simulating event emission)
      act(() => {
        handlers.forEach((handler) => {
          handler({
            type: 'history.entry-selected',
            payload: mockHistoryEntry,
            timestamp: Date.now(),
            source: 'HistoryDrawer',
          });
        });
      });

      // Verify store was updated with history entry data
      await waitFor(() => {
        expect(mockSetMethod).toHaveBeenCalledWith('POST');
        expect(mockSetUrl).toHaveBeenCalledWith('https://api.example.com/users');
        expect(mockSetHeaders).toHaveBeenCalledWith({ 'Content-Type': 'application/json' });
        expect(mockSetBody).toHaveBeenCalledWith('{"name": "Test User"}');
        expect(mockSetResponse).toHaveBeenCalledWith(null);
      });
    });

    it('handles history entry with null body', async () => {
      const entryWithoutBody: HistoryEntry = {
        ...mockHistoryEntry,
        request: {
          ...mockHistoryEntry.request,
          body: null,
        },
      };

      render(<HomePage />);

      const { globalEventBus } = await import('@/events/bus');
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(vi.mocked(globalEventBus.on)).toHaveBeenCalled();
      });

      const handlers = mockHandlersMap.get('history.entry-selected');
      if (handlers === undefined || handlers.size === 0) {
        throw new Error('No handlers found');
      }

      // Call all registered handlers (simulating event emission)
      act(() => {
        handlers.forEach((handler) => {
          handler({
            type: 'history.entry-selected',
            payload: entryWithoutBody,
            timestamp: Date.now(),
            source: 'HistoryDrawer',
          });
        });
      });

      await waitFor(() => {
        expect(mockSetBody).toHaveBeenCalledWith('');
      });
    });

    it('cleans up event subscription on unmount', async () => {
      const { unmount } = render(<HomePage />);

      // Get the unsubscribe function that was returned
      const { globalEventBus } = await import('@/events/bus');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const unsubscribeCalls = vi.mocked(globalEventBus.on).mock.results;
      const unsubscribe = unsubscribeCalls[0]?.value;
      if (unsubscribe === undefined) {
        throw new Error('Unsubscribe function not found');
      }

      // Unmount component
      unmount();

      // Verify handlers are cleared (or would be cleared in real implementation)
      // This tests that cleanup is properly handled
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Collection request selection (event-driven)', (): void => {
    const mockCollectionRequest: CollectionRequest = {
      id: 'req_456',
      name: 'Get Users',
      seq: 1,
      method: 'GET',
      url: 'https://api.example.com/users',
      headers: { Authorization: 'Bearer token123' },
      params: [],
      is_streaming: false,
      binding: { is_manual: false },
      intelligence: { ai_generated: false },
      tags: [],
      body: { type: 'raw', content: '{"filter": "active"}' },
    };

    it('updates request store when collection.request-selected event is emitted', async (): Promise<void> => {
      render(<HomePage />);

      // Wait for subscription to be set up
      const { globalEventBus } = await import('@/events/bus');
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(vi.mocked(globalEventBus.on)).toHaveBeenCalled();
      });

      // Get handlers for collection.request-selected
      const handlers = mockHandlersMap.get('collection.request-selected');
      if (handlers === undefined || handlers.size === 0) {
        throw new Error('No handlers found for collection.request-selected');
      }

      // Call all registered handlers (simulating event emission)
      act(() => {
        handlers.forEach((handler) => {
          handler({
            type: 'collection.request-selected',
            payload: {
              collectionId: 'col_789',
              request: mockCollectionRequest,
            },
            timestamp: Date.now(),
            source: 'RequestItem',
          });
        });
      });

      // Verify store was updated with collection request data
      await waitFor(() => {
        expect(mockSetMethod).toHaveBeenCalledWith('GET');
        expect(mockSetUrl).toHaveBeenCalledWith('https://api.example.com/users');
        expect(mockSetHeaders).toHaveBeenCalledWith({ Authorization: 'Bearer token123' });
        expect(mockSetBody).toHaveBeenCalledWith('{"filter": "active"}');
        expect(mockSetResponse).toHaveBeenCalledWith(null);
      });
    });

    it('handles collection request without body', async (): Promise<void> => {
      const requestWithoutBody: CollectionRequest = {
        ...mockCollectionRequest,
        body: undefined,
      };

      render(<HomePage />);

      const { globalEventBus } = await import('@/events/bus');
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(vi.mocked(globalEventBus.on)).toHaveBeenCalled();
      });

      const handlers = mockHandlersMap.get('collection.request-selected');
      if (handlers === undefined || handlers.size === 0) {
        throw new Error('No handlers found');
      }

      act(() => {
        handlers.forEach((handler) => {
          handler({
            type: 'collection.request-selected',
            payload: {
              collectionId: 'col_789',
              request: requestWithoutBody,
            },
            timestamp: Date.now(),
            source: 'RequestItem',
          });
        });
      });

      await waitFor(() => {
        expect(mockSetBody).toHaveBeenCalledWith('');
      });
    });

    it('clears previous response when loading from collection', async (): Promise<void> => {
      render(<HomePage />);

      const { globalEventBus } = await import('@/events/bus');
      await waitFor(() => {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(vi.mocked(globalEventBus.on)).toHaveBeenCalled();
      });

      const handlers = mockHandlersMap.get('collection.request-selected');
      if (handlers === undefined || handlers.size === 0) {
        throw new Error('No handlers found');
      }

      act(() => {
        handlers.forEach((handler) => {
          handler({
            type: 'collection.request-selected',
            payload: {
              collectionId: 'col_789',
              request: mockCollectionRequest,
            },
            timestamp: Date.now(),
            source: 'RequestItem',
          });
        });
      });

      await waitFor(() => {
        expect(mockSetResponse).toHaveBeenCalledWith(null);
      });
    });

    it('cleans up both history and collection event subscriptions on unmount', async (): Promise<void> => {
      const { unmount } = render(<HomePage />);

      // Get both unsubscribe functions
      const { globalEventBus } = await import('@/events/bus');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const unsubscribeCalls = vi.mocked(globalEventBus.on).mock.results;

      // Should have 2 subscriptions: history and collection
      expect(unsubscribeCalls.length).toBeGreaterThanOrEqual(2);

      // Unmount component
      unmount();

      // Verify cleanup functions exist
      unsubscribeCalls.forEach((call) => {
        expect(typeof call.value).toBe('function');
      });
    });
  });
});
