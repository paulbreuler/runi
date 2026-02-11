/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettingsStore } from './useSettingsStore';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('useSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state (sidebar visible by default)
    useSettingsStore.setState({ sidebarVisible: true, logLevel: 'info', openItemsRatio: 0.35 });
  });

  it('initializes with sidebar visible', () => {
    const { result } = renderHook(() => useSettingsStore());
    expect(result.current.sidebarVisible).toBe(true);
  });

  it('toggles sidebar visibility', () => {
    const { result } = renderHook(() => useSettingsStore());
    // Starts visible (true)
    expect(result.current.sidebarVisible).toBe(true);

    act(() => {
      result.current.toggleSidebar();
    });

    // After toggle, should be collapsed (false)
    expect(result.current.sidebarVisible).toBe(false);

    act(() => {
      result.current.toggleSidebar();
    });

    // After second toggle, should be visible again (true)
    expect(result.current.sidebarVisible).toBe(true);
  });

  it('sets sidebar visibility explicitly', () => {
    const { result } = renderHook(() => useSettingsStore());

    act(() => {
      result.current.setSidebarVisible(false);
    });

    expect(result.current.sidebarVisible).toBe(false);

    act(() => {
      result.current.setSidebarVisible(true);
    });

    expect(result.current.sidebarVisible).toBe(true);
  });

  describe('logLevel', () => {
    it('initializes with info log level', () => {
      const { result } = renderHook(() => useSettingsStore());
      expect(result.current.logLevel).toBe('info');
    });

    it('sets log level successfully when invoke succeeds', async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useSettingsStore());

      await act(async () => {
        await result.current.setLogLevel('debug');
      });

      expect(invoke).toHaveBeenCalledWith('set_log_level', { level: 'debug' });
      expect(result.current.logLevel).toBe('debug');
    });

    it('throws error and does not update state when invoke fails', async () => {
      const error = new Error('Backend error');
      vi.mocked(invoke).mockRejectedValueOnce(error);
      const { result } = renderHook(() => useSettingsStore());

      await expect(
        act(async () => {
          await result.current.setLogLevel('trace');
        })
      ).rejects.toThrow('Backend error');

      expect(result.current.logLevel).toBe('info'); // unchanged
    });

    it('supports all valid log levels', async () => {
      const logLevels = ['error', 'warn', 'info', 'debug', 'trace'] as const;
      vi.mocked(invoke).mockResolvedValue(undefined);

      for (const level of logLevels) {
        const { result } = renderHook(() => useSettingsStore());

        await act(async () => {
          await result.current.setLogLevel(level);
        });

        expect(result.current.logLevel).toBe(level);
      }
    });
  });

  describe('openItemsRatio', (): void => {
    it('initializes with default ratio of 0.35', (): void => {
      const { result } = renderHook(() => useSettingsStore());
      expect(result.current.openItemsRatio).toBe(0.35);
    });

    it('sets ratio via setOpenItemsRatio', (): void => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setOpenItemsRatio(0.5);
      });

      expect(result.current.openItemsRatio).toBe(0.5);
    });

    it('clamps ratio to [0.1, 0.9] range', (): void => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setOpenItemsRatio(0);
      });
      expect(result.current.openItemsRatio).toBe(0.1);

      act(() => {
        result.current.setOpenItemsRatio(1);
      });
      expect(result.current.openItemsRatio).toBe(0.9);
    });
  });

  describe('edge cases', () => {
    it('handles rapid sidebar toggles', () => {
      const { result } = renderHook(() => useSettingsStore());
      const initialState = result.current.sidebarVisible;

      act(() => {
        result.current.toggleSidebar();
        result.current.toggleSidebar();
        result.current.toggleSidebar();
      });

      // After 3 toggles, should be opposite of initial
      expect(result.current.sidebarVisible).toBe(!initialState);
    });

    it('setSidebarVisible is idempotent', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setSidebarVisible(true);
        result.current.setSidebarVisible(true);
        result.current.setSidebarVisible(true);
      });

      expect(result.current.sidebarVisible).toBe(true);
    });

    it('maintains state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useSettingsStore());

      act(() => {
        result1.current.setSidebarVisible(false);
      });

      // New hook instance should see same state (Zustand singleton)
      const { result: result2 } = renderHook(() => useSettingsStore());

      expect(result2.current.sidebarVisible).toBe(false);
    });
  });
});
