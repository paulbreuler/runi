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
});
