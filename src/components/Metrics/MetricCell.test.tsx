/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCell } from './MetricCell';

describe('MetricCell', () => {
  const mockFormatter = (value: number): string => `${value.toFixed(1)} MB`;

  it('renders value with formatter', () => {
    render(<MetricCell value={245.5} threshold={500} formatter={mockFormatter} />);

    expect(screen.getByText('245.5 MB')).toBeInTheDocument();
  });

  it('uses text-xs font-mono styling', () => {
    render(<MetricCell value={100} threshold={500} formatter={mockFormatter} />);

    const cell = screen.getByTestId('metric-cell');
    expect(cell).toHaveClass('text-xs');
    expect(cell).toHaveClass('font-mono');
  });

  it('shows green color when value < threshold * 0.7', () => {
    render(<MetricCell value={300} threshold={500} formatter={mockFormatter} />);

    const cell = screen.getByTestId('metric-cell');
    expect(cell).toHaveClass('text-signal-success');
  });

  it('shows amber color when value >= threshold * 0.7 && < threshold', () => {
    render(<MetricCell value={400} threshold={500} formatter={mockFormatter} />);

    const cell = screen.getByTestId('metric-cell');
    expect(cell).toHaveClass('text-signal-warning');
  });

  it('shows red color when value >= threshold', () => {
    render(<MetricCell value={600} threshold={500} formatter={mockFormatter} />);

    const cell = screen.getByTestId('metric-cell');
    expect(cell).toHaveClass('text-signal-error');
  });
});
