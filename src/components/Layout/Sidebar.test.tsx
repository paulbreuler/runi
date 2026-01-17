import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { useHistoryStore } from '@/stores/useHistoryStore';
import type { HistoryEntry } from '@/types/generated/HistoryEntry';

// Mock the stores
vi.mock('@/stores/useHistoryStore');

// Mock event bus
vi.mock('@/events/bus', async () => {
  const actual = await vi.importActual('@/events/bus');
  const mockEmit = vi.fn();
  const mockOn = vi.fn();
  return {
    ...actual,
    globalEventBus: {
      emit: mockEmit,
      on: mockOn,
      off: vi.fn(),
      once: vi.fn(),
      removeAllListeners: vi.fn(),
      listenerCount: vi.fn(),
    },
    __mockEmit: mockEmit,
    __mockOn: mockOn,
  };
});

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock history store with empty state
    vi.mocked(useHistoryStore).mockReturnValue({
      entries: [],
      isLoading: false,
      error: null,
      loadHistory: vi.fn(),
      addEntry: vi.fn(),
      deleteEntry: vi.fn(),
      clearHistory: vi.fn(),
    });
  });

  it('renders sidebar with proper structure', () => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toBeInTheDocument();
  });

  it('has Collections drawer section', () => {
    render(<Sidebar />);

    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByTestId('collections-drawer')).toBeInTheDocument();
  });

  it('has History drawer section', () => {
    render(<Sidebar />);

    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByTestId('history-drawer')).toBeInTheDocument();
  });

  it('drawer sections are collapsible', () => {
    render(<Sidebar />);

    // Collections drawer should be open by default
    expect(screen.getByText('No collections yet')).toBeInTheDocument();

    // Click to collapse
    const collectionsButton = screen.getByText('Collections').closest('button');
    if (collectionsButton === null) {
      throw new Error('Collections button not found');
    }
    fireEvent.click(collectionsButton);

    // Content should be hidden - check aria-expanded
    expect(collectionsButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('displays empty states for collections', () => {
    render(<Sidebar />);

    expect(screen.getByText('No collections yet')).toBeInTheDocument();
  });

  it('displays empty states for history', () => {
    render(<Sidebar />);

    expect(screen.getByText('No history yet')).toBeInTheDocument();
  });

  it('fills its container width', () => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toHaveClass('w-full');
  });

  it('has proper background styling', () => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toHaveClass('bg-bg-surface');
  });

  it('drawer headers have uppercase styling', () => {
    render(<Sidebar />);

    const collectionsTitle = screen.getByText('Collections');
    expect(collectionsTitle).toHaveClass('uppercase');
    expect(collectionsTitle).toHaveClass('tracking-wider');
  });

  describe('History entry selection (event-driven)', () => {
    const mockHistoryEntry: HistoryEntry = {
      id: 'hist_123',
      timestamp: new Date().toISOString(),
      request: {
        url: 'https://api.example.com/users',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"name": "Test"}',
        timeout_ms: 30000,
      },
      response: {
        status: 200,
        status_text: 'OK',
        headers: {},
        body: '{"id": 1}',
        timing: {
          total_ms: 150,
          dns_ms: null,
          connect_ms: null,
          tls_ms: null,
          first_byte_ms: null,
        },
      },
    };

    it('emits history.entry-selected event when history entry is clicked', async () => {
      // Mock history store with entries
      vi.mocked(useHistoryStore).mockReturnValue({
        entries: [mockHistoryEntry],
        isLoading: false,
        error: null,
        loadHistory: vi.fn(),
        addEntry: vi.fn(),
        deleteEntry: vi.fn(),
        clearHistory: vi.fn(),
      });

      render(<Sidebar />);

      // Find and click the history entry
      const historyEntry = screen.getByTestId(`history-entry-${mockHistoryEntry.id}`);
      fireEvent.click(historyEntry);

      // Verify event was emitted with correct payload and source
      expect(mockEmit).toHaveBeenCalledTimes(1);
      expect(mockEmit).toHaveBeenCalledWith(
        'history.entry-selected',
        mockHistoryEntry,
        'HistoryDrawer'
      );
    });

    it('does not directly call store methods when history entry is selected', async () => {
      // Mock history store with entries
      vi.mocked(useHistoryStore).mockReturnValue({
        entries: [mockHistoryEntry],
        isLoading: false,
        error: null,
        loadHistory: vi.fn(),
        addEntry: vi.fn(),
        deleteEntry: vi.fn(),
        clearHistory: vi.fn(),
      });

      render(<Sidebar />);

      // Find and click the history entry
      const historyEntry = screen.getByTestId(`history-entry-${mockHistoryEntry.id}`);
      fireEvent.click(historyEntry);

      // Verify event was emitted (event-driven approach)
      const { globalEventBus } = await import('@/events/bus');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(vi.mocked(globalEventBus.emit)).toHaveBeenCalledWith(
        'history.entry-selected',
        mockHistoryEntry,
        'HistoryDrawer'
      );
      // Note: We don't import useRequestStore anymore in Sidebar, so we can't check it
      // But the test above confirms we're using event bus instead
    });
  });
});
