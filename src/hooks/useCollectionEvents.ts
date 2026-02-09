/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file useCollectionEvents hook
 * @description Hook for real-time collection event streaming from Tauri backend
 *
 * Every event is wrapped in an EventEnvelope with actor attribution,
 * so the UI knows WHO initiated each action (user, AI, or system).
 *
 * Unified event names (no mcp: prefix — the actor field tells you the origin):
 * - collection:created - New collection added
 * - collection:deleted - Collection removed
 * - collection:saved - Collection saved to disk
 * - request:added - Request added to collection
 * - request:updated - Request modified
 * - request:executed - Request executed with results
 */

import { useEffect, useCallback, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

/**
 * Who initiated this action.
 *
 * Maps to runi's signal system:
 * - user → no special signal
 * - ai → purple signal (#a855f7, suspect until verified)
 * - system → neutral/gray
 */
export type Actor =
  | { type: 'user' }
  | { type: 'ai'; model: string | null; session_id: string | null }
  | { type: 'system' };

/**
 * Wraps every event with provenance metadata.
 */
export interface EventEnvelope<T> {
  actor: Actor;
  timestamp: string;
  correlation_id: string | null;
  payload: T;
}

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
 * Collection saved event payload
 */
export interface CollectionSavedEvent {
  id: string;
  name: string;
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
  total_ms: number;
}

/**
 * Options for the useCollectionEvents hook
 */
export interface UseCollectionEventsOptions {
  /** Callback when a collection is created */
  onCollectionCreated?: (envelope: EventEnvelope<CollectionCreatedEvent>) => void;

  /** Callback when a collection is deleted */
  onCollectionDeleted?: (envelope: EventEnvelope<CollectionDeletedEvent>) => void;

  /** Callback when a collection is saved */
  onCollectionSaved?: (envelope: EventEnvelope<CollectionSavedEvent>) => void;

  /** Callback when a request is added */
  onRequestAdded?: (envelope: EventEnvelope<RequestAddedEvent>) => void;

  /** Callback when a request is updated */
  onRequestUpdated?: (envelope: EventEnvelope<RequestUpdatedEvent>) => void;

  /** Callback when a request is executed */
  onRequestExecuted?: (envelope: EventEnvelope<RequestExecutedEvent>) => void;
}

/**
 * Hook for subscribing to real-time collection events from Tauri backend.
 *
 * **CRITICAL:** This hook makes the UI completely event-driven. Collections
 * and requests update via Tauri events regardless of whether the action
 * came from the user, AI (MCP), or system.
 *
 * Every callback receives the full `EventEnvelope` with actor attribution,
 * enabling the UI to show WHO did what (e.g., purple signal for AI actions).
 *
 * @example
 * ```tsx
 * useCollectionEvents({
 *   onCollectionCreated: (envelope) => {
 *     if (envelope.actor.type === 'ai') {
 *       // Show purple signal dot
 *     }
 *     loadCollections();
 *   },
 *   onRequestAdded: (envelope) => {
 *     loadCollection(envelope.payload.collection_id);
 *   },
 * });
 * ```
 */
export function useCollectionEvents(options: UseCollectionEventsOptions): void {
  const {
    onCollectionCreated,
    onCollectionDeleted,
    onCollectionSaved,
    onRequestAdded,
    onRequestUpdated,
    onRequestExecuted,
  } = options;

  // Store callbacks in refs to avoid re-subscribing on callback changes
  const onCollectionCreatedRef = useRef(onCollectionCreated);
  const onCollectionDeletedRef = useRef(onCollectionDeleted);
  const onCollectionSavedRef = useRef(onCollectionSaved);
  const onRequestAddedRef = useRef(onRequestAdded);
  const onRequestUpdatedRef = useRef(onRequestUpdated);
  const onRequestExecutedRef = useRef(onRequestExecuted);

  // Update refs when callbacks change
  useEffect(() => {
    onCollectionCreatedRef.current = onCollectionCreated;
    onCollectionDeletedRef.current = onCollectionDeleted;
    onCollectionSavedRef.current = onCollectionSaved;
    onRequestAddedRef.current = onRequestAdded;
    onRequestUpdatedRef.current = onRequestUpdated;
    onRequestExecutedRef.current = onRequestExecuted;
  }, [
    onCollectionCreated,
    onCollectionDeleted,
    onCollectionSaved,
    onRequestAdded,
    onRequestUpdated,
    onRequestExecuted,
  ]);

  // Handle collection created event
  const handleCollectionCreated = useCallback(
    (envelope: EventEnvelope<CollectionCreatedEvent>): void => {
      if (onCollectionCreatedRef.current !== undefined) {
        onCollectionCreatedRef.current(envelope);
      }
    },
    []
  );

  // Handle collection deleted event
  const handleCollectionDeleted = useCallback(
    (envelope: EventEnvelope<CollectionDeletedEvent>): void => {
      if (onCollectionDeletedRef.current !== undefined) {
        onCollectionDeletedRef.current(envelope);
      }
    },
    []
  );

  // Handle collection saved event
  const handleCollectionSaved = useCallback(
    (envelope: EventEnvelope<CollectionSavedEvent>): void => {
      if (onCollectionSavedRef.current !== undefined) {
        onCollectionSavedRef.current(envelope);
      }
    },
    []
  );

  // Handle request added event
  const handleRequestAdded = useCallback((envelope: EventEnvelope<RequestAddedEvent>): void => {
    if (onRequestAddedRef.current !== undefined) {
      onRequestAddedRef.current(envelope);
    }
  }, []);

  // Handle request updated event
  const handleRequestUpdated = useCallback((envelope: EventEnvelope<RequestUpdatedEvent>): void => {
    if (onRequestUpdatedRef.current !== undefined) {
      onRequestUpdatedRef.current(envelope);
    }
  }, []);

  // Handle request executed event
  const handleRequestExecuted = useCallback(
    (envelope: EventEnvelope<RequestExecutedEvent>): void => {
      if (onRequestExecutedRef.current !== undefined) {
        onRequestExecutedRef.current(envelope);
      }
    },
    []
  );

  // Subscribe to Tauri events
  useEffect(() => {
    const unlistenFns: UnlistenFn[] = [];

    const setupListeners = async (): Promise<void> => {
      try {
        const unlistenCollectionCreated = await listen<EventEnvelope<CollectionCreatedEvent>>(
          'collection:created',
          (event) => {
            handleCollectionCreated(event.payload);
          }
        );
        unlistenFns.push(unlistenCollectionCreated);

        const unlistenCollectionDeleted = await listen<EventEnvelope<CollectionDeletedEvent>>(
          'collection:deleted',
          (event) => {
            handleCollectionDeleted(event.payload);
          }
        );
        unlistenFns.push(unlistenCollectionDeleted);

        const unlistenCollectionSaved = await listen<EventEnvelope<CollectionSavedEvent>>(
          'collection:saved',
          (event) => {
            handleCollectionSaved(event.payload);
          }
        );
        unlistenFns.push(unlistenCollectionSaved);

        const unlistenRequestAdded = await listen<EventEnvelope<RequestAddedEvent>>(
          'request:added',
          (event) => {
            handleRequestAdded(event.payload);
          }
        );
        unlistenFns.push(unlistenRequestAdded);

        const unlistenRequestUpdated = await listen<EventEnvelope<RequestUpdatedEvent>>(
          'request:updated',
          (event) => {
            handleRequestUpdated(event.payload);
          }
        );
        unlistenFns.push(unlistenRequestUpdated);

        const unlistenRequestExecuted = await listen<EventEnvelope<RequestExecutedEvent>>(
          'request:executed',
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
    handleCollectionSaved,
    handleRequestAdded,
    handleRequestUpdated,
    handleRequestExecuted,
  ]);
}
