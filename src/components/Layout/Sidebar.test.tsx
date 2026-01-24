/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders sidebar with proper structure', () => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toBeInTheDocument();
  });

  it('has Collections drawer section', () => {
    render(<Sidebar />);

    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByTestId('collections-drawer')).toBeInTheDocument();
  });

  it('drawer sections are collapsible', () => {
    render(<Sidebar />);

    // Collections drawer should be closed by default (collections not yet supported)
    const collectionsButton = screen.getByText('Collections').closest('button');
    if (collectionsButton === null) {
      throw new Error('Collections button not found');
    }
    expect(collectionsButton).toHaveAttribute('aria-expanded', 'false');

    // Click to expand
    fireEvent.click(collectionsButton);

    // Content should be visible - check aria-expanded
    expect(collectionsButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('No collections yet')).toBeInTheDocument();
  });

  it('displays empty states for collections when expanded', () => {
    render(<Sidebar />);

    // Expand the drawer first (it's collapsed by default)
    const collectionsButton = screen.getByText('Collections').closest('button');
    if (collectionsButton === null) {
      throw new Error('Collections button not found');
    }
    fireEvent.click(collectionsButton);

    expect(screen.getByText('No collections yet')).toBeInTheDocument();
  });

  it('uses EmptyState component with muted variant for collections', () => {
    const { container } = render(<Sidebar />);

    // Expand the drawer first (it's collapsed by default)
    const collectionsButton = screen.getByText('Collections').closest('button');
    if (collectionsButton === null) {
      throw new Error('Collections button not found');
    }
    fireEvent.click(collectionsButton);

    // Verify EmptyState is used (muted variant renders with text-text-muted/50 class)
    const emptyStateContent = container.querySelector('.text-text-muted\\/50');
    expect(emptyStateContent).toBeInTheDocument();
    expect(emptyStateContent?.textContent).toContain('No collections yet');
  });

  it('fills its container width', () => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toHaveClass('w-full');
  });

  it('has proper background styling', () => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toHaveClass('bg-bg-surface');
  });

  it('drawer headers have uppercase styling', () => {
    render(<Sidebar />);

    const collectionsTitle = screen.getByText('Collections');
    expect(collectionsTitle).toHaveClass('uppercase');
    expect(collectionsTitle).toHaveClass('tracking-wider');
  });
});
