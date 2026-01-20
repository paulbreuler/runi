import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimingTab } from './TimingTab';
import type { TimingWaterfallSegments, IntelligenceInfo } from '@/types/history';

// Mock useReducedMotion to disable animations in tests
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');
  return {
    ...actual,
    useReducedMotion: (): boolean => true,
  };
});

describe('TimingTab', () => {
  const defaultSegments: TimingWaterfallSegments = {
    dns: 10,
    connect: 20,
    tls: 30,
    wait: 50,
    download: 40,
  };

  const totalMs = 150;

  describe('timing waterfall display', () => {
    it('displays timing waterfall', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} />);
      expect(screen.getByTestId('timing-waterfall')).toBeInTheDocument();
    });

    it('shows all timing segments', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} />);
      expect(screen.getByTestId('timing-dns')).toBeInTheDocument();
      expect(screen.getByTestId('timing-connect')).toBeInTheDocument();
      expect(screen.getByTestId('timing-tls')).toBeInTheDocument();
      expect(screen.getByTestId('timing-wait')).toBeInTheDocument();
      expect(screen.getByTestId('timing-download')).toBeInTheDocument();
    });

    it('displays total time', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} />);
      expect(screen.getByText('150ms')).toBeInTheDocument();
    });

    it('displays timing waterfall header', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} />);
      expect(screen.getByText('Timing Waterfall')).toBeInTheDocument();
    });

    it('shows segment legend', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} />);
      expect(screen.getByText('DNS')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
      expect(screen.getByText('TLS')).toBeInTheDocument();
      expect(screen.getByText('Wait')).toBeInTheDocument();
      expect(screen.getByText('Download')).toBeInTheDocument();
    });
  });

  describe('streaming state', () => {
    it('shows streaming indicator for streaming requests', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} isStreaming />);
      expect(screen.getByTestId('streaming-indicator')).toBeInTheDocument();
      expect(screen.getByText(/streaming/i)).toBeInTheDocument();
    });

    it('does not show streaming indicator when not streaming', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} isStreaming={false} />);
      expect(screen.queryByTestId('streaming-indicator')).toBeNull();
    });
  });

  describe('blocked state', () => {
    it('shows blocked message for blocked requests', () => {
      render(<TimingTab segments={defaultSegments} totalMs={0} isBlocked />);
      expect(screen.getByTestId('blocked-message')).toBeInTheDocument();
      expect(screen.getByText(/request blocked/i)).toBeInTheDocument();
    });

    it('does not show waterfall when blocked', () => {
      render(<TimingTab segments={defaultSegments} totalMs={0} isBlocked />);
      expect(screen.queryByTestId('timing-waterfall')).toBeNull();
    });

    it('does not show blocked message when not blocked', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} isBlocked={false} />);
      expect(screen.queryByTestId('blocked-message')).toBeNull();
    });
  });

  describe('throttled state', () => {
    it('shows throttle indicator when throttled', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} throttleRateKbps={256} />);
      expect(screen.getByTestId('throttle-indicator')).toBeInTheDocument();
      expect(screen.getByText(/throttled/i)).toBeInTheDocument();
      expect(screen.getByText(/256/)).toBeInTheDocument();
    });

    it('does not show throttle indicator when not throttled', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} />);
      expect(screen.queryByTestId('throttle-indicator')).toBeNull();
    });
  });

  describe('intelligence signals', () => {
    const intelligence: IntelligenceInfo = {
      verified: true,
      drift: { type: 'response', fields: ['status'], message: 'Schema mismatch' },
      aiGenerated: true,
      boundToSpec: true,
      specOperation: 'getUsers',
    };

    it('displays intelligence signals section', () => {
      render(
        <TimingTab segments={defaultSegments} totalMs={totalMs} intelligence={intelligence} />
      );
      expect(screen.getByTestId('intelligence-signals-section')).toBeInTheDocument();
      expect(screen.getByText('Intelligence Signals')).toBeInTheDocument();
    });

    it('displays verified signal', () => {
      render(
        <TimingTab
          segments={defaultSegments}
          totalMs={totalMs}
          intelligence={{ ...intelligence, drift: null, aiGenerated: false, boundToSpec: false }}
        />
      );
      expect(screen.getByText(/verified/i)).toBeInTheDocument();
    });

    it('displays drift signal with message', () => {
      render(
        <TimingTab
          segments={defaultSegments}
          totalMs={totalMs}
          intelligence={{
            ...intelligence,
            verified: false,
            aiGenerated: false,
            boundToSpec: false,
          }}
        />
      );
      expect(screen.getByText(/schema mismatch/i)).toBeInTheDocument();
    });

    it('displays AI-generated signal', () => {
      render(
        <TimingTab
          segments={defaultSegments}
          totalMs={totalMs}
          intelligence={{ ...intelligence, verified: false, drift: null, boundToSpec: false }}
        />
      );
      expect(screen.getByText(/ai generated/i)).toBeInTheDocument();
    });

    it('displays bound to spec signal', () => {
      render(
        <TimingTab
          segments={defaultSegments}
          totalMs={totalMs}
          intelligence={{ ...intelligence, verified: false, drift: null, aiGenerated: false }}
        />
      );
      expect(screen.getByText(/bound to/i)).toBeInTheDocument();
      expect(screen.getByText('getUsers')).toBeInTheDocument();
    });

    it('does not display intelligence section when no signals', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} />);
      expect(screen.queryByTestId('intelligence-signals-section')).toBeNull();
    });

    it('does not display intelligence section when all signals are false', () => {
      const emptyIntelligence: IntelligenceInfo = {
        verified: false,
        drift: null,
        aiGenerated: false,
        boundToSpec: false,
        specOperation: null,
      };
      render(
        <TimingTab segments={defaultSegments} totalMs={totalMs} intelligence={emptyIntelligence} />
      );
      expect(screen.queryByTestId('intelligence-signals-section')).toBeNull();
    });
  });

  describe('empty state', () => {
    it('shows empty waterfall when no segments provided', () => {
      render(<TimingTab totalMs={0} />);
      expect(screen.getByTestId('timing-waterfall-empty')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible role for timing section', () => {
      render(<TimingTab segments={defaultSegments} totalMs={totalMs} />);
      expect(screen.getByRole('region', { name: /timing/i })).toBeInTheDocument();
    });

    it('blocked message has alert role', () => {
      render(<TimingTab segments={defaultSegments} totalMs={0} isBlocked />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
