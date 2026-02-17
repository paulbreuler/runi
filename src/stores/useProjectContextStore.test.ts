/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProjectContextStore } from './useProjectContextStore';
import type { ProjectContext } from '@/types/generated/ProjectContext';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

const DEFAULT_CONTEXT: ProjectContext = {
  activeCollectionId: null,
  activeRequestId: null,
  investigationNotes: null,
  recentRequestIds: [],
  tags: [],
};

const SAMPLE_CONTEXT: ProjectContext = {
  activeCollectionId: 'col-1',
  activeRequestId: 'req-1',
  investigationNotes: 'testing auth flow',
  recentRequestIds: ['req-1', 'req-2'],
  tags: ['auth', 'testing'],
};

describe('useProjectContextStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectContextStore.setState({
      context: DEFAULT_CONTEXT,
      loaded: false,
      loading: false,
      error: null,
    });
  });

  it('starts with default empty context', () => {
    const { context, loaded, loading, error } = useProjectContextStore.getState();
    expect(context).toEqual(DEFAULT_CONTEXT);
    expect(loaded).toBe(false);
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  describe('fetchContext', () => {
    it('fetches context from backend', async () => {
      vi.mocked(invoke).mockResolvedValue(SAMPLE_CONTEXT);

      await useProjectContextStore.getState().fetchContext();

      expect(invoke).toHaveBeenCalledWith('cmd_get_project_context');
      const state = useProjectContextStore.getState();
      expect(state.context).toEqual(SAMPLE_CONTEXT);
      expect(state.loaded).toBe(true);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on fetch failure', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('DB unavailable'));

      await useProjectContextStore.getState().fetchContext();

      const state = useProjectContextStore.getState();
      expect(state.error).toBe('DB unavailable');
      expect(state.loading).toBe(false);
      expect(state.loaded).toBe(false);
    });
  });

  describe('updateContext', () => {
    it('sends update to backend and stores result', async () => {
      vi.mocked(invoke).mockResolvedValue(SAMPLE_CONTEXT);

      const update = {
        activeCollectionId: 'col-1' as string | null,
        activeRequestId: null,
        investigationNotes: null,
        pushRecentRequestId: null,
        tags: null,
      };
      await useProjectContextStore.getState().updateContext(update);

      expect(invoke).toHaveBeenCalledWith('cmd_update_project_context', {
        update,
      });
      const state = useProjectContextStore.getState();
      expect(state.context).toEqual(SAMPLE_CONTEXT);
      expect(state.loaded).toBe(true);
    });

    it('sets error on update failure', async () => {
      vi.mocked(invoke).mockRejectedValue('Update failed');

      await useProjectContextStore.getState().updateContext({
        activeCollectionId: null,
        activeRequestId: null,
        investigationNotes: null,
        pushRecentRequestId: null,
        tags: null,
      });

      const state = useProjectContextStore.getState();
      expect(state.error).toBe('Update failed');
      expect(state.loading).toBe(false);
    });
  });

  describe('setContext', () => {
    it('sets context directly without backend call', () => {
      useProjectContextStore.getState().setContext(SAMPLE_CONTEXT);

      const state = useProjectContextStore.getState();
      expect(state.context).toEqual(SAMPLE_CONTEXT);
      expect(state.loaded).toBe(true);
      expect(invoke).not.toHaveBeenCalled();
    });
  });
});
