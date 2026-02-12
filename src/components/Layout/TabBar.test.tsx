/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TabBar } from './TabBar';
import { useCanvasStore } from '@/stores/useCanvasStore';
import type { CanvasContextDescriptor } from '@/types/canvas';

// Mock ContextTabs component
vi.mock('./ContextTabs', () => ({
  ContextTabs: ({ sidebarWidth }: { sidebarWidth?: unknown }): React.JSX.Element => (
    <div data-test-id="context-tabs-mock" data-sidebar-width={sidebarWidth !== undefined}>
      Mocked ContextTabs
    </div>
  ),
}));

describe('TabBar', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('returns null when no contexts registered', () => {
    const { container } = render(<TabBar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders TabBar when contexts exist', () => {
    const { registerContext } = useCanvasStore.getState();

    const context: CanvasContextDescriptor = {
      id: 'test',
      label: 'Test',
      panels: {},
      layouts: [],
    };

    registerContext(context);

    render(<TabBar />);

    expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
    expect(screen.getByTestId('context-tabs-mock')).toBeInTheDocument();
  });

  it('has proper styling and layout', () => {
    const { registerContext } = useCanvasStore.getState();

    const context: CanvasContextDescriptor = {
      id: 'test',
      label: 'Test',
      panels: {},
      layouts: [],
    };

    registerContext(context);

    render(<TabBar />);

    const tabBar = screen.getByTestId('tab-bar');
    expect(tabBar).toHaveClass('h-8');
    expect(tabBar).toHaveClass('border-b');
    expect(tabBar).toHaveClass('border-border-subtle');
    expect(tabBar).toHaveClass('bg-bg-surface');
  });

  it('passes sidebarWidth to ContextTabs', () => {
    const { registerContext } = useCanvasStore.getState();

    const context: CanvasContextDescriptor = {
      id: 'test',
      label: 'Test',
      panels: {},
      layouts: [],
    };

    registerContext(context);

    // Mock MotionValue
    const mockSidebarWidth = { get: (): number => 300 };

    render(<TabBar sidebarWidth={mockSidebarWidth as never} />);

    const contextTabs = screen.getByTestId('context-tabs-mock');
    expect(contextTabs).toHaveAttribute('data-sidebar-width', 'true');
  });
});
