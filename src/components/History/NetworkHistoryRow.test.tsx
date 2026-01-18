import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NetworkHistoryRow } from './NetworkHistoryRow';
import type { NetworkHistoryEntry } from '@/types/history';

// Mock useReducedMotion to disable animations in tests
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');
  return {
    ...actual,
    useReducedMotion: (): boolean => true,
  };
});

describe('NetworkHistoryRow', () => {
  const mockEntry: NetworkHistoryEntry = {
    id: 'hist_test123',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    request: {
      url: 'https://api.example.com/users',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: null,
      timeout_ms: 30000,
    },
    response: {
      status: 200,
      status_text: 'OK',
      headers: { 'Content-Type': 'application/json' },
      body: '{"users": []}',
      timing: {
        total_ms: 150,
        dns_ms: 10,
        connect_ms: 20,
        tls_ms: 30,
        first_byte_ms: 100,
      },
    },
    intelligence: {
      boundToSpec: true,
      specOperation: 'getUsers',
      drift: null,
      aiGenerated: false,
      verified: true,
    },
  };

  const defaultProps = {
    entry: mockEntry,
    isExpanded: false,
    isSelected: false,
    onToggleExpand: vi.fn(),
    onSelect: vi.fn(),
    onReplay: vi.fn(),
    onCopyCurl: vi.fn(),
  };

  it('renders method badge', () => {
    render(<NetworkHistoryRow {...defaultProps} />);
    expect(screen.getByTestId('method-badge')).toHaveTextContent('GET');
  });

  it('renders URL', () => {
    render(<NetworkHistoryRow {...defaultProps} />);
    expect(screen.getByText('https://api.example.com/users')).toBeInTheDocument();
  });

  it('renders status code with correct styling', () => {
    render(<NetworkHistoryRow {...defaultProps} />);
    const status = screen.getByTestId('status-badge');
    expect(status).toHaveTextContent('200');
    expect(status).toHaveClass('text-signal-success');
  });

  it('renders response time', () => {
    render(<NetworkHistoryRow {...defaultProps} />);
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('renders relative timestamp', () => {
    render(<NetworkHistoryRow {...defaultProps} />);
    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('renders intelligence signals when present (smoke test)', () => {
    // Detailed signal behavior is tested in IntelligenceSignals.test.tsx
    render(<NetworkHistoryRow {...defaultProps} />);
    expect(screen.getByTestId('signal-dot-verified')).toBeInTheDocument();
    expect(screen.getByTestId('signal-dot-bound')).toBeInTheDocument();
  });

  it('calls onToggleExpand when chevron is clicked', () => {
    const onToggleExpand = vi.fn();
    render(<NetworkHistoryRow {...defaultProps} onToggleExpand={onToggleExpand} />);
    fireEvent.click(screen.getByTestId('expand-button'));
    expect(onToggleExpand).toHaveBeenCalledWith('hist_test123');
  });

  it('calls onSelect when row is clicked', () => {
    const onSelect = vi.fn();
    render(<NetworkHistoryRow {...defaultProps} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('history-row'));
    expect(onSelect).toHaveBeenCalledWith('hist_test123');
  });

  it('shows action buttons on hover', () => {
    render(<NetworkHistoryRow {...defaultProps} />);
    const actionsContainer = screen.getByTestId('row-actions');
    expect(actionsContainer).toHaveClass('opacity-0');
    expect(actionsContainer).toHaveClass('group-hover:opacity-100');
  });

  it('calls onReplay when replay button is clicked', () => {
    const onReplay = vi.fn();
    render(<NetworkHistoryRow {...defaultProps} onReplay={onReplay} />);
    fireEvent.click(screen.getByTestId('replay-button'));
    expect(onReplay).toHaveBeenCalledWith(mockEntry);
  });

  it('calls onCopyCurl when copy button is clicked', () => {
    const onCopyCurl = vi.fn();
    render(<NetworkHistoryRow {...defaultProps} onCopyCurl={onCopyCurl} />);
    fireEvent.click(screen.getByTestId('copy-curl-button'));
    expect(onCopyCurl).toHaveBeenCalledWith(mockEntry);
  });

  it('shows expanded section when isExpanded is true', () => {
    render(<NetworkHistoryRow {...defaultProps} isExpanded={true} />);
    expect(screen.getByTestId('expanded-section')).toBeInTheDocument();
    expect(screen.getByTestId('timing-waterfall')).toBeInTheDocument();
  });

  it('hides expanded section when isExpanded is false', () => {
    render(<NetworkHistoryRow {...defaultProps} isExpanded={false} />);
    expect(screen.queryByTestId('expanded-section')).toBeNull();
  });

  it('shows selected styling when isSelected is true', () => {
    render(<NetworkHistoryRow {...defaultProps} isSelected={true} />);
    const row = screen.getByTestId('history-row');
    expect(row).toHaveClass('bg-bg-raised');
  });

  it('renders different status code colors correctly', () => {
    const entry201 = { ...mockEntry, response: { ...mockEntry.response, status: 201 } };
    const entry301 = { ...mockEntry, response: { ...mockEntry.response, status: 301 } };
    const entry404 = { ...mockEntry, response: { ...mockEntry.response, status: 404 } };
    const entry500 = { ...mockEntry, response: { ...mockEntry.response, status: 500 } };

    const { rerender } = render(<NetworkHistoryRow {...defaultProps} entry={entry201} />);
    expect(screen.getByTestId('status-badge')).toHaveClass('text-signal-success');

    rerender(<NetworkHistoryRow {...defaultProps} entry={entry301} />);
    expect(screen.getByTestId('status-badge')).toHaveClass('text-accent-blue');

    rerender(<NetworkHistoryRow {...defaultProps} entry={entry404} />);
    expect(screen.getByTestId('status-badge')).toHaveClass('text-signal-warning');

    rerender(<NetworkHistoryRow {...defaultProps} entry={entry500} />);
    expect(screen.getByTestId('status-badge')).toHaveClass('text-signal-error');
  });

  it('renders response size when available', () => {
    render(<NetworkHistoryRow {...defaultProps} />);
    // 13 bytes = '{"users": []}'.length
    expect(screen.getByTestId('response-size')).toHaveTextContent('13 B');
  });

  it('renders drift signal when drift is present', () => {
    const entryWithDrift: NetworkHistoryEntry = {
      ...mockEntry,
      intelligence: {
        ...mockEntry.intelligence!,
        drift: { type: 'response', fields: ['status'], message: 'Status differs' },
        verified: false,
      },
    };
    render(<NetworkHistoryRow {...defaultProps} entry={entryWithDrift} />);
    expect(screen.getByTestId('signal-dot-drift')).toBeInTheDocument();
  });

  describe('timing waterfall integration', () => {
    // Note: Detailed waterfall behavior is tested in TimingWaterfall.test.tsx
    // These tests verify the waterfall is correctly integrated into the row

    it('renders waterfall when expanded with valid timing data', () => {
      render(<NetworkHistoryRow {...defaultProps} isExpanded={true} />);
      expect(screen.getByTestId('timing-waterfall')).toBeInTheDocument();
    });

    it('renders empty waterfall when timing data is incomplete', () => {
      const entryWithNullTiming: NetworkHistoryEntry = {
        ...mockEntry,
        response: {
          ...mockEntry.response,
          timing: {
            total_ms: 150,
            dns_ms: null,
            connect_ms: null,
            tls_ms: null,
            first_byte_ms: null,
          },
        },
      };
      render(<NetworkHistoryRow {...defaultProps} entry={entryWithNullTiming} isExpanded={true} />);
      expect(screen.getByTestId('timing-waterfall-empty')).toBeInTheDocument();
    });
  });
});
