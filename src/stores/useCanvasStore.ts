/**
 * Canvas State Management Store
 *
 * Manages canvas contexts, layouts, popout state, and navigation history.
 * Uses Zustand with persistence for maintaining state across sessions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CanvasContextDescriptor,
  CanvasContextId,
  CanvasLayout,
  RequestTabState,
  RequestTabSource,
} from '@/types/canvas';
import { GENERIC_LAYOUTS } from '@/components/Layout/layouts';
import { Send } from 'lucide-react';

/**
 * Check if two RequestTabSource objects match
 */
function sourcesMatch(a: RequestTabSource, b: RequestTabSource): boolean {
  if (a.type !== b.type) {
    return false;
  }
  if (a.type === 'collection') {
    return a.collectionId === b.collectionId && a.requestId === b.requestId;
  }
  // history
  return a.historyEntryId === b.historyEntryId;
}

/**
 * Derive a human-readable label from a URL or explicit name
 */
function deriveTabLabel(url: string, name?: string): string {
  if (name !== undefined && name.length > 0) {
    return name;
  }

  if (url.length === 0) {
    return 'New Request';
  }

  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    // Use last meaningful path segment, or hostname if root
    if (path === '/' || path === '') {
      return parsed.hostname;
    }
    // Remove trailing slash and get last segment
    const segments = path.replace(/\/$/, '').split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment !== undefined ? `/${lastSegment}` : parsed.hostname;
  } catch {
    // Not a valid URL — return as-is (truncated)
    return url.length > 30 ? `${url.slice(0, 30)}...` : url;
  }
}

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

  /** Update context state with partial patch */
  updateContextState: (contextId: CanvasContextId, patch: Record<string, unknown>) => void;

  /** Set popout state for a context */
  setPopout: (contextId: CanvasContextId, isPopped: boolean) => void;

  /** Navigate back to previous context */
  goBack: () => void;

  /** Open a new request tab context with optional initial state */
  openRequestTab: (overrides?: Partial<RequestTabState> & { label?: string }) => string;

  /** Close a context and activate adjacent one */
  closeContext: (contextId: CanvasContextId) => void;

  /** Find context by source (collection or history) */
  findContextBySource: (source: RequestTabSource) => string | null;

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
        return (
          context.layouts.find((layout) => layout.id === layoutId) ??
          GENERIC_LAYOUTS.find((layout) => layout.id === layoutId) ??
          null
        );
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

      updateContextState: (contextId, patch): void => {
        set((state) => {
          const newContextState = new Map(state.contextState);
          const existingState = newContextState.get(contextId) ?? {};
          newContextState.set(contextId, { ...existingState, ...patch });

          return {
            contextState: newContextState,
          };
        });
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

      openRequestTab: (overrides): string => {
        const contextId: CanvasContextId = `request-${crypto.randomUUID()}`;
        const url = overrides?.url ?? '';
        const label = overrides?.label ?? deriveTabLabel(url);

        // Create default request state
        const defaultState: RequestTabState = {
          method: 'GET',
          url: '',
          headers: {},
          body: '',
          isDirty: false,
          createdAt: Date.now(),
        };

        const state: RequestTabState = {
          ...defaultState,
          ...overrides,
        };

        // Create a dynamic context descriptor for this request tab
        const descriptor: CanvasContextDescriptor = {
          id: contextId,
          label,
          icon: Send,
          panels: {
            request: (): null => null, // Will be replaced by actual panels
            response: (): null => null,
          },
          toolbar: undefined,
          layouts: [], // Will use generic layouts
          popoutEnabled: true,
          popoutDefaults: {
            width: 1200,
            height: 800,
            title: `runi - ${label}`,
          },
          order: 999, // Request tabs come after static contexts
          shortcutHint: undefined,
        };

        // Register the context and make it active
        set((currentState) => {
          const newContexts = new Map(currentState.contexts);
          newContexts.set(descriptor.id, descriptor);

          const newOrder = [...currentState.contextOrder];
          if (!newOrder.includes(descriptor.id)) {
            newOrder.push(descriptor.id);
            newOrder.sort((a, b) => {
              const orderA = newContexts.get(a)?.order ?? 999;
              const orderB = newContexts.get(b)?.order ?? 999;
              return orderA - orderB;
            });
          }

          const newContextState = new Map(currentState.contextState);
          newContextState.set(contextId, state as Record<string, unknown>);

          return {
            contexts: newContexts,
            contextOrder: newOrder,
            contextState: newContextState,
            activeContextId: contextId, // Always set new tab as active
          };
        });

        return contextId;
      },

      closeContext: (contextId): void => {
        const { contextOrder, activeContextId, unregisterContext, setActiveContext } = get();

        // Find the index of the context being closed
        const closedIndex = contextOrder.indexOf(contextId);
        if (closedIndex === -1) {
          return;
        }

        // Determine which context to activate next
        let newActiveId: CanvasContextId | null = activeContextId;
        if (activeContextId === contextId) {
          // Remove the context from the order to find adjacent contexts
          const remainingOrder = contextOrder.filter((id) => id !== contextId);
          if (remainingOrder.length > 0) {
            // Prefer next context; fall back to previous
            const newIndex = closedIndex < remainingOrder.length ? closedIndex : closedIndex - 1;
            newActiveId = remainingOrder[Math.max(0, newIndex)] ?? null;
          } else {
            newActiveId = null;
          }
        }

        // Unregister the context first
        unregisterContext(contextId);

        // Then activate the new context if needed
        if (newActiveId !== null && newActiveId !== activeContextId) {
          setActiveContext(newActiveId);
        }
      },

      findContextBySource: (source): string | null => {
        const { contextState } = get();

        for (const [contextId, state] of contextState.entries()) {
          const tabState = state as unknown as RequestTabState;
          if (tabState.source !== undefined && sourcesMatch(tabState.source, source)) {
            return contextId;
          }
        }

        return null;
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
        // Exclude response from persisted context state
        contextState: Array.from(state.contextState.entries()).map(([id, stateData]) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { response, ...rest } = stateData as Record<string, unknown> & {
            response?: unknown;
          };
          return [id, rest] as [CanvasContextId, Record<string, unknown>];
        }),
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
