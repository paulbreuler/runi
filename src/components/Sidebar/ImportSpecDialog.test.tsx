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

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
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

  it('opens with local file mode active by default', () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByTestId('import-mode-file')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('import-mode-url')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('import-spec-file-input')).toBeInTheDocument();
    expect(screen.queryByTestId('import-spec-url-input')).not.toBeInTheDocument();
  });

  it('renders dialog when open', () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByTestId('import-spec-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('import-spec-file-input')).toBeInTheDocument();
    expect(screen.getByTestId('import-spec-submit')).toBeInTheDocument();
    expect(screen.getByTestId('import-spec-cancel')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ImportSpecDialog open={false} onOpenChange={onOpenChange} />);

    expect(screen.queryByTestId('import-spec-dialog')).not.toBeInTheDocument();
  });

  it('disables import button when no file is selected', () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByTestId('import-spec-submit')).toBeDisabled();
  });

  it('enables import button when URL is entered', async () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
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

    // Mock the importCollection to resolve successfully with ImportCollectionResult
    const importCollectionMock = vi.fn().mockResolvedValue({
      status: 'success',
      collection: mockCollection,
    });
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
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

    await userEvent.click(screen.getByTestId('import-mode-url'));
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
      status: 'success',
      collection: {
        id: 'col-new',
        metadata: { name: 'Test', tags: [], created_at: '', modified_at: '' },
        source: { source_type: 'openapi', fetched_at: '' },
        variables: {},
        requests: [],
      },
    });
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
    const input = screen.getByTestId('import-spec-url-input');
    await userEvent.type(input, 'https://example.com/spec.json{Enter}');

    await waitFor(() => {
      expect(importCollectionMock).toHaveBeenCalled();
    });
  });

  it('resets state when dialog reopens', async () => {
    const { rerender } = render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    // Switch to URL mode and type a URL
    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );

    // Close and reopen
    rerender(<ImportSpecDialog open={false} onOpenChange={onOpenChange} />);
    rerender(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    // Should reset to file mode (default)
    expect(screen.getByTestId('import-mode-file')).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByTestId('import-spec-url-input')).not.toBeInTheDocument();
  });

  it('has proper label for file input', () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    const input = screen.getByTestId('import-spec-file-input');
    expect(input).toHaveAttribute('id', 'import-spec-file');

    const label = screen.getByTestId('import-spec-file-label');
    expect(label).toHaveAttribute('for', 'import-spec-file');
  });

  it('has proper label for URL input when URL mode is active', async () => {
    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));

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

    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );

    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('import-spec-submit')).toBeDisabled();
    });
  });

  it('shows conflict state when import returns conflict', async () => {
    const conflictResult = {
      status: 'conflict' as const,
      existing_id: 'col_existing',
      existing_name: 'My API',
    };
    const importCollectionMock = vi.fn().mockResolvedValue(conflictResult);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );
    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('import-conflict-message')).toBeInTheDocument();
      expect(screen.getByTestId('import-conflict-replace')).toBeInTheDocument();
      expect(screen.getByTestId('import-conflict-cancel')).toBeInTheDocument();
    });

    // Dialog should still be open
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('calls refreshCollectionSpec and closes when replace is clicked', async () => {
    const conflictResult = {
      status: 'conflict' as const,
      existing_id: 'col_existing',
      existing_name: 'My API',
    };
    const importCollectionMock = vi.fn().mockResolvedValue(conflictResult);
    const refreshMock = vi.fn().mockResolvedValue(true);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
      refreshCollectionSpec: refreshMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );
    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('import-conflict-replace')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('import-conflict-replace'));

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledWith('col_existing', 'https://example.com/spec.json');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('preserves conflict UI when refreshCollectionSpec fails so user can retry', async () => {
    const conflictResult = {
      status: 'conflict' as const,
      existing_id: 'col_existing',
      existing_name: 'My API',
    };
    const importCollectionMock = vi.fn().mockResolvedValue(conflictResult);
    const refreshMock = vi.fn().mockResolvedValue(false);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
      refreshCollectionSpec: refreshMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );
    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('import-conflict-replace')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('import-conflict-replace'));

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledWith('col_existing', 'https://example.com/spec.json');
    });

    // Dialog should NOT have been closed
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    // Conflict UI should still be visible so user can retry
    expect(screen.getByTestId('import-conflict-replace')).toBeInTheDocument();
  });

  it('returns to import form when conflict cancel is clicked', async () => {
    const conflictResult = {
      status: 'conflict' as const,
      existing_id: 'col_existing',
      existing_name: 'My API',
    };
    const importCollectionMock = vi.fn().mockResolvedValue(conflictResult);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );
    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('import-conflict-cancel')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('import-conflict-cancel'));

    await waitFor(() => {
      // Should return to the import form
      expect(screen.getByTestId('import-spec-url-input')).toBeInTheDocument();
      expect(screen.queryByTestId('import-conflict-message')).not.toBeInTheDocument();
    });
  });

  it('shows version context line with both versions when available', async () => {
    const conflictResult = {
      status: 'conflict' as const,
      existing_id: 'col_existing',
      existing_name: 'My API',
      existing_version: '1.0.0',
    };
    const importCollectionMock = vi.fn().mockResolvedValue(conflictResult);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );
    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      const versionContext = screen.getByTestId('import-conflict-version-context');
      expect(versionContext).toBeInTheDocument();
      expect(versionContext).toHaveTextContent('Currently 1.0.0');
    });
  });

  it('shows (unknown) for missing existing version', async () => {
    const conflictResult = {
      status: 'conflict' as const,
      existing_id: 'col_existing',
      existing_name: 'My API',
      existing_version: null,
    };
    const importCollectionMock = vi.fn().mockResolvedValue(conflictResult);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );
    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      const versionContext = screen.getByTestId('import-conflict-version-context');
      expect(versionContext).toBeInTheDocument();
      expect(versionContext).toHaveTextContent('Currently (unknown)');
    });
  });

  it('shows "Pin as new version" button in conflict state', async () => {
    const conflictResult = {
      status: 'conflict' as const,
      existing_id: 'col_existing',
      existing_name: 'My API',
      existing_version: '1.0.0',
    };
    const importCollectionMock = vi.fn().mockResolvedValue(conflictResult);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );
    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('import-conflict-pin-version')).toBeInTheDocument();
    });
  });

  it('"Pin as new version" button calls cmd_pin_spec_version and closes dialog', async () => {
    const { invoke: mockInvoke } = await import('@tauri-apps/api/core');
    const invokeMock = vi.mocked(mockInvoke);

    const mockPinnedVersion = {
      id: 'pv_1',
      label: '2.0.0',
      spec_content: '{}',
      source: {
        source_type: 'openapi',
        url: 'https://example.com/spec.json',
        hash: null,
        spec_version: '2.0.0',
        fetched_at: '2026-01-01T00:00:00Z',
        source_commit: null,
      },
      imported_at: '2026-01-01T00:00:00Z',
      role: 'staging',
    };
    invokeMock.mockResolvedValueOnce(mockPinnedVersion);

    const conflictResult = {
      status: 'conflict' as const,
      existing_id: 'col_existing',
      existing_name: 'My API',
      existing_version: '1.0.0',
    };
    const importCollectionMock = vi.fn().mockResolvedValue(conflictResult);
    useCollectionStore.setState({
      importCollection: importCollectionMock,
    });

    render(<ImportSpecDialog open={true} onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByTestId('import-mode-url'));
    await userEvent.type(
      screen.getByTestId('import-spec-url-input'),
      'https://example.com/spec.json'
    );
    await userEvent.click(screen.getByTestId('import-spec-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('import-conflict-pin-version')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('import-conflict-pin-version'));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith('cmd_pin_spec_version', {
        collectionId: 'col_existing',
        source: 'https://example.com/spec.json',
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
