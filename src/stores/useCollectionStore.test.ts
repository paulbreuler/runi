/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCollectionStore } from './useCollectionStore';
import type { Collection } from '@/types/collection';
import { invoke } from '@tauri-apps/api/core';
import { globalEventBus } from '@/events/bus';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const buildCollection = (id: string): Collection => ({
  $schema: 'https://runi.dev/schema/collection/v1.json',
  version: 1,
  id,
  metadata: {
    name: `Collection ${id}`,
    tags: [],
    created_at: '2026-01-01T00:00:00Z',
    modified_at: '2026-01-01T00:00:00Z',
  },
  source: {
    source_type: 'openapi',
    fetched_at: '2026-01-01T00:00:00Z',
  },
  variables: {},
  requests: [],
});

describe('useCollectionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCollectionStore.setState({
      collections: [],
      summaries: [],
      selectedCollectionId: null,
      selectedRequestId: null,
      expandedCollectionIds: new Set(),
      isLoading: false,
      error: null,
    });
  });

  it('loads collection summaries', async () => {
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      {
        id: 'col_1',
        name: 'Test',
        request_count: 2,
        source_type: 'openapi',
        modified_at: '2026-01-01T00:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useCollectionStore());

    await act(async () => {
      await result.current.loadCollections();
    });

    expect(invoke).toHaveBeenCalledWith('cmd_list_collections');
    expect(result.current.summaries).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error when loading summaries fails', async () => {
    (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('boom');

    const { result } = renderHook(() => useCollectionStore());

    await act(async () => {
      await result.current.loadCollections();
    });

    expect(result.current.error).toContain('boom');
    expect(result.current.isLoading).toBe(false);
  });

  it('adds httpbin collection and selects it', async () => {
    const collection = buildCollection('col_httpbin');
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(collection);

    const { result } = renderHook(() => useCollectionStore());

    await act(async () => {
      await result.current.addHttpbinCollection();
    });

    expect(result.current.collections).toHaveLength(1);
    expect(result.current.selectedCollectionId).toBe('col_httpbin');
    expect(result.current.expandedCollectionIds.has('col_httpbin')).toBe(true);
  });

  it('returns null when add httpbin fails', async () => {
    (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('failed');
    const { result } = renderHook(() => useCollectionStore());

    let returned: Collection | null = null;
    await act(async () => {
      returned = await result.current.addHttpbinCollection();
    });

    expect(returned).toBeNull();
    expect(result.current.error).toContain('failed');
    expect(result.current.isLoading).toBe(false);
  });

  it('updates an existing collection when loadCollection is called', async () => {
    const original = buildCollection('col_1');
    useCollectionStore.setState({ collections: [original] });
    const updated = { ...original, metadata: { ...original.metadata, name: 'Updated' } };
    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updated);

    const { result } = renderHook(() => useCollectionStore());

    await act(async () => {
      await result.current.loadCollection('col_1');
    });

    expect(result.current.collections).toHaveLength(1);
    const updatedCollection = result.current.collections[0];
    if (updatedCollection === undefined) {
      throw new Error('Collection not found after loadCollection');
    }
    expect(updatedCollection.metadata.name).toBe('Updated');
  });

  it('clears selection when deleting selected collection', async () => {
    useCollectionStore.setState({
      collections: [buildCollection('col_1')],
      summaries: [
        {
          id: 'col_1',
          name: 'One',
          request_count: 0,
          source_type: 'openapi',
          modified_at: '2026-01-01T00:00:00Z',
        },
      ],
      selectedCollectionId: 'col_1',
      selectedRequestId: 'req_1',
    });

    (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCollectionStore());

    await act(async () => {
      await result.current.deleteCollection('col_1');
    });

    expect(result.current.selectedCollectionId).toBeNull();
    expect(result.current.selectedRequestId).toBeNull();
  });

  it('toggles expanded state', () => {
    const { result } = renderHook(() => useCollectionStore());
    act(() => {
      result.current.toggleExpanded('col_1');
    });
    expect(result.current.expandedCollectionIds.has('col_1')).toBe(true);
    act(() => {
      result.current.toggleExpanded('col_1');
    });
    expect(result.current.expandedCollectionIds.has('col_1')).toBe(false);
  });

  describe('deleteRequest', () => {
    it('calls cmd_delete_request with correct params', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.deleteRequest('col-1', 'req-1');
      });

      expect(invoke).toHaveBeenCalledWith('cmd_delete_request', {
        collectionId: 'col-1',
        requestId: 'req-1',
      });
    });

    it('removes request from local state optimistically', async () => {
      const collection = {
        ...buildCollection('col-1'),
        requests: [
          {
            id: 'req-1',
            name: 'First',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 0,
          },
          {
            id: 'req-2',
            name: 'Second',
            method: 'POST',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 1,
          },
        ],
      };
      useCollectionStore.setState({ collections: [collection as unknown as Collection] });

      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.deleteRequest('col-1', 'req-1');
      });

      const col = result.current.collections.find((c) => c.id === 'col-1');
      expect(col?.requests).toHaveLength(1);
      expect(col?.requests[0]?.id).toBe('req-2');
    });

    it('clears selectedRequestId if deleted request was selected', async () => {
      const collection = {
        ...buildCollection('col-1'),
        requests: [
          {
            id: 'req-1',
            name: 'First',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 0,
          },
        ],
      };
      useCollectionStore.setState({
        collections: [collection as unknown as Collection],
        selectedCollectionId: 'col-1',
        selectedRequestId: 'req-1',
      });

      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.deleteRequest('col-1', 'req-1');
      });

      expect(result.current.selectedRequestId).toBeNull();
    });

    it('decrements summary request_count when deleting a request', async () => {
      const collection = {
        ...buildCollection('col-1'),
        requests: [
          {
            id: 'req-1',
            name: 'First',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 0,
          },
          {
            id: 'req-2',
            name: 'Second',
            method: 'POST',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 1,
          },
        ],
      };
      useCollectionStore.setState({
        collections: [collection as unknown as Collection],
        summaries: [
          {
            id: 'col-1',
            name: 'Collection col-1',
            request_count: 2,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.deleteRequest('col-1', 'req-1');
      });

      const summary = result.current.summaries.find((s) => s.id === 'col-1');
      expect(summary?.request_count).toBe(1);
    });

    it('sets error when delete fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('delete failed');

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.deleteRequest('col-1', 'req-1');
      });

      expect(result.current.error).toContain('delete failed');
    });
  });

  describe('renameCollection', () => {
    it('calls cmd_rename_collection with correct params', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.renameCollection('col-1', 'New Name');
      });

      expect(invoke).toHaveBeenCalledWith('cmd_rename_collection', {
        collectionId: 'col-1',
        newName: 'New Name',
      });
    });

    it('updates collection name in local state', async () => {
      const collection = buildCollection('col-1');
      useCollectionStore.setState({
        collections: [collection],
        summaries: [
          {
            id: 'col-1',
            name: 'Collection col-1',
            request_count: 0,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.renameCollection('col-1', 'Renamed');
      });

      const col = result.current.collections.find((c) => c.id === 'col-1');
      expect(col?.metadata.name).toBe('Renamed');
      const summary = result.current.summaries.find((s) => s.id === 'col-1');
      expect(summary?.name).toBe('Renamed');
    });

    it('sets error when rename fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('rename failed');

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.renameCollection('col-1', 'New Name');
      });

      expect(result.current.error).toContain('rename failed');
    });
  });

  describe('importCollection', (): void => {
    it('imports collection and adds to store', async (): Promise<void> => {
      const collection = buildCollection('col_imported');
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(collection);

      const { result } = renderHook(() => useCollectionStore());

      let returned: Collection | null = null;
      await act(async () => {
        returned = await result.current.importCollection({
          url: null,
          filePath: null,
          inlineContent: '{}',
          displayName: null,
          repoRoot: null,
          specPath: null,
          refName: null,
        });
      });

      expect(invoke).toHaveBeenCalledWith('cmd_import_collection', {
        request: {
          url: null,
          filePath: null,
          inlineContent: '{}',
          displayName: null,
          repoRoot: null,
          specPath: null,
          refName: null,
        },
      });
      expect(returned).not.toBeNull();
      expect(result.current.collections).toHaveLength(1);
      expect(result.current.selectedCollectionId).toBe('col_imported');
      expect(result.current.expandedCollectionIds.has('col_imported')).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('sets error when import fails', async (): Promise<void> => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('import failed');

      const { result } = renderHook(() => useCollectionStore());

      let returned: Collection | null = null;
      await act(async () => {
        returned = await result.current.importCollection({
          url: 'https://bad.example.com',
          filePath: null,
          inlineContent: null,
          displayName: null,
          repoRoot: null,
          specPath: null,
          refName: null,
        });
      });

      expect(returned).toBeNull();
      expect(result.current.error).toContain('import failed');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.collections).toHaveLength(0);
    });
  });

  describe('createCollection', () => {
    it('calls cmd_create_collection and adds to store', async () => {
      const collection = buildCollection('col_new');
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(collection);

      const { result } = renderHook(() => useCollectionStore());

      let returned: Collection | null = null;
      await act(async () => {
        returned = await result.current.createCollection('New Collection');
      });

      expect(invoke).toHaveBeenCalledWith('cmd_create_collection', { name: 'New Collection' });
      expect(returned).not.toBeNull();
      expect(result.current.collections).toHaveLength(1);
      expect(result.current.selectedCollectionId).toBe('col_new');
      expect(result.current.expandedCollectionIds.has('col_new')).toBe(true);
      expect(result.current.pendingRenameId).toBe('col_new');
      expect(result.current.isLoading).toBe(false);
    });

    it('returns null and sets error when create fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('create failed');

      const { result } = renderHook(() => useCollectionStore());

      let returned: Collection | null = null;
      await act(async () => {
        returned = await result.current.createCollection('Bad Name');
      });

      expect(returned).toBeNull();
      expect(result.current.error).toContain('create failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('sorts summaries alphabetically after creating', async () => {
      useCollectionStore.setState({
        summaries: [
          {
            id: 'col-z',
            name: 'Zebra Collection',
            request_count: 0,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      const collection = {
        ...buildCollection('col-a'),
        metadata: { ...buildCollection('col-a').metadata, name: 'Alpha Collection' },
      };
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(collection);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.createCollection('Alpha Collection');
      });

      expect(result.current.summaries[0]?.name).toBe('Alpha Collection');
      expect(result.current.summaries[1]?.name).toBe('Zebra Collection');
    });

    it('clears pendingRenameId with clearPendingRename', async () => {
      const collection = buildCollection('col_pending');
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(collection);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.createCollection('Pending');
      });
      expect(result.current.pendingRenameId).toBe('col_pending');

      act(() => {
        result.current.clearPendingRename();
      });
      expect(result.current.pendingRenameId).toBeNull();
    });
  });

  describe('duplicateCollection', () => {
    it('calls cmd_duplicate_collection and adds copy to store', async () => {
      const original = buildCollection('col-1');
      useCollectionStore.setState({
        collections: [original],
        summaries: [
          {
            id: 'col-1',
            name: 'Collection col-1',
            request_count: 0,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      const copy = {
        ...buildCollection('col-copy'),
        metadata: { ...buildCollection('col-copy').metadata, name: 'Collection col-1 (Copy)' },
      };
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(copy);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.duplicateCollection('col-1');
      });

      expect(invoke).toHaveBeenCalledWith('cmd_duplicate_collection', { collectionId: 'col-1' });
      expect(result.current.collections).toHaveLength(2);
      expect(result.current.selectedCollectionId).toBe('col-copy');
      expect(result.current.pendingRenameId).toBe('col-copy');
    });

    it('sets error when duplicate fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('dup failed');

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.duplicateCollection('col-1');
      });

      expect(result.current.error).toContain('dup failed');
    });
  });

  describe('addRequest', () => {
    it('calls cmd_add_request and updates collection in store', async () => {
      const collection = buildCollection('col-1');
      useCollectionStore.setState({
        collections: [collection],
        summaries: [
          {
            id: 'col-1',
            name: 'Collection col-1',
            request_count: 0,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      const updated = {
        ...collection,
        requests: [
          {
            id: 'req-new',
            name: 'New Request',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 1,
          },
        ],
      };
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.addRequest('col-1', 'New Request');
      });

      expect(invoke).toHaveBeenCalledWith('cmd_add_request', {
        collectionId: 'col-1',
        name: 'New Request',
      });
      const col = result.current.collections.find((c) => c.id === 'col-1');
      expect(col?.requests).toHaveLength(1);
      expect(result.current.pendingRequestRenameId).toBe('req-new');
    });

    it('sets error when add request fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('add failed');

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.addRequest('col-1', 'New Request');
      });

      expect(result.current.error).toContain('add failed');
    });

    it('handles empty requests array without crashing', async () => {
      const collection = buildCollection('col-1');
      useCollectionStore.setState({
        collections: [collection],
        summaries: [
          {
            id: 'col-1',
            name: 'Collection col-1',
            request_count: 0,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      // Return a collection with empty requests (edge case)
      const updated = { ...collection, requests: [] };
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.addRequest('col-1', 'New Request');
      });

      // Should not crash and pendingRequestRenameId should be null
      expect(result.current.pendingRequestRenameId).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('duplicateRequest', () => {
    it('calls cmd_duplicate_request and updates collection', async () => {
      const collection = {
        ...buildCollection('col-1'),
        requests: [
          {
            id: 'req-1',
            name: 'Original',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 1,
          },
        ],
      };
      useCollectionStore.setState({
        collections: [collection as unknown as Collection],
        summaries: [
          {
            id: 'col-1',
            name: 'Collection col-1',
            request_count: 1,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      const updated = {
        ...collection,
        requests: [
          collection.requests[0],
          {
            id: 'req-copy',
            name: 'Original (Copy)',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 2,
          },
        ],
      };
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.duplicateRequest('col-1', 'req-1');
      });

      expect(invoke).toHaveBeenCalledWith('cmd_duplicate_request', {
        collectionId: 'col-1',
        requestId: 'req-1',
      });
      const col = result.current.collections.find((c) => c.id === 'col-1');
      expect(col?.requests).toHaveLength(2);
      const summary = result.current.summaries.find((s) => s.id === 'col-1');
      expect(summary?.request_count).toBe(2);
    });

    it('sets error when duplicate request fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('dup req failed');

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.duplicateRequest('col-1', 'req-1');
      });

      expect(result.current.error).toContain('dup req failed');
    });
  });

  describe('renameRequest', () => {
    it('calls cmd_rename_request with correct params', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.renameRequest('col-1', 'req-1', 'New Request Name');
      });

      expect(invoke).toHaveBeenCalledWith('cmd_rename_request', {
        collectionId: 'col-1',
        requestId: 'req-1',
        newName: 'New Request Name',
      });
    });

    it('updates request name in local state', async () => {
      const collection = {
        ...buildCollection('col-1'),
        requests: [
          {
            id: 'req-1',
            name: 'Old Name',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 0,
          },
        ],
      };
      useCollectionStore.setState({ collections: [collection as unknown as Collection] });

      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.renameRequest('col-1', 'req-1', 'New Name');
      });

      const col = result.current.collections.find((c) => c.id === 'col-1');
      const req = col?.requests.find((r) => r.id === 'req-1');
      expect(req?.name).toBe('New Name');
    });

    it('sets error when rename fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('rename failed');

      const { result } = renderHook(() => useCollectionStore());

      await act(async () => {
        await result.current.renameRequest('col-1', 'req-1', 'New Name');
      });

      expect(result.current.error).toContain('rename failed');
    });
  });

  describe('saveTabToCollection', () => {
    it('calls cmd_save_tab_to_collection and updates local state', async () => {
      const collection = buildCollection('col-1');
      useCollectionStore.setState({
        collections: [collection],
        summaries: [
          {
            id: 'col-1',
            name: 'Collection col-1',
            request_count: 0,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      const updatedCollection = {
        ...collection,
        requests: [
          {
            id: 'req-saved',
            name: 'Saved Request',
            method: 'POST',
            url: 'https://api.example.com',
            headers: { 'Content-Type': 'application/json' },
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 1,
          },
        ],
      };
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updatedCollection);

      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      const { result } = renderHook(() => useCollectionStore());

      let returned: { collectionId: string; requestId: string } | null = null;
      await act(async () => {
        returned = await result.current.saveTabToCollection('col-1', {
          name: 'Saved Request',
          method: 'POST',
          url: 'https://api.example.com',
          headers: { 'Content-Type': 'application/json' },
          body: '{"key": "value"}',
        });
      });

      expect(invoke).toHaveBeenCalledWith('cmd_save_tab_to_collection', {
        collectionId: 'col-1',
        name: 'Saved Request',
        method: 'POST',
        url: 'https://api.example.com',
        headers: { 'Content-Type': 'application/json' },
        body: '{"key": "value"}',
      });
      expect(returned).toEqual({ collectionId: 'col-1', requestId: 'req-saved' });
      const col = result.current.collections.find((c) => c.id === 'col-1');
      expect(col?.requests).toHaveLength(1);
      expect(result.current.isLoading).toBe(false);
      expect(emitSpy).toHaveBeenCalledWith(
        'request.saved-to-collection',
        expect.objectContaining({
          collection_id: 'col-1',
          request_id: 'req-saved',
          name: 'Saved Request',
          method: 'POST',
          url: 'https://api.example.com',
          headers: { 'Content-Type': 'application/json' },
          body: '{"key": "value"}',
        })
      );

      emitSpy.mockRestore();
    });

    it('returns null and sets error when save fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('save failed');

      const { result } = renderHook(() => useCollectionStore());

      let returned: { collectionId: string; requestId: string } | null = null;
      await act(async () => {
        returned = await result.current.saveTabToCollection('col-1', {
          name: 'Bad Request',
          method: 'GET',
          url: 'https://bad.example.com',
          headers: {},
        });
      });

      expect(returned).toBeNull();
      expect(result.current.error).toContain('save failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('moveRequest', () => {
    it('calls cmd_move_request and updates both collections', async () => {
      const sourceCollection = {
        ...buildCollection('col-source'),
        requests: [
          {
            id: 'req-1',
            name: 'Moving Request',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 1,
          },
        ],
      };
      const targetCollection = buildCollection('col-target');
      useCollectionStore.setState({
        collections: [sourceCollection as unknown as Collection, targetCollection],
        summaries: [
          {
            id: 'col-source',
            name: 'Source',
            request_count: 1,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
          {
            id: 'col-target',
            name: 'Target',
            request_count: 0,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      const updatedSource = { ...sourceCollection, requests: [] };
      const updatedTarget = {
        ...targetCollection,
        requests: [sourceCollection.requests[0]],
      };
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        from: updatedSource,
        to: updatedTarget,
      });

      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      const { result } = renderHook(() => useCollectionStore());

      let returned = false;
      await act(async () => {
        returned = await result.current.moveRequest('col-source', 'req-1', 'col-target');
      });

      expect(invoke).toHaveBeenCalledWith('cmd_move_request', {
        source_collection_id: 'col-source',
        request_id: 'req-1',
        target_collection_id: 'col-target',
      });
      expect(returned).toBe(true);

      const source = result.current.collections.find((c) => c.id === 'col-source');
      expect(source?.requests).toHaveLength(0);
      const target = result.current.collections.find((c) => c.id === 'col-target');
      expect(target?.requests).toHaveLength(1);

      const sourceSummary = result.current.summaries.find((s) => s.id === 'col-source');
      expect(sourceSummary?.request_count).toBe(0);
      const targetSummary = result.current.summaries.find((s) => s.id === 'col-target');
      expect(targetSummary?.request_count).toBe(1);

      expect(emitSpy).toHaveBeenCalledWith(
        'request.moved',
        expect.objectContaining({
          request_id: 'req-1',
          source_collection_id: 'col-source',
          target_collection_id: 'col-target',
        })
      );

      emitSpy.mockRestore();
    });

    it('returns false and sets error when move fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('move failed');

      const { result } = renderHook(() => useCollectionStore());

      let returned = false;
      await act(async () => {
        returned = await result.current.moveRequest('col-source', 'req-1', 'col-target');
      });

      expect(returned).toBe(false);
      expect(result.current.error).toContain('move failed');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('copyRequestToCollection', () => {
    it('calls cmd_copy_request_to_collection and updates target collection', async () => {
      const sourceCollection = {
        ...buildCollection('col-source'),
        requests: [
          {
            id: 'req-1',
            name: 'Original',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 1,
          },
        ],
      };
      const targetCollection = buildCollection('col-target');
      useCollectionStore.setState({
        collections: [sourceCollection as unknown as Collection, targetCollection],
        summaries: [
          {
            id: 'col-source',
            name: 'Source',
            request_count: 1,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
          {
            id: 'col-target',
            name: 'Target',
            request_count: 0,
            source_type: 'openapi',
            modified_at: '2026-01-01T00:00:00Z',
          },
        ],
      });

      const updatedTarget = {
        ...targetCollection,
        requests: [
          {
            id: 'req-copy',
            name: 'Original (Copy)',
            method: 'GET',
            url: '',
            headers: {},
            params: [],
            is_streaming: false,
            binding: {},
            intelligence: { ai_generated: false },
            tags: [],
            seq: 1,
          },
        ],
      };
      (invoke as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(updatedTarget);

      const emitSpy = vi.spyOn(globalEventBus, 'emit');

      const { result } = renderHook(() => useCollectionStore());

      let returned = false;
      await act(async () => {
        returned = await result.current.copyRequestToCollection(
          'col-source',
          'req-1',
          'col-target'
        );
      });

      expect(invoke).toHaveBeenCalledWith('cmd_copy_request_to_collection', {
        source_collection_id: 'col-source',
        request_id: 'req-1',
        target_collection_id: 'col-target',
      });
      expect(returned).toBe(true);

      const target = result.current.collections.find((c) => c.id === 'col-target');
      expect(target?.requests).toHaveLength(1);

      const targetSummary = result.current.summaries.find((s) => s.id === 'col-target');
      expect(targetSummary?.request_count).toBe(1);

      expect(emitSpy).toHaveBeenCalledWith(
        'request.copied',
        expect.objectContaining({
          source_request_id: 'req-1',
          request_id: 'req-copy',
          target_collection_id: 'col-target',
        })
      );

      emitSpy.mockRestore();
    });

    it('returns false and sets error when copy fails', async () => {
      (invoke as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce('copy failed');

      const { result } = renderHook(() => useCollectionStore());

      let returned = false;
      await act(async () => {
        returned = await result.current.copyRequestToCollection(
          'col-source',
          'req-1',
          'col-target'
        );
      });

      expect(returned).toBe(false);
      expect(result.current.error).toContain('copy failed');
      expect(result.current.isLoading).toBe(false);
    });
  });
});
