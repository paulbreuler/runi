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
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { useConsoleStore } from '@/stores/useConsoleStore';

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
  driftResults: Record<string, SpecRefreshResult>;
  isLoading: boolean;
  error: string | null;

  refreshCollectionSpec: (collectionId: string) => Promise<void>;
  dismissDriftResult: (collectionId: string) => void;
  createCollection: (name: string) => Promise<Collection | null>;
  loadCollections: () => Promise<void>;
  loadCollection: (id: string) => Promise<void>;
  addHttpbinCollection: () => Promise<Collection | null>;
  importCollection: (request: ImportCollectionRequest) => Promise<Collection | null>;
  openCollectionFile: (path: string) => Promise<Collection | null>;
  deleteCollection: (id: string) => Promise<void>;
  deleteRequest: (collectionId: string, requestId: string) => Promise<void>;
  renameCollection: (collectionId: string, newName: string) => Promise<void>;
  renameRequest: (collectionId: string, requestId: string, newName: string) => Promise<void>;
  duplicateCollection: (id: string) => Promise<void>;
  addRequest: (collectionId: string, name: string) => Promise<void>;
  updateRequest: (
    collectionId: string,
    requestId: string,
    patch: {
      name?: string;
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: string;
    }
  ) => Promise<void>;
  duplicateRequest: (collectionId: string, requestId: string) => Promise<void>;
  saveTabToCollection: (
    collectionId: string,
    request: {
      name: string;
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: string;
    }
  ) => Promise<{ collectionId: string; requestId: string } | null>;
  moveRequest: (
    sourceCollectionId: string,
    requestId: string,
    targetCollectionId: string
  ) => Promise<boolean>;
  copyRequestToCollection: (
    sourceCollectionId: string,
    requestId: string,
    targetCollectionId: string
  ) => Promise<boolean>;
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
  driftResults: {},
  isLoading: false,
  error: null,

  refreshCollectionSpec: async (collectionId: string): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const result = await invoke<SpecRefreshResult>('cmd_refresh_collection_spec', {
        collectionId,
      });

      set((state) => ({
        driftResults: { ...state.driftResults, [collectionId]: result },
        isLoading: false,
      }));

      globalEventBus.emit('collection.spec-refreshed', {
        collection_id: collectionId,
        changed: result.changed,
        actor: 'human',
      });
    } catch (error) {
      const message = String(error);
      set({ isLoading: false });
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: 'Failed to refresh spec',
        details: message,
      });
    }
  },

  dismissDriftResult: (collectionId: string): void => {
    set((state) => {
      const { [collectionId]: _, ...rest } = state.driftResults;
      return { driftResults: rest };
    });
  },

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
      const message = String(error);
      set({ isLoading: false });
      useConsoleStore.getState().addLog({
        id: crypto.randomUUID(),
        level: 'error',
        message: `Import failed: ${message}`,
        args: [message],
        timestamp: Date.now(),
        source: 'collection-store',
      });
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: 'Import failed',
        details: message,
      });
      return null;
    }
  },

  openCollectionFile: async (path: string): Promise<Collection | null> => {
    set({ isLoading: true, error: null });
    try {
      const collection = normalizeCollection(
        await invoke<Collection>('cmd_open_collection_file', { path })
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

  updateRequest: async (collectionId, requestId, patch): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const updated = normalizeCollection(
        await invoke<Collection>('cmd_update_request', {
          collection_id: collectionId,
          request_id: requestId,
          name: patch.name ?? null,
          method: patch.method ?? null,
          url: patch.url ?? null,
          headers: patch.headers ?? null,
          body: patch.body ?? null,
          body_type: null, // Let backend infer or keep existing
        })
      );

      set((state) => ({
        collections: state.collections.map((c) => (c.id === collectionId ? updated : c)),
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

  saveTabToCollection: async (
    collectionId: string,
    request: {
      name: string;
      method: string;
      url: string;
      headers: Record<string, string>;
      body?: string;
    }
  ): Promise<{ collectionId: string; requestId: string } | null> => {
    set({ isLoading: true, error: null });
    try {
      const collection = normalizeCollection(
        await invoke<Collection>('cmd_save_tab_to_collection', {
          collectionId,
          name: request.name,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body ?? null,
        })
      );

      // Find the newly added request (last one by seq)
      const newRequest =
        collection.requests.length > 0
          ? collection.requests.reduce((latest, r) => (r.seq > latest.seq ? r : latest))
          : undefined;

      set((state) => {
        const collectionExists = state.collections.some((c) => c.id === collectionId);
        const summaryExists = state.summaries.some((s) => s.id === collectionId);
        const updatedSummary = {
          id: collectionId,
          name: collection.metadata.name,
          request_count: collection.requests.length,
          source_type: collection.source.source_type,
          modified_at: collection.metadata.modified_at,
        };
        return {
          collections: collectionExists
            ? state.collections.map((c) => (c.id === collectionId ? collection : c))
            : [...state.collections, collection],
          summaries: summaryExists
            ? state.summaries.map((s) => (s.id === collectionId ? updatedSummary : s))
            : [...state.summaries, updatedSummary],
          expandedCollectionIds: new Set([...state.expandedCollectionIds, collectionId]),
          isLoading: false,
        };
      });

      if (newRequest !== undefined) {
        const result = { collectionId, requestId: newRequest.id };
        globalEventBus.emit('request.saved-to-collection', {
          collection_id: result.collectionId,
          request_id: result.requestId,
          name: request.name,
          method: request.method,
          url: request.url,
          headers: request.headers,
          body: request.body ?? '',
        });
        return result;
      }

      return null;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      return null;
    }
  },

  moveRequest: async (
    sourceCollectionId: string,
    requestId: string,
    targetCollectionId: string
  ): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const result = await invoke<{ from: Collection; to: Collection }>('cmd_move_request', {
        source_collection_id: sourceCollectionId,
        request_id: requestId,
        target_collection_id: targetCollectionId,
      });

      const from = normalizeCollection(result.from);
      const to = normalizeCollection(result.to);

      set((state) => ({
        collections: state.collections.map((c) => {
          if (c.id === sourceCollectionId) {
            return from;
          }
          if (c.id === targetCollectionId) {
            return to;
          }
          return c;
        }),
        summaries: state.summaries.map((s) => {
          if (s.id === sourceCollectionId) {
            return { ...s, request_count: from.requests.length };
          }
          if (s.id === targetCollectionId) {
            return { ...s, request_count: to.requests.length };
          }
          return s;
        }),
        isLoading: false,
      }));

      globalEventBus.emit('request.moved', {
        request_id: requestId,
        source_collection_id: sourceCollectionId,
        target_collection_id: targetCollectionId,
      });

      return true;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      return false;
    }
  },

  copyRequestToCollection: async (
    sourceCollectionId: string,
    requestId: string,
    targetCollectionId: string
  ): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const targetCollection = normalizeCollection(
        await invoke<Collection>('cmd_copy_request_to_collection', {
          source_collection_id: sourceCollectionId,
          request_id: requestId,
          target_collection_id: targetCollectionId,
        })
      );

      // Find the newly copied request (last one by seq)
      const copiedRequest =
        targetCollection.requests.length > 0
          ? targetCollection.requests.reduce((latest, r) => (r.seq > latest.seq ? r : latest))
          : undefined;

      set((state) => ({
        collections: state.collections.map((c) =>
          c.id === targetCollectionId ? targetCollection : c
        ),
        summaries: state.summaries.map((s) =>
          s.id === targetCollectionId
            ? { ...s, request_count: targetCollection.requests.length }
            : s
        ),
        isLoading: false,
      }));

      globalEventBus.emit('request.copied', {
        source_request_id: requestId,
        copied_request_id: copiedRequest?.id ?? '',
        request_id: copiedRequest?.id ?? '',
        target_collection_id: targetCollectionId,
      });

      return true;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      return false;
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
