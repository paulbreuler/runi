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
import { globalEventBus, logEventFlow, type RequestSavedToCollectionPayload } from '@/events/bus';
import {
  useRequestStoreRaw,
  DEFAULT_REQUEST_STATE,
  type RequestContextState,
} from './useRequestStore';

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
function deriveTabLabel(url: string | undefined | null, name?: string): string {
  if (name !== undefined && name.length > 0) {
    return name;
  }

  const safeUrl = url ?? '';
  if (safeUrl.length === 0) {
    return 'New Request';
  }

  try {
    const parsed = new URL(safeUrl);
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
    return safeUrl.length > 30 ? `${safeUrl.slice(0, 30)}...` : safeUrl;
  }
}

interface CanvasState {
  /** Currently active context ID */
  activeContextId: CanvasContextId | null;

  /** Registered canvas contexts */
  contexts: Map<CanvasContextId, CanvasContextDescriptor>;

  /** Context templates (not visible, used as factories) */
  templates: Map<CanvasContextId, CanvasContextDescriptor>;

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

  /** Register a template (not visible, used as a factory) */
  registerTemplate: (descriptor: CanvasContextDescriptor) => void;

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
  openRequestTab: (
    overrides?: Partial<RequestTabState & RequestContextState> & { label?: string },
    options?: { activate?: boolean }
  ) => string;

  /** Close a context and activate adjacent one */
  closeContext: (contextId: CanvasContextId, options?: { activate?: boolean }) => void;

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
      templates: new Map(),
      contextOrder: [],
      activeLayoutPerContext: new Map(),
      contextState: new Map(),
      poppedOut: new Set(),
      contextHistory: [],

      registerTemplate: (descriptor): void => {
        set((state) => {
          const newTemplates = new Map(state.templates);
          newTemplates.set(descriptor.id, descriptor);

          return {
            templates: newTemplates,
          };
        });
      },

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

          // Filter out request-specific data that should live in useRequestStoreRaw
          const metadata = { ...state } as Record<string, unknown>;
          delete metadata.method;
          delete metadata.url;
          delete metadata.headers;
          delete metadata.body;
          delete metadata.response;

          newContextState.set(contextId, { ...existingState, ...metadata });
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

          // Filter out request-specific data that should live in useRequestStoreRaw
          const metadata = { ...patch } as Record<string, unknown>;
          delete metadata.method;
          delete metadata.url;
          delete metadata.headers;
          delete metadata.body;
          delete metadata.response;

          newContextState.set(contextId, { ...existingState, ...metadata });

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

      openRequestTab: (overrides, options): string => {
        const shouldActivate = options?.activate ?? true;
        const contextId: CanvasContextId = `request-${crypto.randomUUID()}`;

        interface OpenRequestOverrides
          extends Partial<RequestTabState>, Partial<RequestContextState> {
          label?: string;
        }
        const typedOverrides = overrides as OpenRequestOverrides | undefined;
        const url = typedOverrides?.url ?? '';

        logEventFlow('process', 'canvas.context-changed', undefined, {
          action: 'opening-request-tab',
          contextId,
          url,
          source: typedOverrides?.source,
        });

        // Use name if provided, otherwise use label override, otherwise derive from URL
        const name = typedOverrides?.name;
        const label = name ?? typedOverrides?.label ?? deriveTabLabel(url, name);

        // Create default request state for useRequestStoreRaw
        const requestState: RequestContextState = {
          ...DEFAULT_REQUEST_STATE,
          method: typedOverrides?.method ?? DEFAULT_REQUEST_STATE.method,
          url: typedOverrides?.url ?? DEFAULT_REQUEST_STATE.url,
          headers: typedOverrides?.headers ?? DEFAULT_REQUEST_STATE.headers,
          body: typedOverrides?.body ?? DEFAULT_REQUEST_STATE.body,
          response: typedOverrides?.response ?? DEFAULT_REQUEST_STATE.response,
          isLoading: false,
        };

        // Initialize keyed request store
        useRequestStoreRaw.getState().initContext(contextId, requestState);

        // Look up the 'request' template to inherit panels, toolbar, and layouts
        const templateContext = get().templates.get('request');
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
          contextType: 'request', // Mark as a request instance
        };

        // Register the context and optionally make it active
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
          const metadata: Record<string, unknown> = {
            source: typedOverrides?.source,
            name,
            isDirty: typedOverrides?.isDirty ?? false,
            isSaved: typedOverrides?.isSaved ?? false,
            createdAt: typedOverrides?.createdAt ?? Date.now(),
          };
          newContextState.set(contextId, metadata);

          return {
            contexts: newContexts,
            contextOrder: newOrder,
            contextState: newContextState,
            // Only set as active if activate option is true
            activeContextId: shouldActivate ? contextId : currentState.activeContextId,
          };
        });

        logEventFlow('complete', 'canvas.context-changed', undefined, {
          action: 'opened-request-tab',
          contextId,
          label,
        });

        return contextId;
      },

      closeContext: (contextId, options): void => {
        const { contextOrder, activeContextId, unregisterContext, setActiveContext } = get();
        const shouldActivate = options?.activate ?? true;

        // Find the index of the context being closed
        const closedIndex = contextOrder.indexOf(contextId);
        if (closedIndex === -1) {
          return;
        }

        // Determine which context to activate next
        let newActiveId: CanvasContextId | null = activeContextId;

        // Edge case: If closing the user's active tab, ALWAYS activate adjacent
        // (even with activate=false) to avoid blank view
        const isClosingActiveTab = activeContextId === contextId;

        if (isClosingActiveTab || shouldActivate) {
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
        // Read request state from keyed store
        const reqStore = useRequestStoreRaw.getState();
        const reqState = reqStore.contexts[contextId];

        // Guard against missing context or missing URL
        if (reqState === undefined) {
          return false;
        }

        const url = reqState.url;
        const headers = reqState.headers;
        const body = reqState.body;

        // Consider data "meaningful" if:
        // - URL is not empty (and not default)
        // - OR headers are not empty
        // - OR body is not empty
        return (
          (url.length > 0 && url !== DEFAULT_REQUEST_STATE.url) ||
          Object.keys(headers).length > 0 ||
          body.length > 0
        );
      },

      reset: (): void => {
        set({
          activeContextId: null,
          contexts: new Map(),
          templates: new Map(),
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

  globalEventBus.on<RequestSavedToCollectionPayload>('request.saved-to-collection', (event) => {
    const { collection_id, request_id, name } = event.payload;
    const store = useCanvasStore.getState();
    const activeId = store.activeContextId;

    if (activeId !== null) {
      const tabState = store.getContextState(activeId) as RequestTabState;
      // If the active tab was just saved (it's the only one that could be ephemeral and just saved)
      if (tabState.source?.type !== 'collection') {
        store.updateContextState(activeId, {
          source: {
            type: 'collection',
            collectionId: collection_id,
            requestId: request_id,
          },
          isDirty: false,
          isSaved: true,
        });
        store.updateTabName(activeId, name);
      }
    }
  });
}
