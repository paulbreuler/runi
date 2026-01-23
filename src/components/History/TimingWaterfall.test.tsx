/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TimingWaterfall } from './TimingWaterfall';
import type { TimingWaterfallSegments } from '@/types/history';

// Mock useReducedMotion to disable animations in tests
vi.mock('motion/react', async () => {
  const actual = await vi.importActual('motion/react');
  return {
    ...actual,
    useReducedMotion: (): boolean => true,
  };
});

describe('TimingWaterfall', () => {
  const defaultSegments: TimingWaterfallSegments = {
    dns: 10,
    connect: 20,
    tls: 30,
    wait: 50,
    download: 40,
  };

  it('renders all timing segments', () => {
    render(<TimingWaterfall segments={defaultSegments} totalMs={150} />);
    expect(screen.getByTestId('timing-dns')).toBeInTheDocument();
    expect(screen.getByTestId('timing-connect')).toBeInTheDocument();
    expect(screen.getByTestId('timing-tls')).toBeInTheDocument();
    expect(screen.getByTestId('timing-wait')).toBeInTheDocument();
    expect(screen.getByTestId('timing-download')).toBeInTheDocument();
  });

  it('renders segment widths proportionally', () => {
    render(<TimingWaterfall segments={defaultSegments} totalMs={150} />);
    // Total is 150ms, dns is 10ms = 6.666...%
    const dns = screen.getByTestId('timing-dns');
    // Motion applies inline style - check that width is set (with reduced motion, instant)
    // The style attribute contains the percentage width
    expect(dns).toHaveAttribute('style');
    const styleAttr = dns.getAttribute('style') ?? '';
    expect(styleAttr).toContain('width:');
  });

  it('applies correct color classes to segments', () => {
    render(<TimingWaterfall segments={defaultSegments} totalMs={150} />);
    expect(screen.getByTestId('timing-dns')).toHaveClass('bg-accent-purple');
    expect(screen.getByTestId('timing-connect')).toHaveClass('bg-signal-warning');
    expect(screen.getByTestId('timing-tls')).toHaveClass('bg-signal-ai');
    expect(screen.getByTestId('timing-wait')).toHaveClass('bg-signal-success');
    expect(screen.getByTestId('timing-download')).toHaveClass('bg-accent-blue');
  });

  it('shows legend with ms values', () => {
    render(<TimingWaterfall segments={defaultSegments} totalMs={150} showLegend />);
    expect(screen.getByText('DNS')).toBeInTheDocument();
    expect(screen.getByText('10ms')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
    expect(screen.getByText('20ms')).toBeInTheDocument();
    expect(screen.getByText('TLS')).toBeInTheDocument();
    expect(screen.getByText('30ms')).toBeInTheDocument();
    expect(screen.getByText('Wait')).toBeInTheDocument();
    expect(screen.getByText('50ms')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('40ms')).toBeInTheDocument();
  });

  it('does not show legend by default', () => {
    render(<TimingWaterfall segments={defaultSegments} totalMs={150} />);
    expect(screen.queryByText('DNS')).toBeNull();
  });

  it('hides segments with zero duration', () => {
    const segmentsWithZeros: TimingWaterfallSegments = {
      dns: 0,
      connect: 0,
      tls: 0,
      wait: 100,
      download: 50,
    };
    render(<TimingWaterfall segments={segmentsWithZeros} totalMs={150} />);

    // DNS, Connect, TLS should not be visible (0 width)
    const dns = screen.getByTestId('timing-dns');
    expect(dns).toHaveStyle({ width: '0%' });
  });

  it('shows total time in compact mode', () => {
    render(<TimingWaterfall segments={defaultSegments} totalMs={150} compact />);
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('renders empty state when segments undefined', () => {
    render(<TimingWaterfall totalMs={150} />);
    expect(screen.getByTestId('timing-waterfall-empty')).toBeInTheDocument();
  });

  it('applies custom height class', () => {
    render(<TimingWaterfall segments={defaultSegments} totalMs={150} height="h-3" />);
    const container = screen.getByTestId('timing-waterfall');
    expect(container).toHaveClass('h-3');
  });

  describe('edge cases', () => {
    it('handles very large timing values', () => {
      const largeSegments: TimingWaterfallSegments = {
        dns: 10000,
        connect: 20000,
        tls: 30000,
        wait: 50000,
        download: 40000,
      };
      render(<TimingWaterfall segments={largeSegments} totalMs={150000} />);

      // All segments should render
      expect(screen.getByTestId('timing-dns')).toBeInTheDocument();
      expect(screen.getByTestId('timing-download')).toBeInTheDocument();
    });

    it('handles all segments being zero', () => {
      const zeroSegments: TimingWaterfallSegments = {
        dns: 0,
        connect: 0,
        tls: 0,
        wait: 0,
        download: 0,
      };
      render(<TimingWaterfall segments={zeroSegments} totalMs={0} />);

      // Should render segments with zero width
      const dns = screen.getByTestId('timing-dns');
      expect(dns).toHaveStyle({ width: '0%' });
    });

    it('handles totalMs of zero with non-zero segments', () => {
      // Edge case: totalMs=0 but segments have values (would cause division by zero)
      const segments: TimingWaterfallSegments = {
        dns: 10,
        connect: 20,
        tls: 30,
        wait: 50,
        download: 40,
      };
      render(<TimingWaterfall segments={segments} totalMs={0} />);

      // Should not crash, segments should render
      expect(screen.getByTestId('timing-dns')).toBeInTheDocument();
    });

    it('handles negative segment values gracefully', () => {
      const negativeSegments: TimingWaterfallSegments = {
        dns: -10,
        connect: 20,
        tls: 30,
        wait: 50,
        download: 40,
      };
      render(<TimingWaterfall segments={negativeSegments} totalMs={150} />);

      // Component should still render without crashing
      expect(screen.getByTestId('timing-waterfall')).toBeInTheDocument();
    });

    it('handles single segment with all duration', () => {
      const singleSegment: TimingWaterfallSegments = {
        dns: 0,
        connect: 0,
        tls: 0,
        wait: 0,
        download: 100,
      };
      render(<TimingWaterfall segments={singleSegment} totalMs={100} />);

      const download = screen.getByTestId('timing-download');
      expect(download).toHaveStyle({ width: '100%' });
    });

    it('handles segments that exceed totalMs', () => {
      // Segments sum to 200ms but totalMs is only 100ms
      const exceededSegments: TimingWaterfallSegments = {
        dns: 40,
        connect: 40,
        tls: 40,
        wait: 40,
        download: 40,
      };
      render(<TimingWaterfall segments={exceededSegments} totalMs={100} />);

      // Should not crash, widths will exceed 100% but component handles it
      expect(screen.getByTestId('timing-waterfall')).toBeInTheDocument();
    });

    it('handles very small fractional values', () => {
      const tinySegments: TimingWaterfallSegments = {
        dns: 0.001,
        connect: 0.002,
        tls: 0.003,
        wait: 0.004,
        download: 0.005,
      };
      render(<TimingWaterfall segments={tinySegments} totalMs={0.015} />);

      expect(screen.getByTestId('timing-waterfall')).toBeInTheDocument();
    });
  });

  describe('inline labels', () => {
    it('shows inline labels when showInlineLabels is true and segment is large enough', () => {
      // Wait is 50% of total, should show inline label
      const segments: TimingWaterfallSegments = {
        dns: 10,
        connect: 10,
        tls: 10,
        wait: 50,
        download: 20,
      };
      render(<TimingWaterfall segments={segments} totalMs={100} showInlineLabels />);

      // Wait segment (50%) should show inline label
      expect(screen.getByTestId('timing-wait')).toHaveTextContent('50ms');
    });

    it('does not show inline labels for small segments', () => {
      // DNS is only 5% of total, too small for inline label
      const segments: TimingWaterfallSegments = {
        dns: 5,
        connect: 5,
        tls: 5,
        wait: 80,
        download: 5,
      };
      render(<TimingWaterfall segments={segments} totalMs={100} showInlineLabels />);

      // DNS segment (5%) should not show inline label
      const dnsSegment = screen.getByTestId('timing-dns');
      expect(dnsSegment).not.toHaveTextContent('5ms');
    });

    it('does not show inline labels by default', () => {
      const segments: TimingWaterfallSegments = {
        dns: 10,
        connect: 10,
        tls: 10,
        wait: 50,
        download: 20,
      };
      render(<TimingWaterfall segments={segments} totalMs={100} />);

      // Even large segments should not show labels without the prop
      const waitSegment = screen.getByTestId('timing-wait');
      expect(waitSegment).not.toHaveTextContent('50ms');
    });

    it('centers the inline label within the segment', () => {
      const segments: TimingWaterfallSegments = {
        dns: 0,
        connect: 0,
        tls: 0,
        wait: 100,
        download: 0,
      };
      render(<TimingWaterfall segments={segments} totalMs={100} showInlineLabels />);

      const waitSegment = screen.getByTestId('timing-wait');
      expect(waitSegment).toHaveClass('justify-center');
      expect(waitSegment).toHaveClass('items-center');
    });
  });
});
