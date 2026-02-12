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
import { globalEventBus, logEventFlow } from '@/events/bus';

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

  /** Update tab name and ensure uniqueness */
  updateTabName: (contextId: CanvasContextId, name: string) => void;

  /** Check if tab has meaningful data (for autosave) */
  hasMeaningfulData: (contextId: CanvasContextId) => boolean;

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
          logEventFlow('process', 'canvas.context-changed', undefined, {
            action: 'skipped-no-change',
            contextId,
            activeContextId,
            contextExists: contexts.has(contextId),
          });
          return;
        }

        logEventFlow('process', 'canvas.context-changed', undefined, {
          action: 'activating',
          fromContextId: activeContextId,
          toContextId: contextId,
        });

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

        // Emit event for other components to react
        globalEventBus.emit(
          'canvas.context-changed',
          {
            contextId,
            previousContextId: activeContextId,
          },
          'CanvasStore'
        );

        logEventFlow('complete', 'canvas.context-changed', undefined, {
          action: 'activated',
          contextId,
          previousContextId: activeContextId,
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

        logEventFlow('process', 'canvas.context-changed', undefined, {
          action: 'opening-request-tab',
          contextId,
          url,
          source: overrides?.source,
        });

        // Use name if provided, otherwise use label override, otherwise derive from URL
        const name = overrides?.name;
        const label = name ?? overrides?.label ?? deriveTabLabel(url, overrides?.name);

        // Create default request state
        const defaultState: RequestTabState = {
          method: 'GET',
          url: '',
          headers: {},
          body: '',
          isDirty: false,
          isSaved: false,
          createdAt: Date.now(),
        };

        const state: RequestTabState = {
          ...defaultState,
          ...overrides,
          name, // Store name in state
        };

        // Look up the 'request' template context to inherit panels, toolbar, and layouts
        const templateContext = get().contexts.get('request');
        if (templateContext === undefined) {
          console.warn(
            '[canvas] openRequestTab: "request" template not registered. Panels will be empty.'
          );
        }

        // Create a dynamic context descriptor for this request tab
        const descriptor: CanvasContextDescriptor = {
          id: contextId,
          label,
          icon: Send,
          // Inherit panels from template, or use fallback
          panels: templateContext?.panels ?? {
            request: (): null => null,
            response: (): null => null,
          },
          // Inherit toolbar from template
          toolbar: templateContext?.toolbar,
          // Inherit layouts from template, or use empty array
          layouts: templateContext?.layouts ?? [],
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
          newContextState.set(contextId, state as unknown as Record<string, unknown>);

          return {
            contexts: newContexts,
            contextOrder: newOrder,
            contextState: newContextState,
            activeContextId: contextId, // Always set new tab as active
          };
        });

        logEventFlow('complete', 'canvas.context-changed', undefined, {
          action: 'opened-request-tab',
          contextId,
          activeContextId: get().activeContextId,
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
        const { contextState, contexts, contextOrder } = get();

        for (const [contextId, state] of contextState.entries()) {
          // Only request tabs are source-addressable.
          if (!contextId.startsWith('request-')) {
            continue;
          }

          // Ignore stale persisted state entries that no longer have a
          // corresponding context descriptor in the active runtime.
          if (!contexts.has(contextId)) {
            continue;
          }

          // Ignore contexts that are not part of the tab order (ghost descriptors).
          if (!contextOrder.includes(contextId)) {
            continue;
          }

          const tabState = state as unknown as RequestTabState;
          if (tabState.source !== undefined && sourcesMatch(tabState.source, source)) {
            return contextId;
          }
        }

        return null;
      },

      updateTabName: (contextId, name): void => {
        const { contexts, contextState } = get();

        // Ensure uniqueness by appending counter if needed
        let uniqueName = name;
        let counter = 1;
        const existingNames = new Set<string>();

        // Collect all existing names except the current context
        for (const [id, state] of contextState.entries()) {
          if (id !== contextId) {
            const tabState = state as unknown as RequestTabState;
            if (tabState.name !== undefined) {
              existingNames.add(tabState.name);
            }
          }
        }

        // Ensure uniqueness
        while (existingNames.has(uniqueName)) {
          counter++;
          uniqueName = `${name} (${String(counter)})`;
        }

        // Update context state
        set((state) => {
          const newContextState = new Map(state.contextState);
          const existingState = newContextState.get(contextId) ?? {};
          newContextState.set(contextId, { ...existingState, name: uniqueName });

          return {
            contextState: newContextState,
          };
        });

        // Update context descriptor label
        const context = contexts.get(contextId);
        if (context !== undefined) {
          set((state) => {
            const newContexts = new Map(state.contexts);
            newContexts.set(contextId, {
              ...context,
              label: uniqueName,
            });

            return {
              contexts: newContexts,
            };
          });
        }
      },

      hasMeaningfulData: (contextId): boolean => {
        const { contextState } = get();
        const state = contextState.get(contextId) as unknown as RequestTabState | undefined;

        if (state === undefined) {
          return false;
        }

        // Consider data "meaningful" if:
        // - URL is not empty
        // - OR headers are not empty
        // - OR body is not empty
        return (
          state.url.length > 0 || Object.keys(state.headers).length > 0 || state.body.length > 0
        );
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
          // Don't restore activeContextId — contexts aren't persisted,
          // so it would point to a non-existent descriptor.
          // HomePage's effect will set the correct active context.
          activeContextId: null,
          activeLayoutPerContext: new Map(
            persisted.activeLayoutPerContext ?? currentState.activeLayoutPerContext
          ),
          contextState: new Map(persisted.contextState ?? currentState.contextState),
        };
      },
    }
  )
);

// Set up event listeners for context operations (skip in test environment)
if (typeof globalEventBus.on === 'function') {
  globalEventBus.on<{ contextId: string }>('context.activate', (event) => {
    useCanvasStore.getState().setActiveContext(event.payload.contextId);
  });

  globalEventBus.on<{ contextId: string }>('context.close', (event) => {
    useCanvasStore.getState().closeContext(event.payload.contextId);
  });

  globalEventBus.on('request.open', () => {
    useCanvasStore.getState().openRequestTab();
  });
}
