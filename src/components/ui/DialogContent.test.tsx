/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DialogContent } from './DialogContent';

describe('DialogContent', () => {
  it('renders children with padding', () => {
    render(
      <DialogContent>
        <div>Test content</div>
      </DialogContent>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-content')).toHaveClass('p-2.5');
  });

  it('does not have grid layout (just padding)', () => {
    render(
      <DialogContent>
        <div>Content</div>
      </DialogContent>
    );

    const content = screen.getByTestId('dialog-content');
    expect(content).not.toHaveClass('grid');
  });
});
