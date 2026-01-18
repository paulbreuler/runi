import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DockControls } from './DockControls';
import { usePanelStore, DEFAULT_PANEL_SIZES } from '@/stores/usePanelStore';

describe('DockControls', () => {
  beforeEach(() => {
    // Reset store to initial state
    usePanelStore.setState({
      position: 'bottom',
      isVisible: true,
      isCollapsed: false,
      sizes: { ...DEFAULT_PANEL_SIZES },
      isPopout: false,
    });
  });

  describe('rendering', () => {
    it('renders position buttons', () => {
      render(<DockControls />);

      expect(screen.getByRole('button', { name: /dock bottom/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dock left/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dock right/i })).toBeInTheDocument();
    });

    it('renders pop-out button', () => {
      render(<DockControls />);

      expect(screen.getByRole('button', { name: /pop.?out/i })).toBeInTheDocument();
    });
  });

  describe('position changes', () => {
    it('changes position to left when left button is clicked', () => {
      render(<DockControls />);

      const leftButton = screen.getByRole('button', { name: /dock left/i });
      fireEvent.click(leftButton);

      expect(usePanelStore.getState().position).toBe('left');
    });

    it('changes position to right when right button is clicked', () => {
      render(<DockControls />);

      const rightButton = screen.getByRole('button', { name: /dock right/i });
      fireEvent.click(rightButton);

      expect(usePanelStore.getState().position).toBe('right');
    });

    it('changes position to bottom when bottom button is clicked', () => {
      usePanelStore.setState({ position: 'left' });

      render(<DockControls />);

      const bottomButton = screen.getByRole('button', { name: /dock bottom/i });
      fireEvent.click(bottomButton);

      expect(usePanelStore.getState().position).toBe('bottom');
    });
  });

  describe('current position highlighting', () => {
    it('highlights bottom button when position is bottom', () => {
      usePanelStore.setState({ position: 'bottom' });

      render(<DockControls />);

      const bottomButton = screen.getByRole('button', { name: /dock bottom/i });
      expect(bottomButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('highlights left button when position is left', () => {
      usePanelStore.setState({ position: 'left' });

      render(<DockControls />);

      const leftButton = screen.getByRole('button', { name: /dock left/i });
      expect(leftButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('highlights right button when position is right', () => {
      usePanelStore.setState({ position: 'right' });

      render(<DockControls />);

      const rightButton = screen.getByRole('button', { name: /dock right/i });
      expect(rightButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('does not highlight non-active positions', () => {
      usePanelStore.setState({ position: 'bottom' });

      render(<DockControls />);

      const leftButton = screen.getByRole('button', { name: /dock left/i });
      const rightButton = screen.getByRole('button', { name: /dock right/i });

      expect(leftButton).toHaveAttribute('aria-pressed', 'false');
      expect(rightButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('accessibility', () => {
    it('buttons have proper aria-label', () => {
      render(<DockControls />);

      expect(screen.getByRole('button', { name: /dock bottom/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dock left/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /dock right/i })).toBeInTheDocument();
    });

    it('button group has role group', () => {
      render(<DockControls />);

      const group = screen.getByRole('group');
      expect(group).toBeInTheDocument();
    });
  });
});
