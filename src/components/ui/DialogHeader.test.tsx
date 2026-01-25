/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DialogHeader } from './DialogHeader';

describe('DialogHeader', () => {
  const mockOnClose = vi.fn();

  it('renders title on left', () => {
    render(<DialogHeader title="Test Title" onClose={mockOnClose} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-header')).toHaveClass('grid-cols-[1fr_auto_auto]');
  });

  it('renders close button on rightmost', () => {
    render(<DialogHeader title="Test" onClose={mockOnClose} />);

    const closeButton = screen.getByTestId('dialog-close-button');
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<DialogHeader title="Test" onClose={mockOnClose} />);

    const closeButton = screen.getByTestId('dialog-close-button');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders optional actions in center/right', () => {
    render(
      <DialogHeader
        title="Test"
        onClose={mockOnClose}
        actions={<button type="button">Action</button>}
      />
    );

    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('has all items at same height (align-items: center)', () => {
    render(<DialogHeader title="Test" onClose={mockOnClose} />);

    const header = screen.getByTestId('dialog-header');
    expect(header).toHaveClass('items-center');
  });

  it('uses 3-column grid layout', () => {
    render(<DialogHeader title="Test" onClose={mockOnClose} />);

    const header = screen.getByTestId('dialog-header');
    expect(header).toHaveClass('grid');
    expect(header).toHaveClass('grid-cols-[1fr_auto_auto]');
  });
});
