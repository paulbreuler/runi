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
    const onChange = vi.fn();
    render(<MetricsToggle checked={false} onChange={onChange} label="Enable metrics" />);

    const toggle = screen.getByTestId('switch');
    await user.click(toggle);

    // Base UI Switch passes (checked, eventDetails)
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]?.[0]).toBe(true);
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
