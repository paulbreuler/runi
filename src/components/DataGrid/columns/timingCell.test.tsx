/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file TimingCell component tests
 * @description Tests for request timing cell component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TimingCell } from './timingCell';

describe('TimingCell', () => {
  describe('normal timing display', () => {
    it('renders timing in milliseconds', () => {
      render(<TimingCell totalMs={150} />);
      expect(screen.getByText('150ms')).toBeInTheDocument();
    });

    it('formats large timings correctly', () => {
      render(<TimingCell totalMs={1500} />);
      expect(screen.getByText('1500ms')).toBeInTheDocument();
    });

    it('uses monospace font', () => {
      render(<TimingCell totalMs={150} />);
      const element = screen.getByText('150ms');
      expect(element).toHaveClass('font-mono');
    });

    it('uses muted text color for normal requests', () => {
      render(<TimingCell totalMs={500} />);
      const element = screen.getByText('500ms');
      expect(element).toHaveClass('text-text-muted');
      expect(element).not.toHaveClass('text-signal-error');
    });
  });

  describe('slow request highlighting', () => {
    it('highlights slow requests (>1000ms) in red', () => {
      render(<TimingCell totalMs={1001} />);
      const element = screen.getByText('1001ms');
      expect(element).toHaveClass('text-signal-error');
      expect(element).not.toHaveClass('text-text-muted');
    });

    it('does not highlight exactly 1000ms requests (threshold is >1000)', () => {
      render(<TimingCell totalMs={1000} />);
      const element = screen.getByText('1000ms');
      expect(element).toHaveClass('text-text-muted');
      expect(element).not.toHaveClass('text-signal-error');
    });

    it('does not highlight requests at 1000ms threshold', () => {
      render(<TimingCell totalMs={999} />);
      const element = screen.getByText('999ms');
      expect(element).toHaveClass('text-text-muted');
      expect(element).not.toHaveClass('text-signal-error');
    });

    it('highlights very slow requests in red', () => {
      render(<TimingCell totalMs={5000} />);
      const element = screen.getByText('5000ms');
      expect(element).toHaveClass('text-signal-error');
    });
  });

  describe('streaming requests', () => {
    it('shows "..." for streaming requests when isStreaming prop is true', () => {
      render(<TimingCell totalMs={150} isStreaming />);
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.queryByText('150ms')).not.toBeInTheDocument();
    });

    it('shows "..." for streaming requests when totalMs is -1', () => {
      render(<TimingCell totalMs={-1} />);
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('shows "..." when both isStreaming and totalMs === -1', () => {
      render(<TimingCell totalMs={-1} isStreaming />);
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('uses monospace font for streaming indicator', () => {
      render(<TimingCell totalMs={-1} />);
      const element = screen.getByText('...');
      expect(element).toHaveClass('font-mono');
    });

    it('has title attribute for streaming indicator', () => {
      render(<TimingCell totalMs={-1} />);
      const element = screen.getByText('...');
      expect(element).toHaveAttribute('title', 'Streaming request');
    });
  });

  describe('blocked requests', () => {
    it('shows "—" for blocked requests when isBlocked prop is true', () => {
      render(<TimingCell totalMs={150} isBlocked />);
      expect(screen.getByText('—')).toBeInTheDocument();
      expect(screen.queryByText('150ms')).not.toBeInTheDocument();
    });

    it('shows "—" for blocked requests when totalMs is 0', () => {
      render(<TimingCell totalMs={0} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows "—" when both isBlocked and totalMs === 0', () => {
      render(<TimingCell totalMs={0} isBlocked />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('blocked state takes precedence over streaming', () => {
      render(<TimingCell totalMs={-1} isBlocked />);
      expect(screen.getByText('—')).toBeInTheDocument();
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('uses monospace font for blocked indicator', () => {
      render(<TimingCell totalMs={0} />);
      const element = screen.getByText('—');
      expect(element).toHaveClass('font-mono');
    });

    it('has title attribute for blocked indicator', () => {
      render(<TimingCell totalMs={0} />);
      const element = screen.getByText('—');
      expect(element).toHaveAttribute('title', 'Request was blocked');
    });
  });

  describe('title attributes', () => {
    it('has title attribute with timing value for normal requests', () => {
      render(<TimingCell totalMs={250} />);
      const element = screen.getByText('250ms');
      expect(element).toHaveAttribute('title', '250ms');
    });

    it('has title attribute for slow requests', () => {
      render(<TimingCell totalMs={1500} />);
      const element = screen.getByText('1500ms');
      expect(element).toHaveAttribute('title', '1500ms');
    });
  });
});
