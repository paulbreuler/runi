/**
 * Canvas Store Tests
 *
 * Tests for the canvas state management store including context registration,
 * layout selection, popout state, and history navigation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasStore } from './useCanvasStore';
import type { CanvasContextDescriptor } from '@/types/canvas';
import { Square } from 'lucide-react';

// Mock localStorage
const localStorageMock = ((): {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
} => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test panel component
const TestPanel = (): null => null;

describe('useCanvasStore', () => {
  const mockDescriptor: CanvasContextDescriptor = {
    id: 'test-context',
    label: 'Test Context',
    icon: Square,
    panels: {
      panel1: TestPanel,
      panel2: TestPanel,
    },
    layouts: [
      {
        id: 'single',
        label: 'Single',
        description: 'Single panel layout',
        icon: Square,
        category: 'generic',
        arrangement: { type: 'single', panel: '$first' },
      },
      {
        id: 'columns',
        label: 'Columns',
        description: 'Two column layout',
        icon: Square,
        category: 'generic',
        arrangement: { type: 'columns', panels: ['$first', '$second'] },
      },
    ],
    popoutEnabled: true,
    order: 1,
  };

  beforeEach(() => {
    // Clear localStorage first
    localStorageMock.clear();

    // Reset store to initial state
    const { result } = renderHook(() => useCanvasStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('Context Registration', () => {
    it('should register a new context', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
      });

      expect(result.current.contexts.get('test-context')).toEqual(mockDescriptor);
      expect(result.current.contextOrder).toContain('test-context');
    });

    it('should register multiple contexts in order', () => {
      const { result } = renderHook(() => useCanvasStore());

      const descriptor2: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-2',
        order: 2,
      };

      const descriptor3: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-3',
        order: 0,
      };

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.registerContext(descriptor2);
        result.current.registerContext(descriptor3);
      });

      expect(result.current.contextOrder).toEqual(['context-3', 'test-context', 'context-2']);
    });

    it('should unregister a context', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.unregisterContext('test-context');
      });

      expect(result.current.contexts.has('test-context')).toBe(false);
      expect(result.current.contextOrder).not.toContain('test-context');
    });

    it('should set first registered context as active if none active', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
      });

      expect(result.current.activeContextId).toBe('test-context');
    });

    it('should not change active context when registering additional contexts', () => {
      const { result } = renderHook(() => useCanvasStore());

      const descriptor2: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-2',
      };

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.registerContext(descriptor2);
      });

      expect(result.current.activeContextId).toBe('test-context');
    });
  });

  describe('Active Context Switching', () => {
    it('should switch active context', () => {
      const { result } = renderHook(() => useCanvasStore());

      const descriptor2: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-2',
      };

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.registerContext(descriptor2);
        result.current.setActiveContext('context-2');
      });

      expect(result.current.activeContextId).toBe('context-2');
    });

    it('should add context to history when switching', () => {
      const { result } = renderHook(() => useCanvasStore());

      const descriptor2: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-2',
      };

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.registerContext(descriptor2);
        result.current.setActiveContext('context-2');
      });

      expect(result.current.contextHistory).toContain('test-context');
    });

    it('should not switch to unregistered context', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.setActiveContext('non-existent');
      });

      expect(result.current.activeContextId).toBe('test-context');
    });
  });

  describe('Layout Selection', () => {
    it('should set layout for active context', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.setLayout('test-context', 'columns');
      });

      const activeLayout = result.current.getActiveLayout('test-context');
      expect(activeLayout).not.toBeNull();
      expect(activeLayout?.id).toBe('columns');
    });

    it('should maintain separate layouts per context', () => {
      const { result } = renderHook(() => useCanvasStore());

      const descriptor2: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-2',
      };

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.registerContext(descriptor2);
        result.current.setLayout('test-context', 'columns');
        result.current.setLayout('context-2', 'single');
      });

      expect(result.current.activeLayoutPerContext.get('test-context')).toBe('columns');
      expect(result.current.activeLayoutPerContext.get('context-2')).toBe('single');
    });

    it('should default to first layout if not set', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
      });

      const activeLayout = result.current.getActiveLayout('test-context');
      expect(activeLayout).not.toBeNull();
      expect(activeLayout?.id).toBe('single');
    });
  });

  describe('Context State Management', () => {
    it('should set context state', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.setContextState('test-context', { key: 'value' });
      });

      expect(result.current.getContextState('test-context')).toEqual({ key: 'value' });
    });

    it('should merge context state', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.setContextState('test-context', { key1: 'value1' });
        result.current.setContextState('test-context', { key2: 'value2' });
      });

      expect(result.current.getContextState('test-context')).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should maintain separate state per context', () => {
      const { result } = renderHook(() => useCanvasStore());

      const descriptor2: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-2',
      };

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.registerContext(descriptor2);
        result.current.setContextState('test-context', { key: 'value1' });
        result.current.setContextState('context-2', { key: 'value2' });
      });

      expect(result.current.getContextState('test-context')).toEqual({ key: 'value1' });
      expect(result.current.getContextState('context-2')).toEqual({ key: 'value2' });
    });
  });

  describe('Popout State', () => {
    it('should track popped out contexts', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.setPopout('test-context', true);
      });

      expect(result.current.poppedOut.has('test-context')).toBe(true);
    });

    it('should remove context from popout state', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.setPopout('test-context', true);
        result.current.setPopout('test-context', false);
      });

      expect(result.current.poppedOut.has('test-context')).toBe(false);
    });
  });

  describe('History Navigation', () => {
    it('should navigate back to previous context', () => {
      const { result } = renderHook(() => useCanvasStore());

      const descriptor2: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-2',
      };

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.registerContext(descriptor2);
        result.current.setActiveContext('context-2');
        result.current.goBack();
      });

      expect(result.current.activeContextId).toBe('test-context');
    });

    it('should not navigate back if no history', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.goBack();
      });

      expect(result.current.activeContextId).toBe('test-context');
    });

    it('should maintain history order', () => {
      const { result } = renderHook(() => useCanvasStore());

      const descriptor2: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-2',
      };

      const descriptor3: CanvasContextDescriptor = {
        ...mockDescriptor,
        id: 'context-3',
      };

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.registerContext(descriptor2);
        result.current.registerContext(descriptor3);
        // test-context is already active, so switch to context-2, then context-3
        result.current.setActiveContext('context-2');
        result.current.setActiveContext('context-3');
      });

      expect(result.current.contextHistory).toEqual(['test-context', 'context-2']);
    });
  });

  describe('Persistence', () => {
    it('should persist active context ID', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.setActiveContext('test-context');
      });

      // Create new hook instance to test persistence
      const { result: result2 } = renderHook(() => useCanvasStore());

      expect(result2.current.activeContextId).toBe('test-context');
    });

    it('should persist layout per context', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.setLayout('test-context', 'columns');
      });

      // Create new hook instance to test persistence
      const { result: result2 } = renderHook(() => useCanvasStore());

      expect(result2.current.activeLayoutPerContext.get('test-context')).toBe('columns');
    });

    it('should persist context state', () => {
      const { result } = renderHook(() => useCanvasStore());

      act(() => {
        result.current.registerContext(mockDescriptor);
        result.current.setContextState('test-context', { key: 'value' });
      });

      // Create new hook instance to test persistence
      const { result: result2 } = renderHook(() => useCanvasStore());

      expect(result2.current.getContextState('test-context')).toEqual({ key: 'value' });
    });
  });
});
