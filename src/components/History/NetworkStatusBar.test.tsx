import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NetworkStatusBar } from './NetworkStatusBar';

describe('NetworkStatusBar', () => {
  it('renders total entry count', () => {
    render(<NetworkStatusBar totalCount={42} driftCount={0} aiCount={0} boundCount={0} />);
    expect(screen.getByText('42 requests')).toBeInTheDocument();
  });

  it('renders drift count when present', () => {
    render(<NetworkStatusBar totalCount={10} driftCount={3} aiCount={0} boundCount={0} />);
    expect(screen.getByText('3 with drift')).toBeInTheDocument();
  });

  it('renders AI count when present', () => {
    render(<NetworkStatusBar totalCount={10} driftCount={0} aiCount={5} boundCount={0} />);
    expect(screen.getByText('5 AI-generated')).toBeInTheDocument();
  });

  it('renders bound count when present', () => {
    render(<NetworkStatusBar totalCount={10} driftCount={0} aiCount={0} boundCount={7} />);
    expect(screen.getByText('7 spec-bound')).toBeInTheDocument();
  });

  it('renders all counts together', () => {
    render(<NetworkStatusBar totalCount={100} driftCount={5} aiCount={10} boundCount={80} />);
    expect(screen.getByText('100 requests')).toBeInTheDocument();
    expect(screen.getByText('5 with drift')).toBeInTheDocument();
    expect(screen.getByText('10 AI-generated')).toBeInTheDocument();
    expect(screen.getByText('80 spec-bound')).toBeInTheDocument();
  });

  it('hides counts that are zero', () => {
    render(<NetworkStatusBar totalCount={10} driftCount={0} aiCount={0} boundCount={0} />);
    expect(screen.queryByText('with drift')).toBeNull();
    expect(screen.queryByText('AI-generated')).toBeNull();
    expect(screen.queryByText('spec-bound')).toBeNull();
  });

  it('renders keyboard hint', () => {
    render(<NetworkStatusBar totalCount={10} driftCount={0} aiCount={0} boundCount={0} />);
    expect(screen.getByText(/⌘K/)).toBeInTheDocument();
  });

  it('uses singular "request" when count is 1', () => {
    render(<NetworkStatusBar totalCount={1} driftCount={0} aiCount={0} boundCount={0} />);
    expect(screen.getByText('1 request')).toBeInTheDocument();
  });

  it('renders drift count with correct color', () => {
    render(<NetworkStatusBar totalCount={10} driftCount={3} aiCount={0} boundCount={0} />);
    const driftElement = screen.getByText('3 with drift');
    expect(driftElement).toHaveClass('text-signal-warning');
  });

  it('renders AI count with correct color', () => {
    render(<NetworkStatusBar totalCount={10} driftCount={0} aiCount={5} boundCount={0} />);
    const aiElement = screen.getByText('5 AI-generated');
    expect(aiElement).toHaveClass('text-signal-ai');
  });

  it('renders bound count with correct color', () => {
    render(<NetworkStatusBar totalCount={10} driftCount={0} aiCount={0} boundCount={7} />);
    const boundElement = screen.getByText('7 spec-bound');
    expect(boundElement).toHaveClass('text-accent-blue');
  });
});
