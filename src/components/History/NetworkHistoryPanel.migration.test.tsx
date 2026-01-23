/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file NetworkHistoryPanel migration tests
 * @description RED phase: Tests for NetworkHistoryPanel migrated to use VirtualDataGrid
 *
 * These tests verify that the migrated component maintains all existing functionality
 * while using TanStack Table + VirtualDataGrid instead of custom virtualization.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NetworkHistoryPanel } from './NetworkHistoryPanel';
import type { NetworkHistoryEntry } from '@/types/history';
import { useHistoryStore } from '@/stores/useHistoryStore';

// Use vi.hoisted to define mocks that can be referenced in vi.mock calls
const { mockSave, mockWriteTextFile } = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockWriteTextFile: vi.fn(),
}));

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: mockSave,
}));

// Mock Tauri fs plugin
vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: mockWriteTextFile,
}));

describe('NetworkHistoryPanel (Migrated to VirtualDataGrid)', () => {
  beforeEach(() => {
    useHistoryStore.setState({
      entries: [],
      isLoading: false,
      error: null,
      filters: {
        search: '',
        method: 'ALL',
        status: 'All',
        intelligence: 'All',
      },
      selectedId: null,
      selectedIds: new Set<string>(),
      expandedId: null,
      compareMode: false,
      compareSelection: [],
    });

    mockSave.mockReset();
    mockWriteTextFile.mockReset();
  });

  const mockEntries: NetworkHistoryEntry[] = [
    {
      id: 'hist_1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      request: {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: {},
        body: null,
        timeout_ms: 30000,
      },
      response: {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: '[]',
        timing: { total_ms: 150, dns_ms: 10, connect_ms: 20, tls_ms: 30, first_byte_ms: 100 },
      },
      intelligence: {
        boundToSpec: true,
        specOperation: 'getUsers',
        drift: null,
        aiGenerated: false,
        verified: true,
      },
    },
    {
      id: 'hist_2',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      request: {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: {},
        body: '{"name": "Test"}',
        timeout_ms: 30000,
      },
      response: {
        status: 201,
        status_text: 'Created',
        headers: {},
        body: '{"id": 1}',
        timing: {
          total_ms: 200,
          dns_ms: null,
          connect_ms: null,
          tls_ms: null,
          first_byte_ms: null,
        },
      },
      intelligence: {
        boundToSpec: true,
        specOperation: 'createUser',
        drift: { type: 'response', fields: ['email'], message: 'Missing email field' },
        aiGenerated: true,
        verified: false,
      },
    },
  ];

  const defaultProps = {
    entries: mockEntries,
    onReplay: vi.fn(),
    onCopyCurl: vi.fn(),
  };

  it('renders VirtualDataGrid with network columns', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    // After migration, should render VirtualDataGrid
    expect(screen.getByTestId('virtual-datagrid')).toBeInTheDocument();
  });

  it('renders all history entries in the grid', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    // Should render both entries
    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('201')).toBeInTheDocument();
  });

  it('renders column headers from createNetworkColumns', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    // Headers should be rendered by VirtualDataGrid
    expect(screen.getByText('Method')).toBeInTheDocument();
    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByText('When')).toBeInTheDocument();
  });

  it('supports row selection via TanStack Table', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    // Find selection checkbox in first row
    const checkboxes = screen.getAllByRole('checkbox');
    const rowCheckbox = checkboxes.find((cb) =>
      cb.getAttribute('aria-label')?.includes('Select row')
    );
    expect(rowCheckbox).toBeInTheDocument();

    // Click to select
    if (rowCheckbox) {
      fireEvent.click(rowCheckbox);
      expect(rowCheckbox).toBeChecked();
    }
  });

  it('supports row expansion via TanStack Table', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    // Find expander button
    const expandButtons = screen.getAllByTestId('expand-button');
    expect(expandButtons.length).toBeGreaterThan(0);

    // Click to expand
    fireEvent.click(expandButtons[0]!);
    // Expanded content should appear
    expect(screen.getByTestId('expanded-section')).toBeInTheDocument();
  });

  it('calls onReplay when replay button is clicked', () => {
    const onReplay = vi.fn();
    render(<NetworkHistoryPanel {...defaultProps} onReplay={onReplay} />);

    const replayButtons = screen.getAllByTestId('replay-button');
    fireEvent.click(replayButtons[0]!);

    expect(onReplay).toHaveBeenCalledWith(mockEntries[0]);
  });

  it('calls onCopyCurl when copy button is clicked', () => {
    const onCopyCurl = vi.fn();
    render(<NetworkHistoryPanel {...defaultProps} onCopyCurl={onCopyCurl} />);

    const copyButtons = screen.getAllByTestId('copy-curl-button');
    fireEvent.click(copyButtons[0]!);

    expect(onCopyCurl).toHaveBeenCalledWith(mockEntries[0]);
  });

  it('maintains filter bar functionality', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('Filter by URL...')).toBeInTheDocument();
    expect(screen.getByTestId('method-filter')).toBeInTheDocument();
  });

  it('maintains status bar with correct counts', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    expect(screen.getByText('2 requests')).toBeInTheDocument();
    expect(screen.getByText('1 with drift')).toBeInTheDocument();
    expect(screen.getByText('1 AI-generated')).toBeInTheDocument();
    expect(screen.getByText('2 spec-bound')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<NetworkHistoryPanel {...defaultProps} entries={[]} />);
    expect(screen.getByText('No requests yet')).toBeInTheDocument();
  });
});
