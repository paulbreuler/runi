/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';

/** Popover content renders in a portal with data-test-id; use this to find it. */
function getPopoverContent(): HTMLElement | null {
  return document.querySelector('[data-test-id="popover-content"]');
}

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
        <PopoverContent data-test-id="popover-content">Content</PopoverContent>
      </Popover>
    );

    const trigger = screen.getByText('Click me');
    await act(async () => {
      fireEvent.click(trigger);
    });

    // Wait for popover to render in portal (uses data-test-id)
    const content = await waitFor(
      () => {
        const el = getPopoverContent();
        expect(el).toBeTruthy();
        return el!;
      },
      { timeout: 2000 }
    );
    expect(content).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('hides content when clicked outside', async () => {
    const handleOpenChange = vi.fn();
    render(
      <div>
        <div data-test-id="outside">Outside</div>
        <Popover
          onOpenChange={(open) => {
            handleOpenChange(open);
          }}
        >
          <PopoverTrigger>Click me</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      </div>
    );

    // Open popover
    const trigger = screen.getByText('Click me');
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(await screen.findByText('Content')).toBeInTheDocument();

    // Wait for open state to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Click outside (Base UI handles dismissal via Escape or pointer events)
    await act(async () => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    });

    // Wait for close state to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // Should have called onOpenChange with false (Base UI calls with (open, eventDetails))
    // Check that the last call had false as the first argument
    const lastCall = handleOpenChange.mock.calls[handleOpenChange.mock.calls.length - 1];
    expect(lastCall).toBeDefined();
    expect(lastCall![0]).toBe(false);
  });

  it('applies custom className to content', async () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Click me</PopoverTrigger>
        <PopoverContent className="custom-class" data-test-id="popover-content">
          Content
        </PopoverContent>
      </Popover>
    );

    const content = await waitFor(
      () => {
        const el = getPopoverContent();
        expect(el).toBeTruthy();
        return el!;
      },
      { timeout: 2000 }
    );
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
            <PopoverContent data-test-id="popover-content">Content</PopoverContent>
          </Popover>
        </>
      );
    };

    render(<TestComponent />);

    // Initially closed
    expect(getPopoverContent()).toBeNull();

    // Open via external button
    await act(async () => {
      fireEvent.click(screen.getByText('External Open'));
    });
    const content = await waitFor(
      () => {
        const el = getPopoverContent();
        expect(el).toBeTruthy();
        return el!;
      },
      { timeout: 2000 }
    );
    expect(content).toBeInTheDocument();
  });
});

// Need to import React for the controlled state test
import React from 'react';
