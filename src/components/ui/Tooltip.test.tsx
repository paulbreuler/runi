/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Tooltip, TooltipProvider } from './Tooltip';

/** Tooltip content renders in a portal with data-test-id; use this to find it. */
function getTooltipContent(testId: string): HTMLElement | null {
  return document.querySelector(`[data-test-id="${testId}"]`);
}

describe('Tooltip', () => {
  it('renders trigger element', () => {
    render(
      <TooltipProvider>
        <Tooltip content="Help text" data-test-id="tooltip-trigger">
          <button data-test-id="tooltip-trigger" type="button">
            Hover me
          </button>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByRole('button', { name: 'Hover me' })).toBeInTheDocument();
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('shows content when trigger is hovered', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip content="Help text" data-test-id="tooltip-trigger">
          <button data-test-id="tooltip-trigger" type="button">
            Hover me
          </button>
        </Tooltip>
      </TooltipProvider>
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' });
    await act(async () => {
      await user.hover(trigger);
    });

    const content = await waitFor(
      () => {
        const el = getTooltipContent('tooltip-content');
        expect(el).toBeTruthy();
        return el!;
      },
      { timeout: 2000 }
    );
    expect(content).toBeInTheDocument();
    expect(content).toHaveTextContent('Help text');
  });

  it('applies custom test ID to content', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip content="Custom" data-test-id="my-tooltip-trigger">
          <button data-test-id="my-tooltip-trigger" type="button">
            Trigger
          </button>
        </Tooltip>
      </TooltipProvider>
    );

    await act(async () => {
      await user.hover(screen.getByRole('button', { name: 'Trigger' }));
    });

    const content = await waitFor(
      () => {
        const el = getTooltipContent('my-tooltip-content');
        expect(el).toBeTruthy();
        return el!;
      },
      { timeout: 2000 }
    );
    expect(content).toHaveTextContent('Custom');
  });

  it('TooltipProvider wraps children', () => {
    render(
      <TooltipProvider>
        <span data-test-id="child">Child</span>
      </TooltipProvider>
    );
    expect(getTooltipContent('child')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
  });
});
