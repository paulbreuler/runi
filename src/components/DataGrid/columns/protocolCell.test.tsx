/**
 * @file ProtocolCell component tests
 * @description Tests for HTTP protocol version display
 *
 * TDD: RED phase - these tests define the expected behavior of protocolCell
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProtocolCell } from './protocolCell';

describe('ProtocolCell', () => {
  it('displays HTTP/2 in blue', () => {
    render(<ProtocolCell protocol="HTTP/2" />);
    const badge = screen.getByText('HTTP/2');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-accent-blue');
    expect(badge).toHaveClass('bg-accent-blue/10');
  });

  it('displays HTTP/1.1 in gray', () => {
    render(<ProtocolCell protocol="HTTP/1.1" />);
    const badge = screen.getByText('HTTP/1.1');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-text-muted');
    expect(badge).toHaveClass('bg-text-muted/10');
  });

  it('displays HTTP/1.0 in gray', () => {
    render(<ProtocolCell protocol="HTTP/1.0" />);
    const badge = screen.getByText('HTTP/1.0');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-text-muted');
    expect(badge).toHaveClass('bg-text-muted/10');
  });

  it('handles null protocol gracefully', () => {
    render(<ProtocolCell protocol={null} />);
    // Should render something (empty or fallback)
    const container = screen.getByTestId('protocol-cell');
    expect(container).toBeInTheDocument();
  });

  it('handles undefined protocol gracefully', () => {
    render(<ProtocolCell protocol={undefined} />);
    // Should render something (empty or fallback)
    const container = screen.getByTestId('protocol-cell');
    expect(container).toBeInTheDocument();
  });

  it('displays protocol as badge with correct styling', () => {
    render(<ProtocolCell protocol="HTTP/2" />);
    const badge = screen.getByText('HTTP/2');
    expect(badge).toHaveClass(
      'px-1.5',
      'py-0.5',
      'text-xs',
      'font-semibold',
      'rounded',
      'font-mono'
    );
  });

  it('handles unknown protocol versions', () => {
    render(<ProtocolCell protocol="HTTP/3" />);
    // Should default to gray for unknown versions
    const badge = screen.getByText('HTTP/3');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-text-muted');
  });
});
