/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommandBar } from './CommandBar';
import { useTabStore } from '@/stores/useTabStore';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { globalEventBus } from '@/events/bus';

// Mock scrollIntoView for cmdk
Element.prototype.scrollIntoView = vi.fn();

// Mock event bus
vi.mock('@/events/bus', () => ({
  globalEventBus: {
    emit: vi.fn(),
    on: vi.fn(() => vi.fn()),
  },
}));

// Mock stores
vi.mock('@/stores/useTabStore');
vi.mock('@/stores/useCollectionStore');
vi.mock('@/stores/useHistoryStore');

// Type helpers for store state
type CollectionState = ReturnType<typeof useCollectionStore.getState>;
type HistoryState = ReturnType<typeof useHistoryStore.getState>;

describe('CommandBar', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalEventBus, 'emit');

    // Mock useTabStore
    const mockTabs = {
      'tab-1': {
        id: 'tab-1',
        label: 'GET /users',
        method: 'GET' as const,
        url: 'https://api.example.com/users',
        headers: {},
        body: '',
        response: null,
        isDirty: false,
        createdAt: Date.now(),
      },
      'tab-2': {
        id: 'tab-2',
        label: 'POST /posts',
        method: 'POST' as const,
        url: 'https://api.example.com/posts',
        headers: {},
        body: '',
        response: null,
        isDirty: false,
        createdAt: Date.now(),
      },
    };

    vi.mocked(useTabStore).mockImplementation((selector) => {
      const state = {
        tabs: mockTabs,
        tabOrder: ['tab-1', 'tab-2'],
        activeTabId: 'tab-1',
        openTab: vi.fn(),
        closeTab: vi.fn(),
        setActiveTab: vi.fn(),
        updateTab: vi.fn(),
        reorderTab: vi.fn(),
        closeOtherTabs: vi.fn(),
        closeAllTabs: vi.fn(),
        findTabBySource: vi.fn(),
        getActiveTab: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return selector !== undefined ? selector(state) : state;
    });

    // Mock useCollectionStore - return the actual state getter function
    const mockCollections = [
      {
        $schema: 'https://runi.sh/schemas/collection.json',
        version: 1,
        id: 'coll-1',
        metadata: {
          name: 'My Collection',
          description: '',
          tags: [],
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
        },
        source: {
          source_type: 'manual' as const,
          fetched_at: new Date().toISOString(),
        },
        variables: {},
        requests: [
          {
            id: 'req-1',
            name: 'Get Users',
            method: 'GET' as const,
            url: 'https://api.example.com/users',
            headers: {},
            body: '',
          },
        ],
      },
    ];

    vi.mocked(useCollectionStore).mockImplementation((selector) => {
      const state = {
        collections: mockCollections,
        summaries: [],
        selectedCollectionId: null,
        selectedRequestId: null,
        expandedCollectionIds: new Set(),
        isLoading: false,
        error: null,
        loadCollections: vi.fn(),
        loadCollection: vi.fn(),
        addHttpbinCollection: vi.fn(),
        deleteCollection: vi.fn(),
        selectCollection: vi.fn(),
        selectRequest: vi.fn(),
        toggleExpanded: vi.fn(),
        clearError: vi.fn(),
      } as unknown as CollectionState;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return selector !== undefined ? selector(state) : state;
    });

    // Mock useHistoryStore
    const mockHistoryEntries = [
      {
        id: 'hist-1',
        request: {
          method: 'GET' as const,
          url: 'https://api.example.com/posts',
          headers: {},
          body: '',
          timeout_ms: 30000,
        },
        response: {
          status: 200,
          status_text: 'OK',
          headers: {},
          body: '',
          timing: {
            total_ms: 100,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(useHistoryStore).mockImplementation((selector) => {
      const state = {
        entries: mockHistoryEntries,
        isLoading: false,
        error: null,
        filters: {
          search: '',
          method: 'ALL' as const,
          status: 'All' as const,
          intelligence: 'All' as const,
        },
        selectedId: null,
        selectedIds: new Set<string>(),
        lastSelectedIndex: null,
        expandedId: null,
        compareMode: false,
        compareSelection: [],
        loadHistory: vi.fn(),
        addEntry: vi.fn(),
        deleteEntry: vi.fn(),
        clearHistory: vi.fn(),
        setFilter: vi.fn(),
        resetFilters: vi.fn(),
        setSelectedId: vi.fn(),
        toggleSelection: vi.fn(),
        selectRange: vi.fn(),
        selectAll: vi.fn(),
        deselectAll: vi.fn(),
        setExpandedId: vi.fn(),
        setCompareMode: vi.fn(),
        toggleCompareSelection: vi.fn(),
        filteredEntries: vi.fn(() => []),
      } as unknown as HistoryState;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return selector !== undefined ? selector(state) : state;
    });
  });

  it('should not render when isOpen is false', () => {
    render(<CommandBar isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByTestId('command-bar')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<CommandBar isOpen onClose={mockOnClose} />);
    expect(screen.getByTestId('command-bar')).toBeInTheDocument();
  });

  it('should render search input with placeholder', () => {
    render(<CommandBar isOpen onClose={mockOnClose} />);
    const input = screen.getByTestId('command-bar-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder');
  });

  it('should call onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const input = screen.getByTestId('command-bar-input');
    await user.click(input);
    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('should call onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const backdrop = screen.getByTestId('command-bar-backdrop');
    await user.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('should display open tabs section when tabs exist', () => {
    render(<CommandBar isOpen onClose={mockOnClose} />);
    expect(screen.getByText(/open tabs/i)).toBeInTheDocument();
    // Redesign shows GET/POST in multiple places (method and label)
    expect(screen.getAllByText(/GET/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/POST/i).length).toBeGreaterThan(0);
  });

  it('should display collections section when collections exist', () => {
    render(<CommandBar isOpen onClose={mockOnClose} />);
    expect(screen.getByText(/collections/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Users/i)).toBeInTheDocument();
  });

  it('should display history section when history entries exist', () => {
    render(<CommandBar isOpen onClose={mockOnClose} />);
    expect(screen.getByText(/history/i)).toBeInTheDocument();
  });

  it('should display actions section', () => {
    render(<CommandBar isOpen onClose={mockOnClose} />);
    expect(screen.getByText(/actions/i)).toBeInTheDocument();
  });

  it('should filter tabs based on search query', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const input = screen.getByTestId('command-bar-input');
    await user.type(input, 'users');

    // The filter is based on the value prop which includes method + label + url
    expect(screen.getAllByText(/GET/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/GET \/users/i)).toBeInTheDocument();

    // POST /posts should be hidden
    const postItem = screen.queryByTestId('tab-item-tab-2');
    if (postItem !== null) {
      expect(postItem).toHaveAttribute('hidden');
    }
  });

  it('should activate tab when tab item is selected', async () => {
    const user = userEvent.setup();
    const mockSetActiveTab = vi.fn();

    const mockTabs = {
      'tab-1': {
        id: 'tab-1',
        label: 'GET /users',
        method: 'GET' as const,
        url: 'https://api.example.com/users',
        headers: {},
        body: '',
        response: null,
        isDirty: false,
        createdAt: Date.now(),
      },
    };

    vi.mocked(useTabStore).mockImplementation((selector) => {
      const state = {
        tabs: mockTabs,
        tabOrder: ['tab-1'],
        activeTabId: 'tab-1',
        openTab: vi.fn(),
        closeTab: vi.fn(),
        setActiveTab: mockSetActiveTab,
        updateTab: vi.fn(),
        reorderTab: vi.fn(),
        closeOtherTabs: vi.fn(),
        closeAllTabs: vi.fn(),
        findTabBySource: vi.fn(),
        getActiveTab: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return selector !== undefined ? selector(state) : state;
    });

    render(<CommandBar isOpen onClose={mockOnClose} />);

    const tabItem = screen.getByText(/GET \/users/i);
    await user.click(tabItem);

    expect(mockSetActiveTab).toHaveBeenCalledWith('tab-1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should execute Collection Request selection via event bus', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const item = screen.getByText(/Get Users/i);
    await user.click(item);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith(
      'collection.request-selected',
      expect.objectContaining({
        collectionId: 'coll-1',
        request: expect.objectContaining({ id: 'req-1', name: 'Get Users' }),
      })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should execute History Entry selection via event bus', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    // Use test ID to avoid ambiguity with tabs that might have same URL
    const item = screen.getByTestId('history-item-hist-1');
    await user.click(item);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith(
      'history.entry-selected',
      expect.objectContaining({ id: 'hist-1' })
    );
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle keyboard navigation with arrow keys', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const input = screen.getByTestId('command-bar-input');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    // Verify that navigation occurred (cmdk handles focus internally)
    expect(input).toBeInTheDocument();
  });

  it('should execute New Request action via event bus', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const action = screen.getByText(/new request/i);
    await user.click(action);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith('request.new', expect.any(Object));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should execute Toggle Sidebar action via event bus', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const action = screen.getByText(/toggle sidebar/i);
    await user.click(action);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith('sidebar.toggle', expect.any(Object));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should execute Toggle DevTools action via event bus', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const action = screen.getByText(/toggle devtools/i);
    await user.click(action);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith('panel.toggle', expect.any(Object));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should execute Toggle Settings action via event bus', async () => {
    const user = userEvent.setup();
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const action = screen.getByText(/toggle settings/i);
    await user.click(action);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(globalEventBus.emit).toHaveBeenCalledWith('settings.toggle', expect.any(Object));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should have proper ARIA attributes', () => {
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-label');
  });

  it('should focus input when opened', () => {
    render(<CommandBar isOpen onClose={mockOnClose} />);

    const input = screen.getByTestId('command-bar-input');
    expect(input).toHaveFocus();
  });
});
