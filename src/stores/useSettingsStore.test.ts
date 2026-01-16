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
});
