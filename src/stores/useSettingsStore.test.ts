import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettingsStore } from './useSettingsStore';

describe('useSettingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useSettingsStore());
    act(() => {
      result.current.setSidebarVisible(true);
    });
  });

  it('initializes with sidebar visible', () => {
    const { result } = renderHook(() => useSettingsStore());
    expect(result.current.sidebarVisible).toBe(true);
  });

  it('toggles sidebar visibility', () => {
    const { result } = renderHook(() => useSettingsStore());

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.sidebarVisible).toBe(false);

    act(() => {
      result.current.toggleSidebar();
    });

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

  describe('viewMode', () => {
    it('initializes with builder view mode', () => {
      const { result } = renderHook(() => useSettingsStore());
      expect(result.current.viewMode).toBe('builder');
    });

    it('sets view mode to history', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setViewMode('history');
      });

      expect(result.current.viewMode).toBe('history');
    });

    it('sets view mode back to builder', () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setViewMode('history');
      });

      act(() => {
        result.current.setViewMode('builder');
      });

      expect(result.current.viewMode).toBe('builder');
    });
  });
});
