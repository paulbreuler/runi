import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePanelStore, DEFAULT_PANEL_SIZES } from './usePanelStore';
import type { PanelPosition } from './usePanelStore';

describe('usePanelStore', () => {
  beforeEach(() => {
    // Reset store to initial state using setState
    usePanelStore.setState({
      position: 'bottom',
      isVisible: false,
      isCollapsed: false,
      sizes: { ...DEFAULT_PANEL_SIZES },
      isPopout: false,
    });
  });

  describe('initial state', () => {
    it('initializes with panel hidden', () => {
      const { result } = renderHook(() => usePanelStore());
      expect(result.current.isVisible).toBe(false);
    });

    it('initializes with bottom position', () => {
      const { result } = renderHook(() => usePanelStore());
      expect(result.current.position).toBe('bottom');
    });

    it('initializes with panel not collapsed', () => {
      const { result } = renderHook(() => usePanelStore());
      expect(result.current.isCollapsed).toBe(false);
    });

    it('initializes with default sizes for all positions', () => {
      const { result } = renderHook(() => usePanelStore());
      expect(result.current.sizes).toEqual(DEFAULT_PANEL_SIZES);
    });

    it('initializes with isPopout false', () => {
      const { result } = renderHook(() => usePanelStore());
      expect(result.current.isPopout).toBe(false);
    });
  });

  describe('visibility', () => {
    it('toggles visibility from hidden to visible', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.toggleVisibility();
      });

      expect(result.current.isVisible).toBe(true);
    });

    it('toggles visibility from visible to hidden', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.toggleVisibility();
      });

      act(() => {
        result.current.toggleVisibility();
      });

      expect(result.current.isVisible).toBe(false);
    });

    it('sets visibility explicitly', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setVisible(true);
      });

      expect(result.current.isVisible).toBe(true);

      act(() => {
        result.current.setVisible(false);
      });

      expect(result.current.isVisible).toBe(false);
    });
  });

  describe('position', () => {
    it('sets position to left', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setPosition('left');
      });

      expect(result.current.position).toBe('left');
    });

    it('sets position to right', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setPosition('right');
      });

      expect(result.current.position).toBe('right');
    });

    it('sets position to bottom', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setPosition('left');
      });

      act(() => {
        result.current.setPosition('bottom');
      });

      expect(result.current.position).toBe('bottom');
    });

    it('sets position to floating', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setPosition('floating');
      });

      expect(result.current.position).toBe('floating');
    });
  });

  describe('collapse', () => {
    it('sets collapsed state to true', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setCollapsed(true);
      });

      expect(result.current.isCollapsed).toBe(true);
    });

    it('sets collapsed state to false', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setCollapsed(true);
      });

      act(() => {
        result.current.setCollapsed(false);
      });

      expect(result.current.isCollapsed).toBe(false);
    });

    it('toggles collapsed state', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.toggleCollapsed();
      });

      expect(result.current.isCollapsed).toBe(true);

      act(() => {
        result.current.toggleCollapsed();
      });

      expect(result.current.isCollapsed).toBe(false);
    });
  });

  describe('size persistence per position', () => {
    it('sets size for bottom position', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setSize('bottom', 300);
      });

      expect(result.current.sizes.bottom).toBe(300);
    });

    it('sets size for left position', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setSize('left', 400);
      });

      expect(result.current.sizes.left).toBe(400);
    });

    it('sets size for right position', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setSize('right', 350);
      });

      expect(result.current.sizes.right).toBe(350);
    });

    it('preserves size when switching positions', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setSize('bottom', 300);
        result.current.setPosition('left');
        result.current.setSize('left', 400);
      });

      // Bottom size should be preserved
      expect(result.current.sizes.bottom).toBe(300);
      expect(result.current.sizes.left).toBe(400);
    });

    it('returns correct size for current position', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setSize('bottom', 300);
        result.current.setSize('left', 400);
      });

      expect(result.current.getCurrentSize()).toBe(300); // bottom is default

      act(() => {
        result.current.setPosition('left');
      });

      expect(result.current.getCurrentSize()).toBe(400);
    });
  });

  describe('popout', () => {
    it('sets popout state to true', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setPopout(true);
      });

      expect(result.current.isPopout).toBe(true);
    });

    it('sets popout state to false', () => {
      const { result } = renderHook(() => usePanelStore());

      act(() => {
        result.current.setPopout(true);
      });

      act(() => {
        result.current.setPopout(false);
      });

      expect(result.current.isPopout).toBe(false);
    });
  });

  describe('state persistence', () => {
    it('maintains state across multiple hook calls', () => {
      const { result: result1 } = renderHook(() => usePanelStore());

      act(() => {
        result1.current.setPosition('right');
        result1.current.setSize('right', 450);
        result1.current.setVisible(true);
      });

      // New hook call should see the same state (Zustand is a singleton)
      const { result: result2 } = renderHook(() => usePanelStore());

      expect(result2.current.position).toBe('right');
      expect(result2.current.sizes.right).toBe(450);
      expect(result2.current.isVisible).toBe(true);
    });

    it('state is shared across components', () => {
      const { result: result1 } = renderHook(() => usePanelStore());

      act(() => {
        result1.current.setPosition('left');
        result1.current.setSize('left', 380);
      });

      // Another "component" accessing the store sees same state
      const { result: result2 } = renderHook(() => usePanelStore());
      expect(result2.current.position).toBe('left');
      expect(result2.current.sizes.left).toBe(380);
    });
  });

  describe('reset', () => {
    it('resets all state to defaults', () => {
      const { result } = renderHook(() => usePanelStore());

      // Modify state
      act(() => {
        result.current.setPosition('right');
        result.current.setSize('right', 500);
        result.current.setVisible(true);
        result.current.setCollapsed(true);
        result.current.setPopout(true);
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.position).toBe('bottom');
      expect(result.current.isVisible).toBe(false);
      expect(result.current.isCollapsed).toBe(false);
      expect(result.current.isPopout).toBe(false);
      expect(result.current.sizes).toEqual(DEFAULT_PANEL_SIZES);
    });
  });

  describe('type safety', () => {
    it('only accepts valid positions', () => {
      const validPositions: PanelPosition[] = ['bottom', 'left', 'right', 'floating'];
      const { result } = renderHook(() => usePanelStore());

      validPositions.forEach((pos) => {
        act(() => {
          result.current.setPosition(pos);
        });
        expect(result.current.position).toBe(pos);
      });
    });
  });
});
