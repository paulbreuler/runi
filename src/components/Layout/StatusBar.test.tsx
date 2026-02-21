// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from './StatusBar';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { Collection } from '@/types/collection';

// Mock motion to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (): string => 'div' }),
  useReducedMotion: (): boolean => false,
}));

vi.mock('motion-plus/react', () => ({
  AnimateNumber: ({ children }: { children: React.ReactNode }): React.JSX.Element => (
    <span>{children}</span>
  ),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn(
    (
      selector: (state: {
        metricsVisible: boolean;
        setMetricsVisible: (v: boolean) => void;
      }) => unknown
    ) => selector({ metricsVisible: false, setMetricsVisible: vi.fn() })
  ),
}));

vi.mock('@/stores/useMetricsStore', () => ({
  useMetricsStore: vi.fn(
    (
      selector?: (state: {
        metrics: Record<string, unknown>;
        timestamp: number;
        isLive: boolean;
      }) => unknown
    ) => {
      const state = { metrics: {}, timestamp: 0, isLive: false, setMetrics: vi.fn() };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    }
  ),
}));

vi.mock('@/components/Console/AppMetricsContainer', () => ({
  AppMetricsContainer: (): React.JSX.Element => <div data-test-id="app-metrics-container" />,
}));

vi.mock('@/components/Metrics/MetricsGrid', () => ({
  MetricsGrid: (): React.JSX.Element => <div data-test-id="metrics-grid" />,
}));

const buildCollection = (id: string): Collection => ({
  $schema: 'https://runi.dev/schema/collection/v1.json',
  version: 1,
  id,
  metadata: {
    name: `Collection ${id}`,
    tags: [],
    created_at: '2026-01-01T00:00:00Z',
    modified_at: '2026-01-01T00:00:00Z',
  },
  source: {
    source_type: 'openapi',
    fetched_at: '2026-01-01T00:00:00Z',
  },
  variables: {},
  environments: [],
  requests: [],
});

/** Set up useCanvasStore so the active context has the given collectionId as source. */
const setActiveCollection = (collectionId: string): void => {
  const contextId = 'ctx-test';
  useCanvasStore.setState((state) => {
    const contexts = new Map(state.contexts);
    contexts.set(contextId, {
      id: contextId,
      label: 'Test',
      panels: {},
      layouts: [],
    });
    return { contexts, activeContextId: contextId };
  });
  // Patch getContextState to return source for our test context
  useCanvasStore.setState((state) => ({
    ...state,
    getContextState: (id: string): Record<string, unknown> => {
      if (id === contextId) {
        return { source: { type: 'collection' as const, collectionId, requestId: 'req-1' } };
      }
      return state.getContextState(id);
    },
  }));
};

describe('StatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCollectionStore.setState({
      collections: [],
      summaries: [],
      selectedCollectionId: null,
      selectedRequestId: null,
      expandedCollectionIds: new Set(),
      driftResults: {},
      isLoading: false,
      error: null,
    });
    useCanvasStore.setState((state) => ({
      ...state,
      activeContextId: null,
      contexts: new Map(),
    }));
  });

  it('renders the status bar', () => {
    render(<StatusBar />);
    expect(screen.getByTestId('status-bar')).toBeDefined();
  });

  it('shows static "No environment" label when no active collection', () => {
    render(<StatusBar />);
    expect(screen.getByTestId('status-bar-no-env')).toBeDefined();
  });

  it('shows environment switcher when active collection exists', () => {
    const collection = {
      ...buildCollection('col-1'),
      environments: [{ name: 'local', variables: { baseUrl: 'http://localhost:3000' } }],
      active_environment: 'local',
    };
    useCollectionStore.setState({ collections: [collection] });
    setActiveCollection('col-1');

    render(<StatusBar />);
    expect(screen.getByTestId('environment-switcher')).toBeDefined();
  });

  it('shows all environments as options in the switcher', () => {
    const collection = {
      ...buildCollection('col-1'),
      environments: [
        { name: 'local', variables: { baseUrl: 'http://localhost:3000' } },
        { name: 'staging', variables: { baseUrl: 'https://staging.example.com' } },
      ],
      active_environment: 'local',
    };
    useCollectionStore.setState({ collections: [collection] });
    setActiveCollection('col-1');

    render(<StatusBar />);
    expect(screen.getByTestId('environment-switcher')).toBeDefined();
  });
});
