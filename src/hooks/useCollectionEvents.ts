/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useCollectionEvents hook
 * @description Hook for real-time collection event streaming from Tauri backend
 *
 * Subscribes to Tauri events for live collection updates from MCP server:
 * - mcp:collection-created - New collection added
 * - mcp:collection-deleted - Collection removed
 * - mcp:request-added - Request added to collection
 * - mcp:request-updated - Request modified
 * - mcp:request-executed - Request executed with results
 */

import { useEffect, useCallback, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

/**
 * Collection created event payload
 */
export interface CollectionCreatedEvent {
  id: string;
  name: string;
}

/**
 * Collection deleted event payload
 */
export interface CollectionDeletedEvent {
  id: string;
}

/**
 * Request added event payload
 */
export interface RequestAddedEvent {
  collection_id: string;
  request_id: string;
  name: string;
}

/**
 * Request updated event payload
 */
export interface RequestUpdatedEvent {
  collection_id: string;
  request_id: string;
}

/**
 * Request executed event payload
 */
export interface RequestExecutedEvent {
  collection_id: string;
  request_id: string;
  status: number;
  success: boolean;
}

/**
 * Options for the useCollectionEvents hook
 */
export interface UseCollectionEventsOptions {
  /** Callback when a collection is created */
  onCollectionCreated?: (event: CollectionCreatedEvent) => void;

  /** Callback when a collection is deleted */
  onCollectionDeleted?: (event: CollectionDeletedEvent) => void;

  /** Callback when a request is added */
  onRequestAdded?: (event: RequestAddedEvent) => void;

  /** Callback when a request is updated */
  onRequestUpdated?: (event: RequestUpdatedEvent) => void;

  /** Callback when a request is executed */
  onRequestExecuted?: (event: RequestExecutedEvent) => void;
}

/**
 * Hook for subscribing to real-time collection events from MCP server.
 *
 * **CRITICAL:** This hook makes the UI completely event-driven. Collections
 * and requests are NEVER polled - they update ONLY via Tauri events.
 *
 * @example
 * ```tsx
 * useCollectionEvents({
 *   onCollectionCreated: (event) => {
 *     // Reload collection list
 *     loadCollections();
 *   },
 *   onRequestAdded: (event) => {
 *     // Reload specific collection
 *     loadCollection(event.collection_id);
 *   },
 * });
 * ```
 */
export function useCollectionEvents(options: UseCollectionEventsOptions): void {
  const {
    onCollectionCreated,
    onCollectionDeleted,
    onRequestAdded,
    onRequestUpdated,
    onRequestExecuted,
  } = options;

  // Store callbacks in refs to avoid re-subscribing on callback changes
  const onCollectionCreatedRef = useRef(onCollectionCreated);
  const onCollectionDeletedRef = useRef(onCollectionDeleted);
  const onRequestAddedRef = useRef(onRequestAdded);
  const onRequestUpdatedRef = useRef(onRequestUpdated);
  const onRequestExecutedRef = useRef(onRequestExecuted);

  // Update refs when callbacks change
  useEffect(() => {
    onCollectionCreatedRef.current = onCollectionCreated;
    onCollectionDeletedRef.current = onCollectionDeleted;
    onRequestAddedRef.current = onRequestAdded;
    onRequestUpdatedRef.current = onRequestUpdated;
    onRequestExecutedRef.current = onRequestExecuted;
  }, [
    onCollectionCreated,
    onCollectionDeleted,
    onRequestAdded,
    onRequestUpdated,
    onRequestExecuted,
  ]);

  // Handle collection created event
  const handleCollectionCreated = useCallback((event: CollectionCreatedEvent): void => {
    if (onCollectionCreatedRef.current !== undefined) {
      onCollectionCreatedRef.current(event);
    }
  }, []);

  // Handle collection deleted event
  const handleCollectionDeleted = useCallback((event: CollectionDeletedEvent): void => {
    if (onCollectionDeletedRef.current !== undefined) {
      onCollectionDeletedRef.current(event);
    }
  }, []);

  // Handle request added event
  const handleRequestAdded = useCallback((event: RequestAddedEvent): void => {
    if (onRequestAddedRef.current !== undefined) {
      onRequestAddedRef.current(event);
    }
  }, []);

  // Handle request updated event
  const handleRequestUpdated = useCallback((event: RequestUpdatedEvent): void => {
    if (onRequestUpdatedRef.current !== undefined) {
      onRequestUpdatedRef.current(event);
    }
  }, []);

  // Handle request executed event
  const handleRequestExecuted = useCallback((event: RequestExecutedEvent): void => {
    if (onRequestExecutedRef.current !== undefined) {
      onRequestExecutedRef.current(event);
    }
  }, []);

  // Subscribe to Tauri events
  useEffect(() => {
    const unlistenFns: UnlistenFn[] = [];

    const setupListeners = async (): Promise<void> => {
      try {
        // Listen for collection created
        const unlistenCollectionCreated = await listen<CollectionCreatedEvent>(
          'mcp:collection-created',
          (event) => {
            handleCollectionCreated(event.payload);
          }
        );
        unlistenFns.push(unlistenCollectionCreated);

        // Listen for collection deleted
        const unlistenCollectionDeleted = await listen<CollectionDeletedEvent>(
          'mcp:collection-deleted',
          (event) => {
            handleCollectionDeleted(event.payload);
          }
        );
        unlistenFns.push(unlistenCollectionDeleted);

        // Listen for request added
        const unlistenRequestAdded = await listen<RequestAddedEvent>(
          'mcp:request-added',
          (event) => {
            handleRequestAdded(event.payload);
          }
        );
        unlistenFns.push(unlistenRequestAdded);

        // Listen for request updated
        const unlistenRequestUpdated = await listen<RequestUpdatedEvent>(
          'mcp:request-updated',
          (event) => {
            handleRequestUpdated(event.payload);
          }
        );
        unlistenFns.push(unlistenRequestUpdated);

        // Listen for request executed
        const unlistenRequestExecuted = await listen<RequestExecutedEvent>(
          'mcp:request-executed',
          (event) => {
            handleRequestExecuted(event.payload);
          }
        );
        unlistenFns.push(unlistenRequestExecuted);
      } catch (error) {
        console.error('Failed to subscribe to collection events:', error);
      }
    };

    void setupListeners();

    // Cleanup on unmount
    return (): void => {
      for (const unlisten of unlistenFns) {
        unlisten();
      }
    };
  }, [
    handleCollectionCreated,
    handleCollectionDeleted,
    handleRequestAdded,
    handleRequestUpdated,
    handleRequestExecuted,
  ]);
}
