/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import type { JSX } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';

vi.mock('@/components/Sidebar/CollectionList', (): { CollectionList: () => JSX.Element } => ({
  CollectionList: (): JSX.Element => (
    <div data-test-id="collection-list-stub">No collections yet</div>
  ),
}));

describe('Sidebar', (): void => {
  it('renders sidebar with proper structure', (): void => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toBeInTheDocument();
  });

  it('has Collections drawer section', (): void => {
    render(<Sidebar />);

    expect(screen.getByText('Collections')).toBeInTheDocument();
    expect(screen.getByTestId('collections-drawer')).toBeInTheDocument();
  });

  it('drawer sections are open by default', (): void => {
    render(<Sidebar />);

    const collectionsButton = screen.getByText('Collections').closest('button');
    if (collectionsButton === null) {
      throw new Error('Collections button not found');
    }
    expect(collectionsButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('No collections yet')).toBeInTheDocument();
  });

  it('renders the collections list content', (): void => {
    render(<Sidebar />);
    expect(screen.getByTestId('collection-list-stub')).toBeInTheDocument();
  });

  it('fills its container width', (): void => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toHaveClass('w-full');
  });

  it('has proper background styling', (): void => {
    render(<Sidebar />);

    const sidebar = screen.getByTestId('sidebar-content');
    expect(sidebar).toHaveClass('bg-bg-surface');
  });

  it('drawer headers have uppercase styling', (): void => {
    render(<Sidebar />);

    const collectionsTitle = screen.getByText('Collections');
    expect(collectionsTitle).toHaveClass('uppercase');
    expect(collectionsTitle).toHaveClass('tracking-wider');
  });

  it('renders a scroll container for the drawer body', (): void => {
    const { container } = render(<Sidebar />);
    const scrollContainer = container.querySelector('[data-scroll-container]');
    expect(scrollContainer).toBeInTheDocument();
  });
});
