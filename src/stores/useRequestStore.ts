/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { create } from 'zustand';
import type { HttpResponse } from '@/types/http';

interface RequestState {
  // State
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  response: HttpResponse | null;
  isLoading: boolean;

  // Actions
  setMethod: (method: string) => void;
  setUrl: (url: string) => void;
  setHeaders: (headers: Record<string, string> | undefined) => void;
  setBody: (body: string) => void;
  setResponse: (response: HttpResponse | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  method: 'GET',
  url: 'https://httpbin.org/get',
  headers: {},
  body: '',
  response: null,
  isLoading: false,

  setMethod: (method): void => {
    set({ method });
  },
  setUrl: (url): void => {
    set({ url });
  },
  setHeaders: (headers): void => {
    set({ headers: headers ?? {} });
  },
  setBody: (body): void => {
    set({ body });
  },
  setResponse: (response): void => {
    set({ response });
  },
  setLoading: (isLoading): void => {
    set({ isLoading });
  },
  reset: (): void => {
    set({
      method: 'GET',
      url: 'https://httpbin.org/get',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
    });
  },
}));
