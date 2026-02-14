/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SignalDot } from './SignalDot';

describe('SignalDot', () => {
  describe('renders icon for each signal type', () => {
    it('renders verified signal icon', () => {
      render(<SignalDot type="verified" />);
      const icon = screen.getByTestId('signal-icon-verified');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-signal-success');
    });

    it('renders drift signal icon', () => {
      render(<SignalDot type="drift" />);
      const icon = screen.getByTestId('signal-icon-drift');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-signal-warning');
    });

    it('renders ai signal icon', () => {
      render(<SignalDot type="ai" />);
      const icon = screen.getByTestId('signal-icon-ai');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-signal-ai');
    });

    it('renders bound signal icon', () => {
      render(<SignalDot type="bound" />);
      const icon = screen.getByTestId('signal-icon-bound');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('text-accent-blue');
    });
  });

  describe('animations', () => {
    it('applies pulse animation for drift signal', () => {
      render(<SignalDot type="drift" />);
      const icon = screen.getByTestId('signal-icon-drift');
      expect(icon).toHaveClass('animate-pulse');
    });

    it('does not apply pulse animation for verified signal', () => {
      render(<SignalDot type="verified" />);
      const icon = screen.getByTestId('signal-icon-verified');
      expect(icon).not.toHaveClass('animate-pulse');
    });

    it('does not apply pulse animation for ai signal', () => {
      render(<SignalDot type="ai" />);
      const icon = screen.getByTestId('signal-icon-ai');
      expect(icon).not.toHaveClass('animate-pulse');
    });

    it('does not apply pulse animation for bound signal', () => {
      render(<SignalDot type="bound" />);
      const icon = screen.getByTestId('signal-icon-bound');
      expect(icon).not.toHaveClass('animate-pulse');
    });
  });

  describe('tooltip', () => {
    it('shows tooltip when provided', () => {
      render(<SignalDot type="verified" tooltip="Response verified" />);
      const icon = screen.getByTestId('signal-icon-verified');
      expect(icon).toHaveAttribute('title', 'Response verified');
    });

    it('does not have title attribute when tooltip is not provided', () => {
      render(<SignalDot type="verified" />);
      const icon = screen.getByTestId('signal-icon-verified');
      expect(icon).not.toHaveAttribute('title');
    });
  });

  describe('contains svg icon', () => {
    it('renders an svg element inside the signal', () => {
      render(<SignalDot type="verified" />);
      const icon = screen.getByTestId('signal-icon-verified');
      expect(icon.querySelector('svg')).toBeTruthy();
    });
  });
});
