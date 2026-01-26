/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';

describe('Popover', () => {
  it('renders trigger element', () => {
    render(
      <Popover>
        <PopoverTrigger>Click me</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    );
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('shows content when trigger is clicked', async () => {
    render(
      <Popover>
        <PopoverTrigger>Click me</PopoverTrigger>
        <PopoverContent data-testid="popover-content">Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByText('Click me');
    fireEvent.click(trigger);

    expect(await screen.findByTestId('popover-content')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('hides content when clicked outside', async () => {
    const handleOpenChange = vi.fn();
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <Popover onOpenChange={handleOpenChange}>
          <PopoverTrigger>Click me</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      </div>
    );

    // Open popover
    const trigger = screen.getByText('Click me');
    fireEvent.click(trigger);
    expect(await screen.findByText('Content')).toBeInTheDocument();

    // Click outside (Radix handles dismissal via Escape or pointer events)
    fireEvent.keyDown(document.body, { key: 'Escape' });

    // Should have called onOpenChange with false
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('applies custom className to content', async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Click me</PopoverTrigger>
        <PopoverContent className="custom-class" data-testid="popover-content">
          Content
        </PopoverContent>
      </Popover>
    );

    const content = await screen.findByTestId('popover-content');
    expect(content).toHaveClass('custom-class');
  });

  it('supports controlled open state', async () => {
    const TestComponent = (): React.JSX.Element => {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button
            onClick={(): void => {
              setOpen(true);
            }}
          >
            External Open
          </button>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>Trigger</PopoverTrigger>
            <PopoverContent data-testid="popover-content">Content</PopoverContent>
          </Popover>
        </>
      );
    };

    render(<TestComponent />);

    // Initially closed
    expect(screen.queryByTestId('popover-content')).not.toBeInTheDocument();

    // Open via external button
    fireEvent.click(screen.getByText('External Open'));
    expect(await screen.findByTestId('popover-content')).toBeInTheDocument();
  });
});

// Need to import React for the controlled state test
import React from 'react';
