// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { renderHook, act } from '@testing-library/react';
import { useDriftReviewStore } from './useDriftReviewStore';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

describe('useDriftReviewStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useDriftReviewStore.setState({
      isOpen: false,
      collectionId: null,
      focusOperationKey: null,
      reviewState: {},
      dismissedBannerKeys: new Set(),
    });
  });

  describe('initial state', () => {
    it('starts with drawer closed', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      expect(result.current.isOpen).toBe(false);
    });

    it('starts with no collection selected', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      expect(result.current.collectionId).toBeNull();
    });

    it('starts with no focus operation key', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      expect(result.current.focusOperationKey).toBeNull();
    });

    it('starts with empty review state', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      expect(result.current.reviewState).toEqual({});
    });

    it('starts with empty dismissed banner keys', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      expect(result.current.dismissedBannerKeys.size).toBe(0);
    });
  });

  describe('openDrawer', () => {
    it('opens the drawer with collection ID', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.openDrawer('col_1');
      });
      expect(result.current.isOpen).toBe(true);
      expect(result.current.collectionId).toBe('col_1');
    });

    it('sets focus operation key when provided', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.openDrawer('col_1', 'col_1:DELETE:/books/{id}');
      });
      expect(result.current.focusOperationKey).toBe('col_1:DELETE:/books/{id}');
    });

    it('clears focus operation key when not provided', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.openDrawer('col_1', 'col_1:DELETE:/books/{id}');
      });
      act(() => {
        result.current.openDrawer('col_1');
      });
      expect(result.current.focusOperationKey).toBeNull();
    });
  });

  describe('closeDrawer', () => {
    it('closes the drawer', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.openDrawer('col_1');
      });
      act(() => {
        result.current.closeDrawer();
      });
      expect(result.current.isOpen).toBe(false);
    });

    it('clears collection ID on close', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.openDrawer('col_1');
      });
      act(() => {
        result.current.closeDrawer();
      });
      expect(result.current.collectionId).toBeNull();
    });

    it('clears focus operation key on close', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.openDrawer('col_1', 'col_1:DELETE:/books/{id}');
      });
      act(() => {
        result.current.closeDrawer();
      });
      expect(result.current.focusOperationKey).toBeNull();
    });
  });

  describe('review state key format', () => {
    it('uses collectionId:method:path as key', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.acceptChange('col_1', 'DELETE', '/books/{id}');
      });
      expect(result.current.reviewState['col_1:DELETE:/books/{id}']).toEqual({
        status: 'accepted',
      });
    });
  });

  describe('acceptChange', () => {
    it('marks a change as accepted', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.acceptChange('col_1', 'DELETE', '/books/{id}');
      });
      expect(result.current.reviewState['col_1:DELETE:/books/{id}']?.status).toBe('accepted');
    });

    it('invokes cmd_set_drift_review_decision with accepted status', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.acceptChange('col_1', 'DELETE', '/books/{id}');
      });
      expect(invoke).toHaveBeenCalledWith('cmd_set_drift_review_decision', {
        collectionId: 'col_1',
        method: 'DELETE',
        path: '/books/{id}',
        status: 'accepted',
      });
    });

    it('can accept multiple independent changes', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.acceptChange('col_1', 'DELETE', '/books/{id}');
        result.current.acceptChange('col_1', 'PUT', '/books/{id}');
      });
      expect(result.current.reviewState['col_1:DELETE:/books/{id}']?.status).toBe('accepted');
      expect(result.current.reviewState['col_1:PUT:/books/{id}']?.status).toBe('accepted');
    });
  });

  describe('ignoreChange', () => {
    it('marks a change as ignored', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.ignoreChange('col_1', 'PUT', '/books/{id}');
      });
      expect(result.current.reviewState['col_1:PUT:/books/{id}']?.status).toBe('ignored');
    });

    it('invokes cmd_set_drift_review_decision with ignored status', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.ignoreChange('col_1', 'PUT', '/books/{id}');
      });
      expect(invoke).toHaveBeenCalledWith('cmd_set_drift_review_decision', {
        collectionId: 'col_1',
        method: 'PUT',
        path: '/books/{id}',
        status: 'ignored',
      });
    });
  });

  describe('acceptAll', () => {
    it('marks all provided operation keys as accepted', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      const keys = ['col_1:DELETE:/books/{id}', 'col_1:PUT:/books/{id}', 'col_1:POST:/books'];
      act(() => {
        result.current.acceptAll(keys);
      });
      for (const key of keys) {
        expect(result.current.reviewState[key]?.status).toBe('accepted');
      }
    });

    it('does not affect other collections', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.ignoreChange('col_2', 'GET', '/other');
      });
      act(() => {
        result.current.acceptAll(['col_1:DELETE:/books/{id}']);
      });
      expect(result.current.reviewState['col_2:GET:/other']?.status).toBe('ignored');
    });

    it('invokes cmd_set_drift_review_decision for each key with accepted status', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      const keys = ['col_1:DELETE:/books/{id}', 'col_1:PUT:/books/{id}'];
      act(() => {
        result.current.acceptAll(keys);
      });
      expect(invoke).toHaveBeenCalledWith('cmd_set_drift_review_decision', {
        collectionId: 'col_1',
        method: 'DELETE',
        path: '/books/{id}',
        status: 'accepted',
      });
      expect(invoke).toHaveBeenCalledWith('cmd_set_drift_review_decision', {
        collectionId: 'col_1',
        method: 'PUT',
        path: '/books/{id}',
        status: 'accepted',
      });
    });
  });

  describe('dismissAll', () => {
    it('marks all provided operation keys as ignored', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      const keys = ['col_1:DELETE:/books/{id}', 'col_1:PUT:/books/{id}'];
      act(() => {
        result.current.dismissAll(keys);
      });
      for (const key of keys) {
        expect(result.current.reviewState[key]?.status).toBe('ignored');
      }
    });

    it('invokes cmd_set_drift_review_decision for each key with ignored status', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      const keys = ['col_1:DELETE:/books/{id}', 'col_1:PUT:/books/{id}'];
      act(() => {
        result.current.dismissAll(keys);
      });
      expect(invoke).toHaveBeenCalledWith('cmd_set_drift_review_decision', {
        collectionId: 'col_1',
        method: 'DELETE',
        path: '/books/{id}',
        status: 'ignored',
      });
      expect(invoke).toHaveBeenCalledWith('cmd_set_drift_review_decision', {
        collectionId: 'col_1',
        method: 'PUT',
        path: '/books/{id}',
        status: 'ignored',
      });
    });
  });

  describe('dismissBanner', () => {
    it('adds the banner key to dismissedBannerKeys', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.dismissBanner('col_1', 'DELETE', '/books/{id}');
      });
      expect(result.current.dismissedBannerKeys.has('col_1:DELETE:/books/{id}')).toBe(true);
    });

    it('can dismiss multiple banners', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.dismissBanner('col_1', 'DELETE', '/books/{id}');
        result.current.dismissBanner('col_1', 'PUT', '/books/{id}');
      });
      expect(result.current.dismissedBannerKeys.size).toBe(2);
    });
  });

  describe('getChangeStatus', () => {
    it('returns pending for an un-reviewed change', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      expect(result.current.getChangeStatus('col_1', 'DELETE', '/books/{id}')).toBe('pending');
    });

    it('returns accepted for an accepted change', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.acceptChange('col_1', 'DELETE', '/books/{id}');
      });
      expect(result.current.getChangeStatus('col_1', 'DELETE', '/books/{id}')).toBe('accepted');
    });

    it('returns ignored for an ignored change', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.ignoreChange('col_1', 'PUT', '/books/{id}');
      });
      expect(result.current.getChangeStatus('col_1', 'PUT', '/books/{id}')).toBe('ignored');
    });
  });

  describe('state persistence across close/reopen', () => {
    it('retains review state after closing drawer', () => {
      const { result } = renderHook(() => useDriftReviewStore());
      act(() => {
        result.current.openDrawer('col_1');
        result.current.ignoreChange('col_1', 'DELETE', '/books/{id}');
      });
      act(() => {
        result.current.closeDrawer();
      });
      act(() => {
        result.current.openDrawer('col_1');
      });
      expect(result.current.reviewState['col_1:DELETE:/books/{id}']?.status).toBe('ignored');
    });
  });
});
