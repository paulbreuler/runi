/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationTrayContent } from './NotificationTrayContent';

describe('NotificationTrayContent', () => {
  it('renders children with padding', () => {
    render(
      <NotificationTrayContent>
        <div>Test content</div>
      </NotificationTrayContent>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByTestId('notification-tray-content')).toHaveClass('p-2.5');
  });

  it('does not have grid layout (just padding)', () => {
    render(
      <NotificationTrayContent>
        <div>Content</div>
      </NotificationTrayContent>
    );

    const content = screen.getByTestId('notification-tray-content');
    expect(content).not.toHaveClass('grid');
  });
});
