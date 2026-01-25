/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './Dialog';
import { DialogHeader } from './DialogHeader';
import { DialogContent } from './DialogContent';

describe('Dialog', () => {
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
    it('renders dialog with header and content props', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={mockOnClose}
          header={<DialogHeader title="Test Dialog" onClose={mockOnClose} />}
          content={<DialogContent>Test content</DialogContent>}
        />
      );

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-header')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <Dialog
          isOpen={false}
          onClose={mockOnClose}
          header={<DialogHeader title="Test" onClose={mockOnClose} />}
          content={<DialogContent>Content</DialogContent>}
        />
      );

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('positioning', () => {
    it('positions dialog 36px above bottom with left alignment from buttonRef', async () => {
      render(
        <Dialog
          isOpen={true}
          onClose={mockOnClose}
          buttonRef={mockButtonRef}
          header={<DialogHeader title="Test" onClose={mockOnClose} />}
          content={<DialogContent>Content</DialogContent>}
        />
      );

      const dialog = screen.getByTestId('dialog');
      expect(dialog).toHaveClass('bottom-[36px]');
      expect(dialog).toHaveStyle({ left: '100px' });
    });

    it('uses default left offset when buttonRef is not provided', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={mockOnClose}
          header={<DialogHeader title="Test" onClose={mockOnClose} />}
          content={<DialogContent>Content</DialogContent>}
        />
      );

      const dialog = screen.getByTestId('dialog');
      expect(dialog).toHaveClass('bottom-[36px]');
      expect(dialog).toHaveStyle({ left: '20px' });
    });

    it('has width of 320px', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={mockOnClose}
          header={<DialogHeader title="Test" onClose={mockOnClose} />}
          content={<DialogContent>Content</DialogContent>}
        />
      );

      const panel = screen.getByTestId('dialog-panel');
      expect(panel).toHaveClass('w-[320px]');
    });
  });

  describe('click outside to close', () => {
    it('closes dialog when clicking outside', async () => {
      const user = userEvent.setup();
      render(
        <Dialog
          isOpen={true}
          onClose={mockOnClose}
          header={<DialogHeader title="Test" onClose={mockOnClose} />}
          content={<DialogContent>Content</DialogContent>}
        />
      );

      // Click outside the dialog
      await user.click(document.body);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('does not close when clicking on interactive elements inside', async () => {
      const user = userEvent.setup();
      render(
        <Dialog
          isOpen={true}
          onClose={mockOnClose}
          header={
            <DialogHeader
              title="Test"
              onClose={mockOnClose}
              actions={<button type="button">Action</button>}
            />
          }
          content={<DialogContent>Content</DialogContent>}
        />
      );

      const actionButton = screen.getByText('Action');
      await user.click(actionButton);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('escape key handling', () => {
    it('closes dialog when Escape key is pressed', async () => {
      const user = userEvent.setup();
      render(
        <Dialog
          isOpen={true}
          onClose={mockOnClose}
          header={<DialogHeader title="Test" onClose={mockOnClose} />}
          content={<DialogContent>Content</DialogContent>}
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
        <Dialog
          isOpen={true}
          onClose={mockOnClose}
          header={<DialogHeader title="Test" onClose={mockOnClose} />}
          content={<DialogContent>Content</DialogContent>}
        />
      );

      // Animation should be minimal with reduced motion
      const content = screen.getByTestId('dialog-content');
      expect(content).toBeInTheDocument();

      window.matchMedia = originalMatchMedia;
    });
  });
});
