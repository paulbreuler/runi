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
  error: string | null;

  // Actions
  setMethod: (method: string) => void;
  setUrl: (url: string) => void;
  setHeaders: (headers: Record<string, string>) => void;
  setBody: (body: string) => void;
  setResponse: (response: HttpResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  method: 'GET',
  url: 'https://httpbin.org/get',
  headers: {},
  body: '',
  response: null,
  isLoading: false,
  error: null,

  setMethod: (method) => { set({ method }); },
  setUrl: (url) => { set({ url }); },
  setHeaders: (headers) => { set({ headers }); },
  setBody: (body) => { set({ body }); },
  setResponse: (response) => { set({ response }); },
  setLoading: (isLoading) => { set({ isLoading }); },
  setError: (error) => { set({ error }); },
  reset: () =>
    { set({
      method: 'GET',
      url: 'https://httpbin.org/get',
      headers: {},
      body: '',
      response: null,
      isLoading: false,
      error: null,
    }); },
}));
