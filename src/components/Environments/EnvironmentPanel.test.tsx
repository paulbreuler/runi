// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EnvironmentPanel } from './EnvironmentPanel';
import { useCollectionStore } from '@/stores/useCollectionStore';
import type { Collection } from '@/types/collection';

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (): string => 'div' }),
  useReducedMotion: (): boolean => false,
  AnimatePresence: ({ children }: { children: React.ReactNode }): React.JSX.Element => (
    <>{children}</>
  ),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
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
  pinned_versions: [],
});

describe('EnvironmentPanel', () => {
  const onClose = vi.fn();

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
  });

  it('renders the panel with title', () => {
    render(<EnvironmentPanel collectionId="col-1" open={true} onClose={onClose} />);
    expect(screen.getByTestId('environment-panel')).toBeDefined();
    expect(screen.getByTestId('environment-panel-title')).toBeDefined();
  });

  it('shows add environment button', () => {
    render(<EnvironmentPanel collectionId="col-1" open={true} onClose={onClose} />);
    expect(screen.getByTestId('add-environment-button')).toBeDefined();
  });

  it('lists existing environments', () => {
    const collection = {
      ...buildCollection('col-1'),
      environments: [
        { name: 'local', variables: { baseUrl: 'http://localhost:3000' } },
        { name: 'staging', variables: { baseUrl: 'https://staging.example.com' } },
      ],
    };
    useCollectionStore.setState({ collections: [collection] });

    render(<EnvironmentPanel collectionId="col-1" open={true} onClose={onClose} />);

    expect(screen.getByTestId('environment-row-local')).toBeDefined();
    expect(screen.getByTestId('environment-row-staging')).toBeDefined();
  });

  it('shows delete button on each environment row', () => {
    const collection = {
      ...buildCollection('col-1'),
      environments: [{ name: 'local', variables: {} }],
    };
    useCollectionStore.setState({ collections: [collection] });

    render(<EnvironmentPanel collectionId="col-1" open={true} onClose={onClose} />);

    expect(screen.getByTestId('delete-environment-local')).toBeDefined();
  });

  it('calls deleteEnvironment when delete button is clicked', async () => {
    const collection = {
      ...buildCollection('col-1'),
      environments: [{ name: 'local', variables: {} }],
    };
    useCollectionStore.setState({ collections: [collection] });

    const deleteEnvSpy = vi.spyOn(useCollectionStore.getState(), 'deleteEnvironment');

    render(<EnvironmentPanel collectionId="col-1" open={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('delete-environment-local'));

    await waitFor(() => {
      expect(deleteEnvSpy).toHaveBeenCalledWith('col-1', 'local');
    });
  });

  it('shows add name input when add button is clicked', () => {
    render(<EnvironmentPanel collectionId="col-1" open={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('add-environment-button'));
    expect(screen.getByTestId('new-environment-name-input')).toBeDefined();
  });

  it('calls upsertEnvironment when new environment name is confirmed', async () => {
    const upsertSpy = vi.spyOn(useCollectionStore.getState(), 'upsertEnvironment');

    render(<EnvironmentPanel collectionId="col-1" open={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('add-environment-button'));
    const input = screen.getByTestId('new-environment-name-input');
    fireEvent.change(input, { target: { value: 'production' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(upsertSpy).toHaveBeenCalledWith('col-1', 'production', {});
    });
  });

  it('expands environment row on click to show variables', () => {
    const collection = {
      ...buildCollection('col-1'),
      environments: [{ name: 'local', variables: { baseUrl: 'http://localhost:3000' } }],
    };
    useCollectionStore.setState({ collections: [collection] });

    render(<EnvironmentPanel collectionId="col-1" open={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('environment-row-local'));
    expect(screen.getByTestId('environment-variables-local')).toBeDefined();
  });

  it('does not render when open is false', () => {
    render(<EnvironmentPanel collectionId="col-1" open={false} onClose={onClose} />);
    expect(screen.queryByTestId('environment-panel')).toBeNull();
  });
});
