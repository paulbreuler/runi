/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file CollectionEventProvider
 * @description Mounts Tauri event listeners for real-time collection updates.
 *
 * This provider bridges the backend event bus with the frontend collection store.
 * When any actor (user, AI, system) creates, deletes, or modifies collections,
 * the store is automatically refreshed.
 *
 * Mount this once near the app root, AFTER the store is available.
 */

import React from 'react';
import { useCollectionEvents } from '@/hooks/useCollectionEvents';
import { useCollectionStore } from '@/stores/useCollectionStore';

/**
 * Provider that subscribes to collection events and updates the Zustand store.
 *
 * When Claude Code (or any MCP client) creates/deletes collections via the
 * MCP server, the events flow through Tauri to this provider, which triggers
 * store refreshes so the sidebar updates in real-time.
 */
export const CollectionEventProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const loadCollections = useCollectionStore((s) => s.loadCollections);
  const loadCollection = useCollectionStore((s) => s.loadCollection);
  const selectedCollectionId = useCollectionStore((s) => s.selectedCollectionId);

  useCollectionEvents({
    onCollectionCreated: (): void => {
      void loadCollections();
    },
    onCollectionDeleted: (envelope): void => {
      void loadCollections();
      // If deleted collection was selected, the store will handle clearing selection
      // when it reloads and the collection is no longer present
      if (selectedCollectionId === envelope.payload.id) {
        useCollectionStore.getState().selectCollection(null);
      }
    },
    onCollectionSaved: (): void => {
      void loadCollections();
    },
    onRequestAdded: (envelope): void => {
      void loadCollection(envelope.payload.collection_id);
    },
    onRequestUpdated: (envelope): void => {
      void loadCollection(envelope.payload.collection_id);
    },
    onRequestExecuted: (): void => {
      // Future: update "last executed" indicator
    },
  });

  return <>{children}</>;
};
