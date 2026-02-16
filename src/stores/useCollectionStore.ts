/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { invoke } from '@tauri-apps/api/core';
import { useMemo } from 'react';
import { create } from 'zustand';
import type { Collection, CollectionRequest, CollectionSummary } from '@/types/collection';
import { sortRequests } from '@/types/collection';
import type { ImportCollectionRequest } from '@/types/generated/ImportCollectionRequest';

interface CollectionState {
  collections: Collection[];
  summaries: CollectionSummary[];
  selectedCollectionId: string | null;
  selectedRequestId: string | null;
  expandedCollectionIds: Set<string>;
  /** ID of a collection that should immediately enter rename mode (cleared after consumption). */
  pendingRenameId: string | null;
  /** ID of a request that should immediately enter rename mode (cleared after consumption). */
  pendingRequestRenameId: string | null;
  isLoading: boolean;
  error: string | null;

  createCollection: (name: string) => Promise<Collection | null>;
  loadCollections: () => Promise<void>;
  loadCollection: (id: string) => Promise<void>;
  addHttpbinCollection: () => Promise<Collection | null>;
  importCollection: (request: ImportCollectionRequest) => Promise<Collection | null>;
  deleteCollection: (id: string) => Promise<void>;
  deleteRequest: (collectionId: string, requestId: string) => Promise<void>;
  renameCollection: (collectionId: string, newName: string) => Promise<void>;
  renameRequest: (collectionId: string, requestId: string, newName: string) => Promise<void>;
  duplicateCollection: (id: string) => Promise<void>;
  addRequest: (collectionId: string, name: string) => Promise<void>;
  duplicateRequest: (collectionId: string, requestId: string) => Promise<void>;
  selectCollection: (id: string | null) => void;
  selectRequest: (collectionId: string, requestId: string) => void;
  toggleExpanded: (id: string) => void;
  clearPendingRename: () => void;
  clearPendingRequestRename: () => void;
  clearError: () => void;
}

