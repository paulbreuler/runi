/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { createContext, useContext } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HttpResponse } from '@/types/http';

/**
 * React Context to provide contextId to request-related components.
 * This allows components like RequestBuilder and ResponseViewer to know
 * which request state they should be displaying/editing.
 */
export const RequestContextIdContext = createContext<string | undefined>(undefined);

export interface RequestContextState {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  response: HttpResponse | null;
  isLoading: boolean;
}

export interface RequestStore {
  // Keyed state: Record<contextId, state>
  contexts: Record<string, RequestContextState>;

  // Actions
  setMethod: (contextId: string, method: string) => void;
  setUrl: (contextId: string, url: string) => void;
  setHeaders: (contextId: string, headers: Record<string, string> | undefined) => void;
  setBody: (contextId: string, body: string) => void;
  setResponse: (contextId: string, response: HttpResponse | null) => void;
  setLoading: (contextId: string, loading: boolean) => void;
  reset: (contextId: string) => void;
  initContext: (contextId: string, initialState?: Partial<RequestContextState>) => void;
}

export const DEFAULT_REQUEST_STATE: RequestContextState = {
  method: 'GET',
  url: 'https://httpbin.org/get',
  headers: {},
  body: '',
  response: null,
  isLoading: false,
};

/**
 * The underlying keyed store for all request contexts.
 * Use this directly in non-React code or when you need to access
 * state for a specific contextId.
 */
export const useRequestStoreRaw = create<RequestStore>()(
  persist(
    (set) => ({
      contexts: {},

      initContext: (contextId, initialState): void => {
        set((state) => {
          if (state.contexts[contextId] !== undefined) {
            return state;
          }
          return {
            contexts: {
              ...state.contexts,
              [contextId]: {
                ...DEFAULT_REQUEST_STATE,
                ...initialState,
                // Force string type if somehow passed as undefined
                url: initialState?.url ?? DEFAULT_REQUEST_STATE.url,
              },
            },
          };
        });
      },

      setMethod: (contextId, method): void => {
        set((state) => ({
          contexts: {
            ...state.contexts,
            [contextId]: {
              ...(state.contexts[contextId] ?? DEFAULT_REQUEST_STATE),
              method,
            },
          },
        }));
      },

      setUrl: (contextId, url): void => {
        set((state) => ({
          contexts: {
            ...state.contexts,
            [contextId]: {
              ...(state.contexts[contextId] ?? DEFAULT_REQUEST_STATE),
              url,
            },
          },
        }));
      },

      setHeaders: (contextId, headers): void => {
        set((state) => ({
          contexts: {
            ...state.contexts,
            [contextId]: {
              ...(state.contexts[contextId] ?? DEFAULT_REQUEST_STATE),
              headers: headers ?? {},
            },
          },
        }));
      },

      setBody: (contextId, body): void => {
        set((state) => ({
          contexts: {
            ...state.contexts,
            [contextId]: { ...(state.contexts[contextId] ?? DEFAULT_REQUEST_STATE), body },
          },
        }));
      },

      setResponse: (contextId, response): void => {
        set((state) => ({
          contexts: {
            ...state.contexts,
            [contextId]: { ...(state.contexts[contextId] ?? DEFAULT_REQUEST_STATE), response },
          },
        }));
      },

      setLoading: (contextId, isLoading): void => {
        set((state) => ({
          contexts: {
            ...state.contexts,
            [contextId]: { ...(state.contexts[contextId] ?? DEFAULT_REQUEST_STATE), isLoading },
          },
        }));
      },

      reset: (contextId): void => {
        set((state) => ({
          contexts: {
            ...state.contexts,
            [contextId]: DEFAULT_REQUEST_STATE,
          },
        }));
      },
    }),
    {
      name: 'request-store-keyed',
      partialize: (state) => ({
        // Exclude response from persistence to keep storage clean
        contexts: Object.fromEntries(
          Object.entries(state.contexts).map(([id, ctx]) => [
            id,
            { ...ctx, response: null, isLoading: false },
          ])
        ),
      }),
    }
  )
);

/**
 * Hook to access request state scoped to the current contextId.
 * Reads contextId from RequestContextIdContext or defaults to 'global'.
 *
 * This hook provides a convenient interface for components that only
 * care about "their" request state.
 */
export const useRequestStore = (): RequestContextState & {
  setMethod: (method: string) => void;
  setUrl: (url: string) => void;
  setHeaders: (headers: Record<string, string> | undefined) => void;
  setBody: (body: string) => void;
  setResponse: (response: HttpResponse | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
} => {
  const contextId = useContext(RequestContextIdContext) ?? 'global';
  const state = useRequestStoreRaw((s) => s.contexts[contextId] ?? DEFAULT_REQUEST_STATE);
  const actions = useRequestStoreRaw.getState();

  return {
    ...state,
    setMethod: (method: string): void => {
      actions.setMethod(contextId, method);
    },
    setUrl: (url: string): void => {
      actions.setUrl(contextId, url);
    },
    setHeaders: (headers: Record<string, string> | undefined): void => {
      actions.setHeaders(contextId, headers);
    },
    setBody: (body: string): void => {
      actions.setBody(contextId, body);
    },
    setResponse: (response: HttpResponse | null): void => {
      actions.setResponse(contextId, response);
    },
    setLoading: (isLoading: boolean): void => {
      actions.setLoading(contextId, isLoading);
    },
    reset: (): void => {
      actions.reset(contextId);
    },
  };
};
