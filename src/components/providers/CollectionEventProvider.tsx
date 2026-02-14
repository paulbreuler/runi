/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CollectionEventProvider
 * @description Mounts Tauri event listeners for real-time collection updates
 * and feeds events into the activity store for provenance tracking.
 *
 * This provider bridges the backend event bus with:
 * 1. The collection store (data refresh)
 * 2. The activity store (provenance feed)
 * 3. Follow-AI mode (auto-focus on AI actions)
 *
 * Mount this once near the app root, AFTER the stores are available.
 */

import React from 'react';
import { useCollectionEvents } from '@/hooks/useCollectionEvents';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useActivityStore, type ActivityAction } from '@/stores/useActivityStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useRequestStoreRaw } from '@/stores/useRequestStore';
import type { Actor, EventEnvelope } from '@/hooks/useCollectionEvents';
import type { RequestTabSource } from '@/types/canvas';

/**
 * Push an event into the activity feed.
 */
function recordActivity(
  actor: Actor,
  action: ActivityAction,
  target: string,
  targetId: string | undefined,
  timestamp: string,
  seq: number | undefined
): void {
  useActivityStore.getState().addEntry({
    timestamp,
    actor,
    action,
    target,
    targetId,
    seq,
  });
}

/**
 * Auto-expand and select AI-created collections when "Follow AI" mode is enabled.
 */
function followAiIfEnabled(collectionId: string, actor: Actor): void {
  if (actor.type !== 'ai') {
    return;
  }
  const { followAiMode } = useSettingsStore.getState();
  if (!followAiMode) {
    return;
  }

  const store = useCollectionStore.getState();
  store.selectCollection(collectionId);
  // Ensure the collection is expanded in the sidebar
  if (!store.expandedCollectionIds.has(collectionId)) {
    store.toggleExpanded(collectionId);
  }
}

/**
 * Extract the Lamport seq from an envelope, if available.
 */
function extractSeq(envelope: EventEnvelope<unknown>): number | undefined {
  return envelope.lamport?.seq;
}

/**
 * Refresh an open tab's request store if the tab sources from the given collection request.
 *
 * After `loadCollection` resolves, reads the updated request from the collection store
 * and pushes the new values into the tab's request store context.
 */
function refreshOpenTabIfNeeded(collectionId: string, requestId: string): void {
  const source: RequestTabSource = {
    type: 'collection',
    collectionId,
    requestId,
  };
  const contextId = useCanvasStore.getState().findContextBySource(source);
  if (contextId === null) {
    return;
  }

  // Find the updated request in the collection store
  const collection = useCollectionStore.getState().collections.find((c) => c.id === collectionId);
  if (collection === undefined) {
    return;
  }
  const request = collection.requests.find((r) => r.id === requestId);
  if (request === undefined) {
    return;
  }

  // Push updated data into the tab's request store
  const reqStore = useRequestStoreRaw.getState();
  reqStore.setMethod(contextId, request.method);
  reqStore.setUrl(contextId, request.url);
  reqStore.setHeaders(contextId, request.headers);
  reqStore.setBody(contextId, request.body?.content ?? '');
}

/**
 * Provider that subscribes to collection events and updates the Zustand store.
 *
 * When Claude Code (or any MCP client) creates/deletes collections via the
 * MCP server, the events flow through Tauri to this provider, which triggers
 * store refreshes so the sidebar updates in real-time.
 *
 * Additionally records all events in the activity feed for provenance tracking.
 */
export const CollectionEventProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const loadCollections = useCollectionStore((s) => s.loadCollections);
  const loadCollection = useCollectionStore((s) => s.loadCollection);
  useCollectionEvents({
    onCollectionCreated: (envelope): void => {
      void loadCollections();
      recordActivity(
        envelope.actor,
        'created_collection',
        envelope.payload.name,
        envelope.payload.id,
        envelope.timestamp,
        extractSeq(envelope)
      );
      followAiIfEnabled(envelope.payload.id, envelope.actor);
    },
    onCollectionDeleted: (envelope): void => {
      void loadCollections();
      // If the deleted collection was selected, clear selection immediately
      // so the UI doesn't reference a stale collection while loadCollections() refreshes
      if (useCollectionStore.getState().selectedCollectionId === envelope.payload.id) {
        useCollectionStore.getState().selectCollection(null);
      }
      recordActivity(
        envelope.actor,
        'deleted_collection',
        envelope.payload.name ?? envelope.payload.id,
        envelope.payload.id,
        envelope.timestamp,
        extractSeq(envelope)
      );
    },
    onCollectionSaved: (envelope): void => {
      void loadCollections();
      recordActivity(
        envelope.actor,
        'saved_collection',
        envelope.payload.name,
        envelope.payload.id,
        envelope.timestamp,
        extractSeq(envelope)
      );
    },
    onRequestAdded: (envelope): void => {
      void loadCollections();
      void loadCollection(envelope.payload.collection_id);
      recordActivity(
        envelope.actor,
        'added_request',
        envelope.payload.name,
        envelope.payload.request_id,
        envelope.timestamp,
        extractSeq(envelope)
      );
      followAiIfEnabled(envelope.payload.collection_id, envelope.actor);
    },
    onRequestUpdated: (envelope): void => {
      void loadCollection(envelope.payload.collection_id).then((): void => {
        refreshOpenTabIfNeeded(envelope.payload.collection_id, envelope.payload.request_id);
      });
      recordActivity(
        envelope.actor,
        'updated_request',
        envelope.payload.request_id,
        envelope.payload.request_id,
        envelope.timestamp,
        extractSeq(envelope)
      );
    },
    onRequestDeleted: (envelope): void => {
      void loadCollection(envelope.payload.collection_id);
      recordActivity(
        envelope.actor,
        'deleted_request',
        envelope.payload.name ?? envelope.payload.request_id,
        envelope.payload.request_id,
        envelope.timestamp,
        extractSeq(envelope)
      );
      // Clear selection if the deleted request was selected
      const store = useCollectionStore.getState();
      if (
        store.selectedCollectionId === envelope.payload.collection_id &&
        store.selectedRequestId === envelope.payload.request_id
      ) {
        store.selectCollection(envelope.payload.collection_id);
      }
    },
    onRequestExecuted: (envelope): void => {
      recordActivity(
        envelope.actor,
        'executed_request',
        `${envelope.payload.request_id} (${String(envelope.payload.status)})`,
        envelope.payload.request_id,
        envelope.timestamp,
        extractSeq(envelope)
      );
    },
  });

  return <>{children}</>;
};
