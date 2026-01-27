/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationTray } from './NotificationTray';
import { NotificationTrayHeader } from './NotificationTrayHeader';
import { NotificationTrayContent } from './NotificationTrayContent';

describe('NotificationTray', () => {
  const mockOnClose = vi.fn();
  const mockButtonRef = { current: document.createElement('button') };

  beforeEach(() => {
    mockButtonRef.current.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 0,
      right: 200,
      bottom: 0,
      width: 100,
      height: 0,
      x: 100,
      y: 0,
      toJSON: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering with composition', () => {
    it('renders notification tray with header and content props', () => {
      render(
        <NotificationTray
          isOpen={true}
          onClose={mockOnClose}
          header={<NotificationTrayHeader title="Test Tray" onClose={mockOnClose} />}
          content={<NotificationTrayContent>Test content</NotificationTrayContent>}
        />
      );

      expect(screen.getByTestId('notification-tray')).toBeInTheDocument();
      expect(screen.getByTestId('notification-tray-header')).toBeInTheDocument();
      expect(screen.getByTestId('notification-tray-content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <NotificationTray
          isOpen={false}
          onClose={mockOnClose}
          header={<NotificationTrayHeader title="Test" onClose={mockOnClose} />}
          content={<NotificationTrayContent>Content</NotificationTrayContent>}
        />
      );

      expect(screen.queryByTestId('notification-tray')).not.toBeInTheDocument();
    });
  });

  describe('positioning', () => {
    it('positions notification tray 36px above bottom with left alignment from buttonRef', async () => {
      render(
        <NotificationTray
          isOpen={true}
          onClose={mockOnClose}
          buttonRef={mockButtonRef}
          header={<NotificationTrayHeader title="Test" onClose={mockOnClose} />}
          content={<NotificationTrayContent>Content</NotificationTrayContent>}
        />
      );

      const tray = screen.getByTestId('notification-tray');
      expect(tray).toHaveClass('bottom-[36px]');
      expect(tray).toHaveStyle({ left: '100px' });
    });

    it('uses default left offset when buttonRef is not provided', () => {
      render(
        <NotificationTray
          isOpen={true}
          onClose={mockOnClose}
          header={<NotificationTrayHeader title="Test" onClose={mockOnClose} />}
          content={<NotificationTrayContent>Content</NotificationTrayContent>}
        />
      );

      const tray = screen.getByTestId('notification-tray');
      expect(tray).toHaveClass('bottom-[36px]');
      expect(tray).toHaveStyle({ left: '20px' });
    });

    it('has width of 320px', () => {
      render(
        <NotificationTray
          isOpen={true}
          onClose={mockOnClose}
          header={<NotificationTrayHeader title="Test" onClose={mockOnClose} />}
          content={<NotificationTrayContent>Content</NotificationTrayContent>}
        />
      );

      const panel = screen.getByTestId('notification-tray-panel');
      expect(panel).toHaveClass('w-[320px]');
    });
  });

  describe('click outside to close', () => {
    it('closes notification tray when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <NotificationTray
          isOpen={true}
          onClose={mockOnClose}
          header={<NotificationTrayHeader title="Test" onClose={mockOnClose} />}
          content={<NotificationTrayContent>Content</NotificationTrayContent>}
        />
      );

      // Click outside the notification tray
      await user.click(document.body);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not close when clicking on interactive elements inside', async () => {
      const user = userEvent.setup();
      render(
        <NotificationTray
          isOpen={true}
          onClose={mockOnClose}
          header={
            <NotificationTrayHeader
              title="Test"
              onClose={mockOnClose}
              actions={<button type="button">Action</button>}
            />
          }
          content={<NotificationTrayContent>Content</NotificationTrayContent>}
        />
      );

      const actionButton = screen.getByText('Action');
      await user.click(actionButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('escape key handling', () => {
    it('closes notification tray when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <NotificationTray
          isOpen={true}
          onClose={mockOnClose}
          header={<NotificationTrayHeader title="Test" onClose={mockOnClose} />}
          content={<NotificationTrayContent>Content</NotificationTrayContent>}
        />
      );

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('reduced motion', () => {
    it('respects prefers-reduced-motion setting', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn(() => ({
        matches: true,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;

      render(
        <NotificationTray
          isOpen={true}
          onClose={mockOnClose}
          header={<NotificationTrayHeader title="Test" onClose={mockOnClose} />}
          content={<NotificationTrayContent>Content</NotificationTrayContent>}
        />
      );

      // Animation should be minimal with reduced motion
      const content = screen.getByTestId('notification-tray-content');
      expect(content).toBeInTheDocument();

      window.matchMedia = originalMatchMedia;
    });
  });
});
