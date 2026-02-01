/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCollectionStore } from './useCollectionStore';
import type { Collection } from '@/types/collection';
import { invoke } from '@tauri-apps/api/core';

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
});
