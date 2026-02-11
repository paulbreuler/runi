/**
 * Canvas State Management Store
 *
 * Manages canvas contexts, layouts, popout state, and navigation history.
 * Uses Zustand with persistence for maintaining state across sessions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CanvasContextDescriptor, CanvasContextId, CanvasLayout } from '@/types/canvas';

interface CanvasState {
  /** Currently active context ID */
  activeContextId: CanvasContextId | null;

  /** Registered canvas contexts */
  contexts: Map<CanvasContextId, CanvasContextDescriptor>;

  /** Ordered list of context IDs for display */
  contextOrder: CanvasContextId[];

  /** Active layout ID per context */
  activeLayoutPerContext: Map<CanvasContextId, string>;

  /** Context-specific state */
  contextState: Map<CanvasContextId, Record<string, unknown>>;

  /** Set of popped out context IDs */
  poppedOut: Set<CanvasContextId>;

  /** Context navigation history */
  contextHistory: CanvasContextId[];

  // Actions
  /** Register a new canvas context */
  registerContext: (descriptor: CanvasContextDescriptor) => void;

  /** Unregister a canvas context */
  unregisterContext: (contextId: CanvasContextId) => void;

  /** Set the active context */
  setActiveContext: (contextId: CanvasContextId) => void;

  /** Set the active layout for a specific context */
  setLayout: (contextId: CanvasContextId, layoutId: string) => void;

  /** Get the active layout for a specific context */
  getActiveLayout: (contextId: CanvasContextId) => CanvasLayout | null;

  /** Set state for a specific context */
  setContextState: (contextId: CanvasContextId, state: Record<string, unknown>) => void;

  /** Get state for a specific context */
  getContextState: (contextId: CanvasContextId) => Record<string, unknown>;

  /** Set popout state for a context */
  setPopout: (contextId: CanvasContextId, isPopped: boolean) => void;

  /** Navigate back to previous context */
  goBack: () => void;

  /** Reset store to initial state (for testing) */
  reset: () => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
      activeContextId: null,
      contexts: new Map(),
      contextOrder: [],
      activeLayoutPerContext: new Map(),
      contextState: new Map(),
      poppedOut: new Set(),
      contextHistory: [],

      registerContext: (descriptor): void => {
        set((state) => {
          const newContexts = new Map(state.contexts);
          newContexts.set(descriptor.id, descriptor);

          // Add to order, sorted by order property
          const newOrder = [...state.contextOrder];
          if (!newOrder.includes(descriptor.id)) {
            newOrder.push(descriptor.id);
            newOrder.sort((a, b) => {
              const orderA = newContexts.get(a)?.order ?? 999;
              const orderB = newContexts.get(b)?.order ?? 999;
              return orderA - orderB;
            });
          }

          return {
            contexts: newContexts,
            contextOrder: newOrder,
            // Set as active if no active context
            activeContextId: state.activeContextId ?? descriptor.id,
          };
        });
      },

      unregisterContext: (contextId): void => {
        set((state) => {
          const newContexts = new Map(state.contexts);
          newContexts.delete(contextId);

          const newOrder = state.contextOrder.filter((id) => id !== contextId);

          const newLayoutPerContext = new Map(state.activeLayoutPerContext);
          newLayoutPerContext.delete(contextId);

          const newContextState = new Map(state.contextState);
          newContextState.delete(contextId);

          const newPoppedOut = new Set(state.poppedOut);
          newPoppedOut.delete(contextId);

          return {
            contexts: newContexts,
            contextOrder: newOrder,
            activeLayoutPerContext: newLayoutPerContext,
            contextState: newContextState,
            poppedOut: newPoppedOut,
            activeContextId:
              state.activeContextId === contextId ? (newOrder[0] ?? null) : state.activeContextId,
          };
        });
      },

      setActiveContext: (contextId): void => {
        const { contexts, activeContextId } = get();

        // Only set if context exists and is different
        if (!contexts.has(contextId) || activeContextId === contextId) {
          return;
        }

        set((state) => {
          // Add current context to history
          const newHistory = [...state.contextHistory];
          if (activeContextId !== null) {
            newHistory.push(activeContextId);
          }

          return {
            activeContextId: contextId,
            contextHistory: newHistory,
          };
        });
      },

      setLayout: (contextId, layoutId): void => {
        const { contexts } = get();
        if (!contexts.has(contextId)) {
          return;
        }

        set((state) => {
          const newLayoutPerContext = new Map(state.activeLayoutPerContext);
          newLayoutPerContext.set(contextId, layoutId);

          return {
            activeLayoutPerContext: newLayoutPerContext,
          };
        });
      },

      getActiveLayout: (contextId): CanvasLayout | null => {
        const { activeLayoutPerContext, contexts } = get();

        const context = contexts.get(contextId);
        if (context === undefined) {
          return null;
        }

        // Get stored layout ID or default to first layout
        const storedLayoutId = activeLayoutPerContext.get(contextId);
        const layoutId = storedLayoutId ?? context.layouts[0]?.id;

        if (layoutId === undefined) {
          return null;
        }

        // Find and return the full layout object
        return context.layouts.find((layout) => layout.id === layoutId) ?? null;
      },

      setContextState: (contextId, state): void => {
        set((currentState) => {
          const newContextState = new Map(currentState.contextState);
          const existingState = newContextState.get(contextId) ?? {};
          newContextState.set(contextId, { ...existingState, ...state });

          return {
            contextState: newContextState,
          };
        });
      },

      getContextState: (contextId): Record<string, unknown> => {
        return get().contextState.get(contextId) ?? {};
      },

      setPopout: (contextId, isPopped): void => {
        set((state) => {
          const newPoppedOut = new Set(state.poppedOut);
          if (isPopped) {
            newPoppedOut.add(contextId);
          } else {
            newPoppedOut.delete(contextId);
          }

          return {
            poppedOut: newPoppedOut,
          };
        });
      },

      goBack: (): void => {
        const { contextHistory } = get();
        if (contextHistory.length === 0) {
          return;
        }

        const previousContext = contextHistory[contextHistory.length - 1];
        const newHistory = contextHistory.slice(0, -1);

        set({
          activeContextId: previousContext,
          contextHistory: newHistory,
        });
      },

      reset: (): void => {
        set({
          activeContextId: null,
          contexts: new Map(),
          contextOrder: [],
          activeLayoutPerContext: new Map(),
          contextState: new Map(),
          poppedOut: new Set(),
          contextHistory: [],
        });
      },
    }),
    {
      name: 'canvas-store',
      partialize: (state) => ({
        activeContextId: state.activeContextId,
        activeLayoutPerContext: Array.from(state.activeLayoutPerContext.entries()),
        contextState: Array.from(state.contextState.entries()),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          activeContextId?: CanvasContextId | null;
          activeLayoutPerContext?: Array<[CanvasContextId, string]>;
          contextState?: Array<[CanvasContextId, Record<string, unknown>]>;
        };

        return {
          ...currentState,
          activeContextId: persisted.activeContextId ?? currentState.activeContextId,
          activeLayoutPerContext: new Map(
            persisted.activeLayoutPerContext ?? currentState.activeLayoutPerContext
          ),
          contextState: new Map(persisted.contextState ?? currentState.contextState),
        };
      },
    }
  )
);
