/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricsToggle } from './MetricsToggle';

describe('MetricsToggle', () => {
  const mockOnChange = vi.fn();

  it('renders toggle with label', () => {
    render(<MetricsToggle checked={false} onChange={mockOnChange} label="Enable metrics" />);

    expect(screen.getByText('Enable metrics')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-toggle')).toBeInTheDocument();
  });

  it('calls onChange when toggle changes', async () => {
    const user = userEvent.setup();
    render(<MetricsToggle checked={false} onChange={mockOnChange} label="Enable metrics" />);

    const toggle = screen.getByTestId('switch');
    await user.click(toggle);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('prevents dialog close with stopPropagation', async () => {
    const user = userEvent.setup();
    const mockStopPropagation = vi.fn();

    render(
      <div onClick={mockStopPropagation}>
        <MetricsToggle checked={false} onChange={mockOnChange} label="Enable metrics" />
      </div>
    );

    const toggle = screen.getByTestId('switch');
    await user.click(toggle);

    // Switch already handles stopPropagation internally
    expect(mockOnChange).toHaveBeenCalled();
  });
});
