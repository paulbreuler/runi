/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveToCollectionDialog } from './SaveToCollectionDialog';
import { useCollectionStore } from '@/stores/useCollectionStore';
import type { CollectionSummary } from '@/types/collection';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mockSummaries: CollectionSummary[] = [
  {
    id: 'col-1',
    name: 'My Collection',
    request_count: 3,
    source_type: 'manual',
    modified_at: '2026-01-01T00:00:00Z',
    pinned_version_count: 0,
  },
  {
    id: 'col-2',
    name: 'API Tests',
    request_count: 5,
    source_type: 'openapi',
    modified_at: '2026-01-02T00:00:00Z',
    pinned_version_count: 0,
  },
];

/** Helper to select a collection using fireEvent (avoids pointer-events issue with Select overlay in Dialog) */
const selectFirstCollection = async (): Promise<void> => {
  const trigger = screen.getByTestId('collection-picker');
  fireEvent.click(trigger);
  const option = await screen.findByTestId('collection-option-col-1');
  fireEvent.click(option);
};

describe('SaveToCollectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCollectionStore.setState({
      collections: [],
      summaries: mockSummaries,
      selectedCollectionId: null,
      selectedRequestId: null,
      expandedCollectionIds: new Set(),
      isLoading: false,
      error: null,
    });
  });

  it('renders dialog when open', () => {
    render(<SaveToCollectionDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByTestId('save-to-collection-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('collection-picker')).toBeInTheDocument();
    expect(screen.getByTestId('request-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SaveToCollectionDialog open={false} onOpenChange={vi.fn()} onSave={vi.fn()} />);

    expect(screen.queryByTestId('save-to-collection-dialog')).not.toBeInTheDocument();
  });

  it('pre-fills request name with defaultName', () => {
    render(
      <SaveToCollectionDialog
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        defaultName="GET /users"
      />
    );

    const input = screen.getByTestId('request-name-input');
    expect(input).toHaveAttribute('value', 'GET /users');
  });

  it('shows collection summaries in the picker', async () => {
    render(<SaveToCollectionDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />);

    const trigger = screen.getByTestId('collection-picker');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('collection-option-col-1')).toBeInTheDocument();
      expect(screen.getByTestId('collection-option-col-2')).toBeInTheDocument();
    });
  });

  it('disables save button when no collection selected', () => {
    render(
      <SaveToCollectionDialog
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        defaultName="Test Request"
      />
    );

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();
  });

  it('disables save button when name is empty', async () => {
    render(<SaveToCollectionDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />);

    await selectFirstCollection();

    await waitFor(() => {
      const saveButton = screen.getByTestId('save-button');
      expect(saveButton).toBeDisabled();
    });
  });

  it('enables save button when collection selected and name entered', async () => {
    render(
      <SaveToCollectionDialog
        open={true}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
        defaultName="My Request"
      />
    );

    await selectFirstCollection();

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).not.toBeDisabled();
    });
  });

  it('calls onSave with correct args when save clicked', async () => {
    const onSave = vi.fn();
    render(
      <SaveToCollectionDialog
        open={true}
        onOpenChange={vi.fn()}
        onSave={onSave}
        defaultName="My Request"
      />
    );

    await selectFirstCollection();

    await waitFor(() => {
      expect(screen.getByTestId('save-button')).not.toBeDisabled();
    });

    await userEvent.click(screen.getByTestId('save-button'));

    expect(onSave).toHaveBeenCalledWith('col-1', 'My Request');
  });

  it('calls onOpenChange(false) when cancel clicked', async () => {
    const onOpenChange = vi.fn();
    render(<SaveToCollectionDialog open={true} onOpenChange={onOpenChange} onSave={vi.fn()} />);

    await userEvent.click(screen.getByTestId('cancel-button'));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows empty state when no collections exist', () => {
    useCollectionStore.setState({ summaries: [] });

    render(<SaveToCollectionDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />);

    expect(screen.getByTestId('no-collections-message')).toBeInTheDocument();
  });

  it('has proper labels for accessibility', () => {
    render(<SaveToCollectionDialog open={true} onOpenChange={vi.fn()} onSave={vi.fn()} />);

    const nameInput = screen.getByTestId('request-name-input');
    expect(nameInput).toHaveAttribute('id', 'request-name-input');

    const label = screen.getByText('Request Name');
    expect(label).toHaveAttribute('for', 'request-name-input');
  });
});
