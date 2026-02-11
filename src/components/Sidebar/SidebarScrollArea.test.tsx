/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarScrollArea } from './SidebarScrollArea';

describe('SidebarScrollArea', () => {
  it('renders children inside scroll viewport', () => {
    render(
      <SidebarScrollArea testId="test-scroll">
        <div data-test-id="child-content">Hello</div>
      </SidebarScrollArea>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders scroll root with testId', () => {
    render(
      <SidebarScrollArea testId="my-scroll">
        <div>Content</div>
      </SidebarScrollArea>
    );

    expect(screen.getByTestId('my-scroll-root')).toBeInTheDocument();
  });

  it('renders scrollbar element', () => {
    render(
      <SidebarScrollArea testId="my-scroll">
        <div>Content</div>
      </SidebarScrollArea>
    );

    expect(screen.getByTestId('my-scroll-scrollbar')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <SidebarScrollArea testId="my-scroll" className="custom-class">
        <div>Content</div>
      </SidebarScrollArea>
    );

    expect(screen.getByTestId('my-scroll-root').className).toContain('custom-class');
  });
});
