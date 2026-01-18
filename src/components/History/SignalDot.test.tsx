import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SignalDot } from './SignalDot';

describe('SignalDot', () => {
  // Note: Basic signal type rendering is covered by IntelligenceSignals.test.tsx
  // These tests focus on SignalDot-specific behavior: sizes, animations, and styling

  describe('sizes', () => {
    it('renders small size by default', () => {
      render(<SignalDot type="verified" />);
      const dot = screen.getByTestId('signal-dot-verified');
      expect(dot).toHaveClass('w-2');
      expect(dot).toHaveClass('h-2');
    });

    it('renders medium size when specified', () => {
      render(<SignalDot type="verified" size="md" />);
      const dot = screen.getByTestId('signal-dot-verified');
      expect(dot).toHaveClass('w-2.5');
      expect(dot).toHaveClass('h-2.5');
    });

    it('renders large size when specified', () => {
      render(<SignalDot type="verified" size="lg" />);
      const dot = screen.getByTestId('signal-dot-verified');
      expect(dot).toHaveClass('w-3');
      expect(dot).toHaveClass('h-3');
    });
  });

  describe('animations', () => {
    it('applies pulse animation for drift signal', () => {
      render(<SignalDot type="drift" />);
      const dot = screen.getByTestId('signal-dot-drift');
      expect(dot).toHaveClass('animate-pulse');
    });

    it('does not apply pulse animation for verified signal', () => {
      render(<SignalDot type="verified" />);
      const dot = screen.getByTestId('signal-dot-verified');
      expect(dot).not.toHaveClass('animate-pulse');
    });

    it('does not apply pulse animation for ai signal', () => {
      render(<SignalDot type="ai" />);
      const dot = screen.getByTestId('signal-dot-ai');
      expect(dot).not.toHaveClass('animate-pulse');
    });

    it('does not apply pulse animation for bound signal', () => {
      render(<SignalDot type="bound" />);
      const dot = screen.getByTestId('signal-dot-bound');
      expect(dot).not.toHaveClass('animate-pulse');
    });
  });

  describe('tooltip', () => {
    it('shows tooltip when provided', () => {
      render(<SignalDot type="verified" tooltip="Response verified" />);
      const dot = screen.getByTestId('signal-dot-verified');
      expect(dot).toHaveAttribute('title', 'Response verified');
    });

    it('does not have title attribute when tooltip is not provided', () => {
      render(<SignalDot type="verified" />);
      const dot = screen.getByTestId('signal-dot-verified');
      expect(dot).not.toHaveAttribute('title');
    });
  });

  describe('styling', () => {
    it('applies glow effect for verified signal', () => {
      render(<SignalDot type="verified" />);
      const dot = screen.getByTestId('signal-dot-verified');
      expect(dot).toHaveClass('shadow-signal-success/40');
    });

    it('applies correct background color for verified', () => {
      render(<SignalDot type="verified" />);
      expect(screen.getByTestId('signal-dot-verified')).toHaveClass('bg-signal-success');
    });

    it('applies correct background color for drift', () => {
      render(<SignalDot type="drift" />);
      expect(screen.getByTestId('signal-dot-drift')).toHaveClass('bg-signal-warning');
    });

    it('applies correct background color for ai', () => {
      render(<SignalDot type="ai" />);
      expect(screen.getByTestId('signal-dot-ai')).toHaveClass('bg-signal-ai');
    });

    it('applies correct background color for bound', () => {
      render(<SignalDot type="bound" />);
      expect(screen.getByTestId('signal-dot-bound')).toHaveClass('bg-accent-blue');
    });
  });
});
