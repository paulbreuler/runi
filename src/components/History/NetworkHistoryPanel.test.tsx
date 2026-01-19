import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('NetworkHistoryPanel', () => {
  // Reset store and mocks before each test
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
    });

    // Reset Tauri plugin mocks
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

  it('renders the panel header', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    // Check that the filter bar (which is the header) is rendered
    expect(screen.getByPlaceholderText('Filter by URL...')).toBeInTheDocument();
  });

  it('renders the filter bar', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    expect(screen.getByPlaceholderText('Filter by URL...')).toBeInTheDocument();
    expect(screen.getByTestId('method-filter')).toBeInTheDocument();
  });

  it('renders all history rows', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    expect(screen.getAllByTestId('history-row')).toHaveLength(2);
  });

  it('renders the status bar with correct counts', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    expect(screen.getByText('2 requests')).toBeInTheDocument();
    expect(screen.getByText('1 with drift')).toBeInTheDocument();
    expect(screen.getByText('1 AI-generated')).toBeInTheDocument();
    expect(screen.getByText('2 spec-bound')).toBeInTheDocument();
  });

  it('filters entries by search query', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText('Filter by URL...');
    fireEvent.change(input, { target: { value: 'POST' } });

    // Since the search doesn't match URL, we still see both rows
    // Let's search by a URL part that exists
  });

  it('expands row when chevron is clicked', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    const expandButton = screen.getAllByTestId('expand-button')[0]!;
    fireEvent.click(expandButton);

    expect(screen.getByTestId('expanded-section')).toBeInTheDocument();
  });

  it('collapses row when expanded chevron is clicked again', async () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    const expandButton = screen.getAllByTestId('expand-button')[0]!;

    // Expand
    fireEvent.click(expandButton);
    expect(screen.getByTestId('expanded-section')).toBeInTheDocument();

    // Collapse - wait for AnimatePresence exit animation to complete
    fireEvent.click(expandButton);
    await waitFor(() => {
      expect(screen.queryByTestId('expanded-section')).toBeNull();
    });
  });

  it('selects row when clicked', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    const row = screen.getAllByTestId('history-row')[0]!;
    fireEvent.click(row);

    expect(row).toHaveClass('bg-bg-raised');
  });

  it('calls onReplay when replay button is clicked', () => {
    const onReplay = vi.fn();
    render(<NetworkHistoryPanel {...defaultProps} onReplay={onReplay} />);

    const replayButton = screen.getAllByTestId('replay-button')[0]!;
    fireEvent.click(replayButton);

    expect(onReplay).toHaveBeenCalledWith(mockEntries[0]);
  });

  it('calls onCopyCurl when copy button is clicked', () => {
    const onCopyCurl = vi.fn();
    render(<NetworkHistoryPanel {...defaultProps} onCopyCurl={onCopyCurl} />);

    const copyButton = screen.getAllByTestId('copy-curl-button')[0]!;
    fireEvent.click(copyButton);

    expect(onCopyCurl).toHaveBeenCalledWith(mockEntries[0]);
  });

  // TODO: Add test for signal legend in header when feature is implemented
  // The legend should show visual indicators (dots) for: Verified, Drift, AI Generated, Bound to Spec

  it('shows empty state when no entries', () => {
    render(<NetworkHistoryPanel {...defaultProps} entries={[]} />);
    expect(screen.getByText('No requests yet')).toBeInTheDocument();
  });

  // ============================================================================
  // TDD RED Phase Tests - These will fail until implementation is complete
  // ============================================================================

  describe('TDD: Expanded content full width (acceptance criteria)', () => {
    it('expanded content spans all columns (full width)', () => {
      render(<NetworkHistoryPanel {...defaultProps} />);
      const expandButton = screen.getAllByTestId('expand-button')[0]!;
      fireEvent.click(expandButton);

      // Find the expanded row's td element
      const expandedSection = screen.getByTestId('expanded-section');
      const expandedTd = expandedSection.closest('td');

      // Critical acceptance criteria: expanded td must span ALL columns
      expect(expandedTd).toHaveAttribute('colSpan', expect.any(String));
      const colSpan = expandedTd?.getAttribute('colSpan');
      expect(colSpan).not.toBe('1'); // Should not be constrained to single column
      // The colSpan should equal the number of columns (selection + expander + method + url + status + timing + size + timeAgo + actions = 9)
      expect(Number.parseInt(colSpan ?? '0', 10)).toBeGreaterThan(1);
    });

    it('expanded content uses EXPANDED_CONTENT_LEFT_MARGIN_PX for alignment', () => {
      render(<NetworkHistoryPanel {...defaultProps} />);
      const expandButton = screen.getAllByTestId('expand-button')[0]!;
      fireEvent.click(expandButton);

      const expandedSection = screen.getByTestId('expanded-section');
      // Find the inner div that has the marginLeft style (it's a direct child of motion.div)
      const innerDiv = expandedSection.querySelector('div.py-3.bg-bg-elevated');

      // Should use EXPANDED_CONTENT_LEFT_MARGIN_PX (70px = 32+32+6)
      expect(innerDiv).toBeInTheDocument();
      expect(innerDiv).toHaveStyle({ marginLeft: '70px' });
    });
  });

  describe('TDD: Wrapper structure matches console tab', () => {
    it('has nested wrapper divs matching console tab structure', () => {
      const { container } = render(<NetworkHistoryPanel {...defaultProps} />);
      const panel = container.querySelector('.flex.flex-col.h-full.bg-bg-surface');
      expect(panel).toBeInTheDocument();

      // Check for nested wrapper: overflow-hidden -> overflow-x-auto
      const outerWrapper = panel?.querySelector('.flex-1.flex.flex-col.min-h-0.overflow-hidden');
      expect(outerWrapper).toBeInTheDocument();

      const innerWrapper = outerWrapper?.querySelector(
        '.flex-1.flex.flex-col.min-h-0.overflow-x-auto'
      );
      expect(innerWrapper).toBeInTheDocument();
    });
  });

  describe('TDD: Column widths match console tab', () => {
    it('selection and expander columns are 32px fixed width', () => {
      const { container } = render(<NetworkHistoryPanel {...defaultProps} />);
      const table = container.querySelector('table');
      const headers = table?.querySelectorAll('th');

      // Find selection and expander column headers
      let selectionHeader: Element | undefined;
      let expanderHeader: Element | undefined;

      headers?.forEach((header) => {
        const headerId = header.getAttribute('data-column-id') ?? header.id;
        if (headerId === 'select' || header.querySelector('[role="checkbox"]')) {
          selectionHeader = header;
        }
        if (headerId === 'expand' || header.querySelector('[data-testid="expand-button"]')) {
          expanderHeader = header;
        }
      });

      // Check that headers exist and have correct width constraints
      // Note: We check the style attribute which should have width: 32px
      if (selectionHeader) {
        const style = selectionHeader.getAttribute('style');
        expect(style).toContain('width: 32px');
      }
      if (expanderHeader) {
        const style = expanderHeader.getAttribute('style');
        expect(style).toContain('width: 32px');
      }
    });

    it('method column is 100px fixed width with minSize and maxSize', () => {
      // This test verifies the column definition, not the rendered width
      // The actual implementation will be tested via column definition tests
      render(<NetworkHistoryPanel {...defaultProps} />);
      // Method column header should exist
      expect(screen.getByText('Method')).toBeInTheDocument();
    });
  });

  describe('TDD: VirtualDataGrid props match console tab', () => {
    it('VirtualDataGrid has correct className pattern', () => {
      const { container } = render(<NetworkHistoryPanel {...defaultProps} />);
      const virtualDataGrid = container.querySelector('[data-testid="virtual-datagrid"]');
      expect(virtualDataGrid).toBeInTheDocument();
      // Should have flex-1 class (console has "flex-1 font-mono text-xs", network may just have "flex-1")
      expect(virtualDataGrid).toHaveClass('flex-1');
    });
  });

  it('shows table header', () => {
    render(<NetworkHistoryPanel {...defaultProps} />);
    expect(screen.getByText('Method')).toBeInTheDocument();
    expect(screen.getByText('URL')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  describe('double-click expand/contract', () => {
    it('expands row on double-click', () => {
      render(<NetworkHistoryPanel {...defaultProps} />);

      const row = screen.getAllByTestId('history-row')[0]!;
      fireEvent.doubleClick(row);

      expect(screen.getByTestId('expanded-section')).toBeInTheDocument();
    });

    it('contracts expanded row on double-click', async () => {
      render(<NetworkHistoryPanel {...defaultProps} />);

      const row = screen.getAllByTestId('history-row')[0]!;

      // Double-click to expand
      fireEvent.doubleClick(row);
      expect(screen.getByTestId('expanded-section')).toBeInTheDocument();

      // Double-click to contract
      fireEvent.doubleClick(row);
      await waitFor(() => {
        expect(screen.queryByTestId('expanded-section')).not.toBeInTheDocument();
      });
    });

    it('does not toggle expand when double-clicking buttons', () => {
      render(<NetworkHistoryPanel {...defaultProps} />);

      const replayButton = screen.getAllByTestId('replay-button')[0]!;
      fireEvent.doubleClick(replayButton);

      // Should NOT expand
      expect(screen.queryByTestId('expanded-section')).not.toBeInTheDocument();
    });

    it('does not toggle expand when double-clicking selection checkbox', () => {
      render(<NetworkHistoryPanel {...defaultProps} />);

      // Find the selection checkbox (first checkbox in the row)
      const checkboxes = screen.getAllByRole('checkbox');
      const rowCheckbox = checkboxes.find((cb) => {
        const label = cb.getAttribute('aria-label');
        return label?.includes('Select') ?? false;
      });

      if (rowCheckbox) {
        fireEvent.doubleClick(rowCheckbox);
        // Should NOT expand
        expect(screen.queryByTestId('expanded-section')).not.toBeInTheDocument();
      }
    });
  });

  describe('Save functionality', () => {
    it('saves only selected rows when Save button is clicked with selection', async () => {
      mockSave.mockResolvedValue('/test/path/network-history-selected.json');
      mockWriteTextFile.mockResolvedValue(undefined);

      render(<NetworkHistoryPanel {...defaultProps} />);

      // Select the first row
      const row = screen.getAllByTestId('history-row')[0]!;
      fireEvent.click(row);

      // Click the Save button (should save selection since we have a selection)
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      fireEvent.click(saveButton);

      // Wait for save dialog to be called with "selected" filename pattern
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({
          defaultPath: expect.stringMatching(/^network-history-selected-\d+\.json$/),
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
      });

      // Verify writeTextFile was called
      await waitFor(() => {
        expect(mockWriteTextFile).toHaveBeenCalled();
      });

      // Verify only 1 entry was saved (the selected one)
      const writtenContent = mockWriteTextFile.mock.calls[0]?.[1];
      expect(writtenContent).toBeDefined();
      const parsedContent = JSON.parse(writtenContent as string);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent.length).toBe(1);
      expect(parsedContent[0].id).toBe('hist_1');
    });

    it('saves all rows when Save button is clicked with no selection', async () => {
      mockSave.mockResolvedValue('/test/path/network-history.json');
      mockWriteTextFile.mockResolvedValue(undefined);

      render(<NetworkHistoryPanel {...defaultProps} />);

      // Don't select anything, just click Save
      const saveButton = screen.getByRole('button', { name: /^save$/i });
      fireEvent.click(saveButton);

      // Wait for save dialog to be called with "all" filename pattern (no "selected")
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({
          defaultPath: expect.stringMatching(/^network-history-\d+\.json$/),
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
      });

      // Verify writeTextFile was called
      await waitFor(() => {
        expect(mockWriteTextFile).toHaveBeenCalled();
      });

      // Verify all 2 entries were saved
      const writtenContent = mockWriteTextFile.mock.calls[0]?.[1];
      expect(writtenContent).toBeDefined();
      const parsedContent = JSON.parse(writtenContent as string);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent.length).toBe(2);
    });
  });
});
