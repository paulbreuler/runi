/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSuggestionStore } from './useSuggestionStore';
import type { Suggestion } from '@/types/generated/Suggestion';
import { invoke } from '@tauri-apps/api/core';

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

const SAMPLE_SUGGESTION: Suggestion = {
  id: 'sug-1',
  suggestionType: 'drift_fix',
  title: 'Schema drift on GET /users',
  description: 'Response includes undocumented field avatar_url',
  status: 'pending',
  source: 'claude-3.5-sonnet',
  collectionId: 'col-1',
  requestId: 'req-1',
  endpoint: 'GET /users',
  action: 'Update spec to include avatar_url',
  createdAt: '2026-01-01T00:00:00Z',
  resolvedAt: null,
};

const SAMPLE_SUGGESTION_2: Suggestion = {
  id: 'sug-2',
  suggestionType: 'test_gap',
  title: 'Missing auth tests',
  description: 'No test coverage for /auth endpoint',
  status: 'pending',
  source: 'claude',
  collectionId: null,
  requestId: null,
  endpoint: 'POST /auth',
  action: 'Add test',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedAt: null,
};

describe('useSuggestionStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSuggestionStore.setState({
      suggestions: [],
      loaded: false,
      loading: false,
      error: null,
    });
  });

  it('starts with empty suggestions', () => {
    const { suggestions, loaded, loading, error } = useSuggestionStore.getState();
    expect(suggestions).toEqual([]);
    expect(loaded).toBe(false);
    expect(loading).toBe(false);
    expect(error).toBeNull();
  });

  describe('fetchSuggestions', () => {
    it('fetches suggestions from backend', async () => {
      vi.mocked(invoke).mockResolvedValue([SAMPLE_SUGGESTION, SAMPLE_SUGGESTION_2]);

      await useSuggestionStore.getState().fetchSuggestions();

      expect(invoke).toHaveBeenCalledWith('cmd_list_suggestions', { status: null });
      const state = useSuggestionStore.getState();
      expect(state.suggestions).toHaveLength(2);
      expect(state.loaded).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('fetches with status filter', async () => {
      vi.mocked(invoke).mockResolvedValue([SAMPLE_SUGGESTION]);

      await useSuggestionStore.getState().fetchSuggestions('pending');

      expect(invoke).toHaveBeenCalledWith('cmd_list_suggestions', { status: 'pending' });
    });

    it('sets error on fetch failure', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('DB unavailable'));

      await useSuggestionStore.getState().fetchSuggestions();

      const state = useSuggestionStore.getState();
      expect(state.error).toBe('DB unavailable');
      expect(state.loading).toBe(false);
    });
  });

  describe('createSuggestion', () => {
    it('creates suggestion and adds to list', async () => {
      vi.mocked(invoke).mockResolvedValue(SAMPLE_SUGGESTION);

      await useSuggestionStore.getState().createSuggestion({
        suggestionType: 'drift_fix',
        title: 'Schema drift on GET /users',
        description: 'Response includes undocumented field avatar_url',
        source: 'claude-3.5-sonnet',
        collectionId: 'col-1',
        requestId: 'req-1',
        endpoint: 'GET /users',
        action: 'Update spec to include avatar_url',
      });

      expect(invoke).toHaveBeenCalledWith('cmd_create_suggestion', {
        request: expect.objectContaining({ title: 'Schema drift on GET /users' }),
      });
      const state = useSuggestionStore.getState();
      expect(state.suggestions).toHaveLength(1);
      expect(state.suggestions[0].id).toBe('sug-1');
    });

    it('sets error on create failure', async () => {
      vi.mocked(invoke).mockRejectedValue(new Error('Insert failed'));

      await useSuggestionStore.getState().createSuggestion({
        suggestionType: 'drift_fix',
        title: 'Test',
        description: 'Test',
        source: 'test',
        collectionId: null,
        requestId: null,
        endpoint: null,
        action: 'test',
      });

      const state = useSuggestionStore.getState();
      expect(state.error).toBe('Insert failed');
    });
  });

  describe('resolveSuggestion', () => {
    it('resolves suggestion and updates list', async () => {
      // Pre-populate
      useSuggestionStore.setState({ suggestions: [SAMPLE_SUGGESTION] });

      const resolved: Suggestion = {
        ...SAMPLE_SUGGESTION,
        status: 'accepted',
        resolvedAt: '2026-01-03T00:00:00Z',
      };
      vi.mocked(invoke).mockResolvedValue(resolved);

      await useSuggestionStore.getState().resolveSuggestion('sug-1', 'accepted');

      expect(invoke).toHaveBeenCalledWith('cmd_resolve_suggestion', {
        id: 'sug-1',
        status: 'accepted',
      });
      const state = useSuggestionStore.getState();
      expect(state.suggestions[0].status).toBe('accepted');
      expect(state.suggestions[0].resolvedAt).toBe('2026-01-03T00:00:00Z');
    });

    it('sets error on resolve failure', async () => {
      useSuggestionStore.setState({ suggestions: [SAMPLE_SUGGESTION] });
      vi.mocked(invoke).mockRejectedValue(new Error('Not found'));

      await useSuggestionStore.getState().resolveSuggestion('sug-1', 'accepted');

      const state = useSuggestionStore.getState();
      expect(state.error).toBe('Not found');
    });
  });

  describe('addSuggestion (event handler)', () => {
    it('adds suggestion from event', () => {
      useSuggestionStore.getState().addSuggestion(SAMPLE_SUGGESTION);

      const state = useSuggestionStore.getState();
      expect(state.suggestions).toHaveLength(1);
      expect(state.suggestions[0].id).toBe('sug-1');
    });

    it('does not duplicate existing suggestion', () => {
      useSuggestionStore.setState({ suggestions: [SAMPLE_SUGGESTION] });
      useSuggestionStore.getState().addSuggestion(SAMPLE_SUGGESTION);

      const state = useSuggestionStore.getState();
      expect(state.suggestions).toHaveLength(1);
    });
  });

  describe('updateSuggestion (event handler)', () => {
    it('updates existing suggestion from event', () => {
      useSuggestionStore.setState({ suggestions: [SAMPLE_SUGGESTION] });

      const resolved: Suggestion = {
        ...SAMPLE_SUGGESTION,
        status: 'dismissed',
        resolvedAt: '2026-01-03T00:00:00Z',
      };
      useSuggestionStore.getState().updateSuggestion(resolved);

      const state = useSuggestionStore.getState();
      expect(state.suggestions[0].status).toBe('dismissed');
    });
  });

  describe('pendingCount', () => {
    it('counts only pending suggestions', () => {
      useSuggestionStore.setState({
        suggestions: [
          SAMPLE_SUGGESTION,
          { ...SAMPLE_SUGGESTION_2, status: 'accepted', resolvedAt: '2026-01-03T00:00:00Z' },
        ],
      });

      const count = useSuggestionStore.getState().pendingCount();
      expect(count).toBe(1);
    });
  });
});
