/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarDivider } from './SidebarDivider';

describe('SidebarDivider', () => {
  it('renders with role separator', () => {
    render(<SidebarDivider onDrag={vi.fn()} />);
    const divider = screen.getByTestId('sidebar-divider');
    expect(divider).toHaveAttribute('role', 'separator');
  });

  it('has horizontal aria-orientation', () => {
    render(<SidebarDivider onDrag={vi.fn()} />);
    const divider = screen.getByTestId('sidebar-divider');
    expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('has row-resize cursor', () => {
    render(<SidebarDivider onDrag={vi.fn()} />);
    const divider = screen.getByTestId('sidebar-divider');
    expect(divider.className).toContain('cursor-row-resize');
  });

  it('calls onDrag with deltaY during pointer drag', () => {
    const onDrag = vi.fn();
    render(<SidebarDivider onDrag={onDrag} />);
    const divider = screen.getByTestId('sidebar-divider');

    // Simulate pointer down at y=100
    fireEvent.pointerDown(divider, { clientY: 100, pointerId: 1 });
    // Simulate pointer move to y=150 (delta = 50)
    fireEvent.pointerMove(divider, { clientY: 150, pointerId: 1 });

    expect(onDrag).toHaveBeenCalledWith(50);
  });

  it('does not call onDrag without pointer down', () => {
    const onDrag = vi.fn();
    render(<SidebarDivider onDrag={onDrag} />);
    const divider = screen.getByTestId('sidebar-divider');

    fireEvent.pointerMove(divider, { clientY: 150, pointerId: 1 });

    expect(onDrag).not.toHaveBeenCalled();
  });

  it('calls onDragEnd on pointer up', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    render(<SidebarDivider onDrag={onDrag} onDragEnd={onDragEnd} />);
    const divider = screen.getByTestId('sidebar-divider');

    fireEvent.pointerDown(divider, { clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(divider, { clientY: 150, pointerId: 1 });

    expect(onDragEnd).toHaveBeenCalled();
  });

  it('applies custom testId', () => {
    render(<SidebarDivider onDrag={vi.fn()} testId="custom-divider" />);
    expect(screen.getByTestId('custom-divider')).toBeInTheDocument();
  });
});
