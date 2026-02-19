/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImportSpecDialog } from './ImportSpecDialog';
import { useCollectionStore } from '@/stores/useCollectionStore';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('ImportSpecDialog', () => {
  const onOpenChange = vi.fn();

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

  it('renders dialog when open', () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByTestId('import-spec-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('import-spec-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('import-spec-submit')).toBeInTheDocument();
    expect(screen.getByTestId('import-spec-cancel')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ImportSpecDialog open={false} onOpenChange={onOpenChange} />);

    expect(screen.queryByTestId('import-spec-dialog')).not.toBeInTheDocument();
  });

  it('disables import button when URL is empty', () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByTestId('import-spec-submit')).toBeDisabled();
  });

  it('enables import button when URL is entered', async () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://petstore3.swagger.io/api/v3/openapi.json'
    );

    expect(screen.getByTestId('import-spec-submit')).not.toBeDisabled();
  });

  it('calls importCollection on submit and closes on success', async () => {
    const mockCollection = {
      $schema: 'https://runi.dev/schema/collection/v1.json',
      version: 1,
      id: 'col-new',
      metadata: {
        name: 'Petstore',
        description: '',
        tags: [],
        created_at: '2026-01-01T00:00:00Z',
        modified_at: '2026-01-01T00:00:00Z',
      },
      source: {
        source_type: 'openapi' as const,
        url: 'https://petstore3.swagger.io/api/v3/openapi.json',
        hash: null,
        spec_version: null,
        fetched_at: '2026-01-01T00:00:00Z',
        source_commit: null,
      },
      auth: undefined,
      variables: {},
      requests: [],
    };

    // Mock the importCollection to resolve successfully
    const importCollectionMock = vi.fn().mockResolvedValue(mockCollection);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://petstore3.swagger.io/api/v3/openapi.json'
    );

    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(importCollectionMock).toHaveBeenCalledWith({
        url: 'https://petstore3.swagger.io/api/v3/openapi.json',
        filePath: null,
        inlineContent: null,
        displayName: null,
        repoRoot: null,
        specPath: null,
        refName: null,
      });
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows error and keeps dialog open on failure', async () => {
    const importCollectionMock = vi.fn().mockResolvedValue(null);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
      error: 'Failed to fetch spec',
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://invalid-url.example.com/spec.json'
    );

    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(importCollectionMock).toHaveBeenCalled();
    });

    // Dialog should still be open (onOpenChange(false) should NOT be called)
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('calls onOpenChange(false) when cancel is clicked', async () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-spec-cancel'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits on Enter key press', async () => {
    const importCollectionMock = vi.fn().mockResolvedValue({
      id: 'col-new',
      metadata: { name: 'Test', tags: [], created_at: '', modified_at: '' },
      source: { source_type: 'openapi', fetched_at: '' },
      variables: {},
      requests: [],
    });
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    const input = screen.getByTestId('import-spec-url-input');
    await userEvent.type(input, 'https://example.com/spec.json{Enter}');

    await waitFor(() => {
      expect(importCollectionMock).toHaveBeenCalled();
    });
  });

  it('resets URL when dialog reopens', async () => {
    const { rerender } = render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );

    // Close and reopen
    rerender(<ImportSpecDialog open={false} onOpenChange={onOpenChange} />);
    rerender(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByTestId('import-spec-url-input')).toHaveValue('');
  });

  it('has proper label for URL input', () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    const input = screen.getByTestId('import-spec-url-input');
    expect(input).toHaveAttribute('id', 'import-spec-url');

    const label = screen.getByTestId('import-spec-url-label');
    expect(label).toHaveAttribute('for', 'import-spec-url');
  });

  it('shows loading state while importing', async () => {
    // Make importCollection hang (never resolve)
    const importCollectionMock = vi.fn().mockReturnValue(new Promise(() => {}));
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );

    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('import-spec-submit')).toBeDisabled();
    });
  });
});