const normalizeCollection = (collection: Collection): Collection => ({
  ...collection,
  requests: collection.requests.map((request) => {
    // Runtime data from Tauri may omit fields that the type declares as required.
    // Cast through unknown to safely provide defaults for potentially missing fields.
    const raw = request as unknown as Record<string, unknown>;
    return {
      ...request,
      headers: (raw.headers as Record<string, string> | undefined) ?? {},
      intelligence: (raw.intelligence as typeof request.intelligence | undefined) ?? {
        ai_generated: false,
      },
    };
  }),
});

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  summaries: [],
  selectedCollectionId: null,
  selectedRequestId: null,
  expandedCollectionIds: new Set(),
  pendingRenameId: null,
  pendingRequestRenameId: null,
  isLoading: false,
  error: null,

  createCollection: async (name: string): Promise<Collection | null> => {
    set({ isLoading: true, error: null });
    try {
      const collection = normalizeCollection(
        await invoke<Collection>('cmd_create_collection', { name })
      );

      set((state) => ({
        collections: [...state.collections, collection],
        summaries: [
          ...state.summaries,
          {
            id: collection.id,
            name: collection.metadata.name,
            request_count: collection.requests.length,
            source_type: collection.source.source_type,
            modified_at: collection.metadata.modified_at,
          },
        ].sort((a, b) => a.name.localeCompare(b.name)),
        selectedCollectionId: collection.id,
        expandedCollectionIds: new Set([...state.expandedCollectionIds, collection.id]),
        pendingRenameId: collection.id,
        isLoading: false,
      }));

      return collection;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      return null;
    }
  },

  loadCollections: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const summaries = await invoke<CollectionSummary[]>('cmd_list_collections');
      set({ summaries, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  loadCollection: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const collection = normalizeCollection(
        await invoke<Collection>('cmd_load_collection', {
          collectionId: id,
        })
      );

      set((state) => {
        const existing = state.collections.findIndex((item) => item.id === id);
        const collections = [...state.collections];
        if (existing >= 0) {
          collections[existing] = collection;
        } else {
          collections.push(collection);
        }
        return { collections, isLoading: false };
      });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addHttpbinCollection: async (): Promise<Collection | null> => {
    set({ isLoading: true, error: null });
    try {
      const collection = normalizeCollection(
        await invoke<Collection>('cmd_add_httpbin_collection')
      );

      set((state) => ({
        collections: [...state.collections, collection],
        summaries: [
          ...state.summaries,
          {
            id: collection.id,
            name: collection.metadata.name,
            request_count: collection.requests.length,
            source_type: collection.source.source_type,
            modified_at: collection.metadata.modified_at,
          },
        ],
        selectedCollectionId: collection.id,
        expandedCollectionIds: new Set([...state.expandedCollectionIds, collection.id]),
        isLoading: false,
      }));

      return collection;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      return null;
    }
  },

  importCollection: async (request: ImportCollectionRequest): Promise<Collection | null> => {
    set({ isLoading: true, error: null });
    try {
      const collection = normalizeCollection(
        await invoke<Collection>('cmd_import_collection', { request })
      );

      set((state) => ({
        collections: [...state.collections, collection],
        summaries: [
          ...state.summaries,
          {
            id: collection.id,
            name: collection.metadata.name,
            request_count: collection.requests.length,
            source_type: collection.source.source_type,
            modified_at: collection.metadata.modified_at,
          },
        ],
        selectedCollectionId: collection.id,
        expandedCollectionIds: new Set([...state.expandedCollectionIds, collection.id]),
        isLoading: false,
      }));

      return collection;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      return null;
    }
  },

  deleteCollection: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await invoke('cmd_delete_collection', { collectionId: id });

      set((state) => ({
        collections: state.collections.filter((collection) => collection.id !== id),
        summaries: state.summaries.filter((summary) => summary.id !== id),
        selectedCollectionId: state.selectedCollectionId === id ? null : state.selectedCollectionId,
        selectedRequestId: state.selectedCollectionId === id ? null : state.selectedRequestId,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  selectCollection: (id: string | null): void => {
    set({ selectedCollectionId: id, selectedRequestId: null });
  },

  selectRequest: (collectionId: string, requestId: string): void => {
    set({ selectedCollectionId: collectionId, selectedRequestId: requestId });
  },

  toggleExpanded: (id: string): void => {
    set((state) => {
      const expanded = new Set(state.expandedCollectionIds);
      if (expanded.has(id)) {
        expanded.delete(id);
      } else {
        expanded.add(id);
      }
      return { expandedCollectionIds: expanded };
    });
  },

  deleteRequest: async (collectionId: string, requestId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await invoke('cmd_delete_request', { collectionId, requestId });

      set((state) => ({
        collections: state.collections.map((collection) =>
          collection.id === collectionId
            ? { ...collection, requests: collection.requests.filter((r) => r.id !== requestId) }
            : collection
        ),
        summaries: state.summaries.map((summary) =>
          summary.id === collectionId
            ? { ...summary, request_count: Math.max(0, summary.request_count - 1) }
            : summary
        ),
        selectedRequestId:
          state.selectedCollectionId === collectionId && state.selectedRequestId === requestId
            ? null
            : state.selectedRequestId,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  renameCollection: async (collectionId: string, newName: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await invoke('cmd_rename_collection', { collectionId, newName });

      set((state) => ({
        collections: state.collections.map((collection) =>
          collection.id === collectionId
            ? { ...collection, metadata: { ...collection.metadata, name: newName } }
            : collection
        ),
        summaries: state.summaries.map((summary) =>
          summary.id === collectionId ? { ...summary, name: newName } : summary
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  renameRequest: async (
    collectionId: string,
    requestId: string,
    newName: string
  ): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await invoke('cmd_rename_request', { collectionId, requestId, newName });

      set((state) => ({
        collections: state.collections.map((collection) =>
          collection.id === collectionId
            ? {
                ...collection,
                requests: collection.requests.map((r) =>
                  r.id === requestId ? { ...r, name: newName } : r
                ),
              }
            : collection
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  duplicateCollection: async (id: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const collection = normalizeCollection(
        await invoke<Collection>('cmd_duplicate_collection', { collectionId: id })
      );

      set((state) => ({
        collections: [...state.collections, collection],
        summaries: [
          ...state.summaries,
          {
            id: collection.id,
            name: collection.metadata.name,
            request_count: collection.requests.length,
            source_type: collection.source.source_type,
            modified_at: collection.metadata.modified_at,
          },
        ].sort((a, b) => a.name.localeCompare(b.name)),
        selectedCollectionId: collection.id,
        expandedCollectionIds: new Set([...state.expandedCollectionIds, collection.id]),
        pendingRenameId: collection.id,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  addRequest: async (collectionId: string, name: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const updated = normalizeCollection(
        await invoke<Collection>('cmd_add_request', { collectionId, name })
      );

      // Find the newly added request (last one by seq)
      const newRequest =
        updated.requests.length > 0
          ? updated.requests.reduce((latest, r) => (r.seq > latest.seq ? r : latest))
          : undefined;

      set((state) => ({
        collections: state.collections.map((c) => (c.id === collectionId ? updated : c)),
        summaries: state.summaries.map((s) =>
          s.id === collectionId ? { ...s, request_count: updated.requests.length } : s
        ),
        expandedCollectionIds: new Set([...state.expandedCollectionIds, collectionId]),
        pendingRequestRenameId: newRequest?.id ?? null,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  duplicateRequest: async (collectionId: string, requestId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const updated = normalizeCollection(
        await invoke<Collection>('cmd_duplicate_request', { collectionId, requestId })
      );

      // Find the newly duplicated request (last one by seq)
      const newRequest =
        updated.requests.length > 0
          ? updated.requests.reduce((latest, r) => (r.seq > latest.seq ? r : latest))
          : undefined;

      set((state) => ({
        collections: state.collections.map((c) => (c.id === collectionId ? updated : c)),
        summaries: state.summaries.map((s) =>
          s.id === collectionId ? { ...s, request_count: updated.requests.length } : s
        ),
        pendingRequestRenameId: newRequest?.id ?? null,
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  clearPendingRename: (): void => {
    set({ pendingRenameId: null });
  },

  clearPendingRequestRename: (): void => {
    set({ pendingRequestRenameId: null });
  },

  clearError: (): void => {
    set({ error: null });
  },
}));

// ============================================
// Selector Hooks
// ============================================

/** Get currently selected collection */
export function useSelectedCollection(): Collection | undefined {
  return useCollectionStore((state) =>
    state.collections.find((collection) => collection.id === state.selectedCollectionId)
  );
}

/**
 * Get sorted requests for a collection.
 * Uses sortRequests() which handles duplicate seq values.
 */
export function useSortedRequests(collectionId: string): CollectionRequest[] {
  const requests = useCollectionStore((state) => {
    const collection = state.collections.find((item) => item.id === collectionId);
    return collection?.requests;
  });

  return useMemo(() => {
    if (requests === undefined) {
      return [];
    }
    return sortRequests(requests);
  }, [requests]);
}

/** Get currently selected request */
export function useSelectedRequest(): CollectionRequest | undefined {
  return useCollectionStore((state) => {
    const collection = state.collections.find((item) => item.id === state.selectedCollectionId);
    if (collection === undefined) {
      return undefined;
    }
    return collection.requests.find((request) => request.id === state.selectedRequestId);
  });
}

/** Check if a collection is expanded */
export function useIsExpanded(collectionId: string): boolean {
  return useCollectionStore((state) => state.expandedCollectionIds.has(collectionId));
}

/** Get collection by ID */
export function useCollection(id: string): Collection | undefined {
  return useCollectionStore((state) =>
    state.collections.find((collection) => collection.id === id)
  );
}

/** Get loading state */
export function useIsLoading(): boolean {
  return useCollectionStore((state) => state.isLoading);
}

/** Get error state */
export function useError(): string | null {
  return useCollectionStore((state) => state.error);
}
