/**
 * Canvas Store Tests
 *
 * Tests for the canvas state management store including context registration,
 * layout selection, popout state, and history navigation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasStore } from './useCanvasStore';
import { useRequestStoreRaw } from './useRequestStore';
import type { CanvasContextDescriptor, CanvasContextId } from '@/types/canvas';
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

    // Reset stores to initial state
    act(() => {
      useCanvasStore.getState().reset();
      useRequestStoreRaw.setState({ contexts: {} });
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

    it('should return generic layout when not in context layouts', () => {
      const { result } = renderHook(() => useCanvasStore());

      // Register a context with custom layouts that don't include 'single'
      const customDescriptor: CanvasContextDescriptor = {
        id: 'custom-context',
        label: 'Custom Context',
        icon: Square,
        panels: {
          panel1: TestPanel,
        },
        layouts: [
          {
            id: 'custom-layout',
            label: 'Custom',
            description: 'Custom layout',
            icon: Square,
            category: 'preset',
            arrangement: { type: 'single', panel: '$first' },
          },
        ],
        popoutEnabled: true,
        order: 1,
      };

      act(() => {
        result.current.registerContext(customDescriptor);
        // Try to set a generic layout that's not in context.layouts
        result.current.setLayout('custom-context', 'side-by-side');
      });

      const activeLayout = result.current.getActiveLayout('custom-context');
      expect(activeLayout).not.toBeNull();
      expect(activeLayout?.id).toBe('side-by-side');
      expect(activeLayout?.category).toBe('generic');
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
        result.current.setContextState('test-context', { name: 'Persisted Name' });
      });

      // Create new hook instance to test persistence
      const { result: result2 } = renderHook(() => useCanvasStore());

      expect(result2.current.getContextState('test-context')).toEqual({ name: 'Persisted Name' });
    });
  });

  describe('Persistence Hydration', () => {
    it('should nullify activeContextId during merge when contexts is empty', () => {
      // First, create a store with a persisted activeContextId
      {
        const { result } = renderHook(() => useCanvasStore());
        act(() => {
          const contextId = result.current.openRequestTab({
            name: 'Persisted Tab',
          });
          result.current.setActiveContext(contextId);
        });
        // activeContextId is now persisted to localStorage
      }

      // Clear all stores and reset to simulate fresh page load
      // Contexts won't be rehydrated (they're not persisted), but
      // activeContextId and contextState are in localStorage
      localStorageMock.clear();
      act(() => {
        useCanvasStore.getState().reset();
      });

      // Manually populate localStorage with stale activeContextId
      // (simulating what would happen after a page reload)
      localStorageMock.setItem(
        'canvas-store',
        JSON.stringify({
          state: {
            activeContextId: 'request-stale-abc-123',
            activeLayoutPerContext: [],
            contextState: [
              [
                'request-stale-abc-123',
                {
                  name: 'Stale Tab',
                },
              ],
            ],
          },
          version: 0,
        })
      );

      // Create new hook instance to test persistence merge
      // This will call the merge function with the stale persisted state
      const { result: result2 } = renderHook(() => useCanvasStore());

      // After merge, activeContextId should be null because contexts is empty
      // (contexts aren't persisted, so they're always empty on page load)
      expect(result2.current.activeContextId).toBeNull();
      expect(result2.current.contexts.size).toBe(0);
    });

    it('should not restore stale activeContextId from persistence', () => {
      // Clear everything first
      localStorageMock.clear();
      act(() => {
        useCanvasStore.getState().reset();
      });

      // Manually set localStorage to simulate stale persisted state
      localStorageMock.setItem(
        'canvas-store',
        JSON.stringify({
          state: {
            activeContextId: 'request-stale-xyz-789',
            activeLayoutPerContext: [],
            contextState: [],
          },
          version: 0,
        })
      );

      // Create new hook instance
      const { result } = renderHook(() => useCanvasStore());

      // Should not restore the stale activeContextId because
      // there are no contexts registered
      expect(result.current.activeContextId).toBeNull();
    });
  });

  describe('Request Tab Contexts', () => {
    it('should open a new request tab with default state', () => {
      const { result } = renderHook(() => useCanvasStore());

      let newContextId = '';
      act(() => {
        newContextId = result.current.openRequestTab();
      });

      expect(newContextId).toMatch(/^request-/);
      expect(result.current.contexts.has(newContextId)).toBe(true);
      expect(result.current.activeContextId).toBe(newContextId);
    });

    it('should open request tab with custom state', () => {
      const { result } = renderHook(() => useCanvasStore());

      let newContextId = '';
      act(() => {
        newContextId = result.current.openRequestTab({
          method: 'POST',
          url: 'https://api.example.com/users',
          label: 'Create User',
        });
      });

      // Verify request data is in keyed store
      const reqState = useRequestStoreRaw.getState().contexts[newContextId];
      expect(reqState).toBeDefined();
      expect(reqState?.method).toBe('POST');
      expect(reqState?.url).toBe('https://api.example.com/users');

      // Verify label is in canvas store
      expect(result.current.contexts.get(newContextId)?.label).toBe('Create User');
    });

    it('should open request tab with source for deduplication', () => {
      const { result } = renderHook(() => useCanvasStore());

      const source = {
        type: 'collection' as const,
        collectionId: 'col-123',
        requestId: 'req-456',
      };

      let contextId1 = '';
      let contextId2: string | null = '';
      act(() => {
        contextId1 = result.current.openRequestTab({ source });
        contextId2 = result.current.findContextBySource(source);
      });

      expect(contextId2).toBe(contextId1);
    });

    it('should find context by collection source', () => {
      const { result } = renderHook(() => useCanvasStore());

      const source = {
        type: 'collection' as const,
        collectionId: 'col-123',
        requestId: 'req-456',
      };

      let contextId = '';
      act(() => {
        contextId = result.current.openRequestTab({ source });
      });

      const foundId = result.current.findContextBySource(source);
      expect(foundId).toBe(contextId);
    });

    it('should find context by history source', () => {
      const { result } = renderHook(() => useCanvasStore());

      const source = {
        type: 'history' as const,
        historyEntryId: 'entry-789',
      };

      let contextId = '';
      act(() => {
        contextId = result.current.openRequestTab({ source });
      });

      const foundId = result.current.findContextBySource(source);
      expect(foundId).toBe(contextId);
    });

    it('should return null when no matching source found', () => {
      const { result } = renderHook(() => useCanvasStore());

      const source = {
        type: 'collection' as const,
        collectionId: 'col-123',
        requestId: 'req-456',
      };

      const foundId = result.current.findContextBySource(source);
      expect(foundId).toBeNull();
    });

    it('should ignore stale source state when context descriptor is missing', () => {
      const { result } = renderHook(() => useCanvasStore());

      const source = {
        type: 'collection' as const,
        collectionId: 'col-stale',
        requestId: 'req-stale',
      };

      act(() => {
        useCanvasStore.setState((state) => {
          const nextContextState = new Map(state.contextState);
          nextContextState.set('request-stale', {
            source,
            method: 'GET',
            url: 'https://stale.example.com',
            headers: {},
            body: '',
          });
          return { ...state, contextState: nextContextState };
        });
      });

      expect(result.current.findContextBySource(source)).toBeNull();
    });

    it('should ignore matching source state when context exists but is not in context order', () => {
      const { result } = renderHook(() => useCanvasStore());

      const source = {
        type: 'collection' as const,
        collectionId: 'col-ghost',
        requestId: 'req-ghost',
      };

      act(() => {
        useCanvasStore.setState((state) => {
          const nextContexts = new Map(state.contexts);
          nextContexts.set('request-ghost', {
            id: 'request-ghost',
            label: 'Ghost Request',
            order: 999,
            panels: {},
            layouts: [],
          });

          const nextContextState = new Map(state.contextState);
          nextContextState.set('request-ghost', {
            source,
            method: 'GET',
            url: 'https://ghost.example.com',
            headers: {},
            body: '',
          });

          // Intentionally do not add request-ghost to contextOrder.
          return {
            ...state,
            contexts: nextContexts,
            contextState: nextContextState,
          };
        });
      });

      expect(result.current.findContextBySource(source)).toBeNull();
    });

    it('should close request tab and activate adjacent context', () => {
      const { result } = renderHook(() => useCanvasStore());

      let tab2 = '';
      let tab3 = '';
      act(() => {
        result.current.openRequestTab({ label: 'Tab 1' });
        tab2 = result.current.openRequestTab({ label: 'Tab 2' });
        tab3 = result.current.openRequestTab({ label: 'Tab 3' });
      });

      expect(result.current.activeContextId).toBe(tab3);

      act(() => {
        result.current.closeContext(tab3);
      });

      // Should activate previous tab (tab2)
      expect(result.current.activeContextId).toBe(tab2);
      expect(result.current.contexts.has(tab3)).toBe(false);
    });

    it('should activate next tab when closing earlier tab', () => {
      const { result } = renderHook(() => useCanvasStore());

      let tab1 = '';
      let tab2 = '';
      act(() => {
        tab1 = result.current.openRequestTab({ label: 'Tab 1' });
        tab2 = result.current.openRequestTab({ label: 'Tab 2' });
        result.current.openRequestTab({ label: 'Tab 3' });
        result.current.setActiveContext(tab1); // Make tab1 active
        result.current.closeContext(tab1);
      });

      // Should activate next tab (tab2)
      expect(result.current.activeContextId).toBe(tab2);
      expect(result.current.contexts.has(tab1)).toBe(false);
    });

    it('should update context state with partial patch', () => {
      const { result } = renderHook(() => useCanvasStore());

      let contextId = '';
      act(() => {
        contextId = result.current.openRequestTab({
          label: 'Tab 1',
          name: 'Original Name',
        });
      });

      act(() => {
        result.current.updateContextState(contextId, { name: 'Updated Name', isSaved: true });
      });

      const state = result.current.getContextState(contextId);
      expect(state.name).toBe('Updated Name');
      expect(state.isSaved).toBe(true);
    });

    it('should exclude request data from useCanvasStore persistence', () => {
      const { result } = renderHook(() => useCanvasStore());

      let contextId = '';
      act(() => {
        contextId = result.current.openRequestTab({
          label: 'Tab 1',
          name: 'My Tab',
        });
      });

      // Manually call partialize to verify it includes metadata
      const state = result.current;
      const partializedState = {
        activeContextId: state.activeContextId,
        activeLayoutPerContext: Array.from(state.activeLayoutPerContext.entries()),
        contextState: Array.from(state.contextState.entries()),
      };

      // Find our context in the partialized state
      const partializedContextState = new Map<string, Record<string, unknown>>(
        partializedState.contextState
      );
      const persistedState = partializedContextState.get(contextId);

      expect(persistedState).toBeDefined();
      expect(persistedState?.name).toBe('My Tab');
      // Request data should NOT be here (it's in useRequestStoreRaw)
      expect(persistedState?.method).toBeUndefined();
      expect(persistedState?.url).toBeUndefined();
    });
  });

  describe('Template Registration', () => {
    it('should register a template without adding to contextOrder', () => {
      const { result } = renderHook(() => useCanvasStore());

      const templateDescriptor: CanvasContextDescriptor = {
        id: 'request',
        label: 'Request Template',
        icon: Square,
        panels: { request: TestPanel, response: TestPanel },
        layouts: [],
        contextType: 'request',
        popoutEnabled: false,
        order: 0,
      };

      act(() => {
        result.current.registerTemplate(templateDescriptor);
      });

      // Should be in templates Map
      expect(result.current.templates.has('request')).toBe(true);
      expect(result.current.templates.get('request')).toEqual(templateDescriptor);

      // Should NOT be in contexts or contextOrder
      expect(result.current.contexts.has('request')).toBe(false);
      expect(result.current.contextOrder).not.toContain('request');
    });

    it('should not set template as active context', () => {
      const { result } = renderHook(() => useCanvasStore());

      const templateDescriptor: CanvasContextDescriptor = {
        id: 'request',
        label: 'Request Template',
        icon: Square,
        panels: { request: TestPanel, response: TestPanel },
        layouts: [],
        contextType: 'request',
        popoutEnabled: false,
        order: 0,
      };

      act(() => {
        result.current.registerTemplate(templateDescriptor);
      });

      // activeContextId should remain null
      expect(result.current.activeContextId).toBeNull();
    });
  });

  describe('openRequestTab - template inheritance', () => {
    it('should inherit panels from registered "request" template', () => {
      const { result } = renderHook(() => useCanvasStore());

      // First register a template with panels
      const templatePanels = {
        request: TestPanel,
        response: TestPanel,
      };
      const templateContext: CanvasContextDescriptor = {
        id: 'request',
        label: 'Request Template',
        icon: Square,
        panels: templatePanels,
        layouts: [],
        contextType: 'request',
        popoutEnabled: false,
        order: 0,
      };

      act(() => {
        result.current.registerTemplate(templateContext);
      });

      // Now create a dynamic request tab
      let contextId = '';
      act(() => {
        contextId = result.current.openRequestTab();
      });

      // Get the created context
      const context = result.current.contexts.get(contextId);
      expect(context).toBeDefined();
      expect(context?.panels).toEqual(templatePanels);
      expect(context?.panels.request).toBe(TestPanel);
      expect(context?.panels.response).toBe(TestPanel);
      expect(context?.contextType).toBe('request');
    });

    it('should inherit layouts from registered "request" template', () => {
      const { result } = renderHook(() => useCanvasStore());

      // Register template with layouts
      const templateLayouts = [
        { id: 'default', label: 'Default', grid: 'single' },
        { id: 'split', label: 'Split', grid: 'split' },
      ];
      const templateContext: CanvasContextDescriptor = {
        id: 'request',
        label: 'Request Template',
        icon: Square,
        panels: { request: TestPanel, response: TestPanel },
        layouts: templateLayouts as unknown as CanvasContextDescriptor['layouts'],
        contextType: 'request',
        popoutEnabled: false,
        order: 0,
      };

      act(() => {
        result.current.registerTemplate(templateContext);
      });

      // Create dynamic request tab
      let contextId = '';
      act(() => {
        contextId = result.current.openRequestTab();
      });

      // Verify layouts inherited
      const context = result.current.contexts.get(contextId);
      expect(context).toBeDefined();
      expect(context?.layouts).toEqual(templateLayouts);
      expect(context?.layouts).toHaveLength(2);
    });

    it('should inherit toolbar from registered "request" template', () => {
      const { result } = renderHook(() => useCanvasStore());

      // Register template with toolbar
      const templateContext: CanvasContextDescriptor = {
        id: 'request',
        label: 'Request Template',
        icon: Square,
        panels: { request: TestPanel },
        toolbar: TestPanel,
        layouts: [],
        contextType: 'request',
        popoutEnabled: false,
        order: 0,
      };

      act(() => {
        result.current.registerTemplate(templateContext);
      });

      // Create dynamic request tab
      let contextId = '';
      act(() => {
        contextId = result.current.openRequestTab();
      });

      // Verify toolbar inherited
      const context = result.current.contexts.get(contextId);
      expect(context).toBeDefined();
      expect(context?.toolbar).toBe(TestPanel);
    });

    it('should use fallback panels when no "request" template is registered', () => {
      const { result } = renderHook(() => useCanvasStore());

      // Create dynamic request tab without registering template
      let contextId = '';
      act(() => {
        contextId = result.current.openRequestTab();
      });

      // Should have fallback null panels
      const context = result.current.contexts.get(contextId);
      expect(context).toBeDefined();
      expect(context?.panels.request).toBeDefined();
      expect(context?.panels.response).toBeDefined();
      // Fallback panels should be defined (they are empty components that return null)
      expect(context?.panels.request).toBeDefined();
      expect(context?.panels.response).toBeDefined();
    });

    it('should use empty layouts when no "request" template is registered', () => {
      const { result } = renderHook(() => useCanvasStore());

      // Create dynamic request tab without registering template
      let contextId = '';
      act(() => {
        contextId = result.current.openRequestTab();
      });

      // Should have empty layouts
      const context = result.current.contexts.get(contextId);
      expect(context).toBeDefined();
      expect(context?.layouts).toEqual([]);
    });
  });

  describe('activate option', () => {
    it('should activate new tab by default when using openRequestTab', () => {
      const { result } = renderHook(() => useCanvasStore());

      let tab2 = '';
      act(() => {
        result.current.openRequestTab({ label: 'Tab 1' });
        tab2 = result.current.openRequestTab({ label: 'Tab 2' });
      });

      // Tab 2 should be active (default behavior)
      expect(result.current.activeContextId).toBe(tab2);
    });

    it('should not activate new tab when activate=false in openRequestTab', () => {
      const { result } = renderHook(() => useCanvasStore());

      let tab1 = '';
      let tab2 = '';
      act(() => {
        tab1 = result.current.openRequestTab({ label: 'Tab 1' });
        tab2 = result.current.openRequestTab({ label: 'Tab 2' }, { activate: false });
      });

      // Tab 1 should still be active
      expect(result.current.activeContextId).toBe(tab1);

      // But tab 2 should exist in context order
      expect(result.current.contextOrder).toContain(tab2);
      expect(result.current.contexts.has(tab2)).toBe(true);
    });

    it('should activate adjacent tab by default when closing active tab', () => {
      const { result } = renderHook(() => useCanvasStore());

      let tab2 = '';
      let tab3 = '';
      act(() => {
        result.current.openRequestTab({ label: 'Tab 1' });
        tab2 = result.current.openRequestTab({ label: 'Tab 2' });
        tab3 = result.current.openRequestTab({ label: 'Tab 3' });
      });

      // Tab 3 is currently active
      expect(result.current.activeContextId).toBe(tab3);

      act(() => {
        result.current.closeContext(tab3);
      });

      // Tab 2 should be activated (adjacent)
      expect(result.current.activeContextId).toBe(tab2);
    });

    it('should not activate adjacent tab when activate=false in closeContext', () => {
      const { result } = renderHook(() => useCanvasStore());

      let tab1 = '';
      let tab3 = '';
      act(() => {
        tab1 = result.current.openRequestTab({ label: 'Tab 1' });
        result.current.openRequestTab({ label: 'Tab 2' });
        tab3 = result.current.openRequestTab({ label: 'Tab 3' });
      });

      // Switch to tab1
      act(() => {
        result.current.setActiveContext(tab1);
      });

      expect(result.current.activeContextId).toBe(tab1);

      // Close tab3 with activate=false
      act(() => {
        result.current.closeContext(tab3, { activate: false });
      });

      // Tab 1 should still be active (not switched)
      expect(result.current.activeContextId).toBe(tab1);

      // Tab 3 should be gone
      expect(result.current.contexts.has(tab3)).toBe(false);
    });

    it('should activate adjacent tab when closing active tab even with activate=false (edge case)', () => {
      const { result } = renderHook(() => useCanvasStore());

      let tab1 = '';
      let tab2 = '';
      act(() => {
        tab1 = result.current.openRequestTab({ label: 'Tab 1' });
        tab2 = result.current.openRequestTab({ label: 'Tab 2' });
      });

      // Tab 2 is currently active
      expect(result.current.activeContextId).toBe(tab2);

      // Close active tab with activate=false - should still activate adjacent
      act(() => {
        result.current.closeContext(tab2 as CanvasContextId, { activate: false });
      });

      // Tab 1 should be activated (can't leave user on blank view)
      expect(result.current.activeContextId).toBe(tab1);
    });
  });
});
