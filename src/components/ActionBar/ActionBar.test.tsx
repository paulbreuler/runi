/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActionBar } from './ActionBar';
import { ActionBarGroup } from './ActionBarGroup';
import { useActionBarContext } from './ActionBarContext';

// Mock ResizeObserver
class MockResizeObserver {
  public callback: ResizeObserverCallback;
  public elements: Element[] = [];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  public observe(element: Element): void {
    this.elements.push(element);
    // Trigger initial callback with default width
    this.callback(
      [
        {
          target: element,
          contentRect: { width: 1000, height: 40 } as DOMRectReadOnly,
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this
    );
  }

  public disconnect(): void {
    this.elements = [];
  }

  public unobserve(element: Element): void {
    this.elements = this.elements.filter((el) => el !== element);
  }

  // Helper to trigger resize
  public triggerResize(width: number): void {
    for (const element of this.elements) {
      this.callback(
        [
          {
            target: element,
            contentRect: { width, height: 40 } as DOMRectReadOnly,
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        this
      );
    }
  }
}

// Track all observers to support multiple ResizeObservers
const mockObservers: MockResizeObserver[] = [];
const OriginalResizeObserver = global.ResizeObserver;

// Helper to trigger resize on all observers
const triggerAllResizes = (width: number): void => {
  for (const observer of mockObservers) {
    observer.triggerResize(width);
  }
};

beforeEach(() => {
  mockObservers.length = 0;
  (global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = function (
    cb: ResizeObserverCallback
  ): MockResizeObserver {
    const observer = new MockResizeObserver(cb);
    mockObservers.push(observer);
    return observer;
  } as unknown as typeof ResizeObserver;
});

afterEach(() => {
  global.ResizeObserver = OriginalResizeObserver;
});

// Test component to verify context value
const ContextConsumer = (): React.JSX.Element => {
  const { variant } = useActionBarContext();
  return <span data-testid="variant">{variant}</span>;
};

describe('ActionBar', () => {
  it('renders children', () => {
    render(
      <ActionBar>
        <button type="button">Test Button</button>
      </ActionBar>
    );
    expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
  });

  it('has toolbar role', () => {
    render(
      <ActionBar aria-label="Test toolbar">
        <span>Content</span>
      </ActionBar>
    );
    expect(screen.getByRole('toolbar', { name: /test toolbar/i })).toBeInTheDocument();
  });

  it('provides variant context to children', () => {
    render(
      <ActionBar>
        <ContextConsumer />
      </ActionBar>
    );
    expect(screen.getByTestId('variant')).toHaveTextContent('full');
  });

  it('changes variant to compact at medium width', async () => {
    render(
      <ActionBar breakpoints={[800, 600]}>
        <ContextConsumer />
      </ActionBar>
    );

    // Trigger resize to compact range on all observers
    triggerAllResizes(700);

    await waitFor(() => {
      expect(screen.getByTestId('variant')).toHaveTextContent('compact');
    });
  });

  it('changes variant to icon at small width', async () => {
    render(
      <ActionBar breakpoints={[800, 600]}>
        <ContextConsumer />
      </ActionBar>
    );

    // Trigger resize to icon range on all observers
    triggerAllResizes(500);

    await waitFor(() => {
      expect(screen.getByTestId('variant')).toHaveTextContent('icon');
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <ActionBar className="custom-class">
        <span>Content</span>
      </ActionBar>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('uses custom breakpoints', async () => {
    render(
      <ActionBar breakpoints={[500, 300]}>
        <ContextConsumer />
      </ActionBar>
    );

    // At 400px with breakpoints [500, 300], should be compact
    triggerAllResizes(400);

    await waitFor(() => {
      expect(screen.getByTestId('variant')).toHaveTextContent('compact');
    });
  });
});

describe('ActionBarGroup', () => {
  it('renders children', () => {
    render(
      <ActionBar>
        <ActionBarGroup>
          <button type="button">Group Button</button>
        </ActionBarGroup>
      </ActionBar>
    );
    expect(screen.getByRole('button', { name: /group button/i })).toBeInTheDocument();
  });

  it('has group role by default', () => {
    render(
      <ActionBar>
        <ActionBarGroup aria-label="Test group">
          <span>Content</span>
        </ActionBarGroup>
      </ActionBar>
    );
    expect(screen.getByRole('group', { name: /test group/i })).toBeInTheDocument();
  });

  it('applies separator class when separator prop is true', () => {
    render(
      <ActionBar>
        <ActionBarGroup separator aria-label="With separator">
          <span>Content</span>
        </ActionBarGroup>
      </ActionBar>
    );
    const group = screen.getByRole('group', { name: /with separator/i });
    expect(group).toHaveClass('border-r');
  });

  it('applies end alignment when align is end', () => {
    render(
      <ActionBar>
        <ActionBarGroup align="end" aria-label="End aligned">
          <span>Content</span>
        </ActionBarGroup>
      </ActionBar>
    );
    const group = screen.getByRole('group', { name: /end aligned/i });
    expect(group).toHaveClass('ml-auto');
  });
});
