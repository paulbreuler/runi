/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SuggestionPanel } from './SuggestionPanel';
import type { Suggestion } from '@/types/generated/Suggestion';

// Mock motion/react to avoid animation issues in tests
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>): React.JSX.Element => {
      const {
        layout: _layout,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        ...rest
      } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }): React.JSX.Element => (
    <>{children}</>
  ),
  useReducedMotion: (): boolean => false,
}));

const PENDING_SUGGESTION: Suggestion = {
  id: 'sug-1',
  suggestionType: 'drift_fix',
  title: 'Schema drift on GET /users',
  description: 'Response includes undocumented field avatar_url',
  status: 'pending',
  source: 'claude-3.5-sonnet',
  collectionId: 'col-1',
  requestId: 'req-1',
  endpoint: 'GET /users',
  action: 'Update spec to include avatar_url',
  createdAt: '2026-01-01T00:00:00Z',
  resolvedAt: null,
};

const ACCEPTED_SUGGESTION: Suggestion = {
  id: 'sug-2',
  suggestionType: 'test_gap',
  title: 'Missing auth tests',
  description: 'No coverage for /auth endpoint',
  status: 'accepted',
  source: 'claude',
  collectionId: null,
  requestId: null,
  endpoint: 'POST /auth',
  action: 'Add test',
  createdAt: '2026-01-02T00:00:00Z',
  resolvedAt: '2026-01-03T00:00:00Z',
};

describe('SuggestionPanel', () => {
  const defaultProps = {
    suggestions: [] as Suggestion[],
    onAccept: vi.fn(),
    onDismiss: vi.fn(),
  };

  it('renders empty state when no suggestions', () => {
    render(<SuggestionPanel {...defaultProps} />);
    expect(screen.getByTestId('suggestion-empty-state')).toBeDefined();
    expect(screen.getByTestId('suggestion-empty-state').textContent).toContain(
      'No suggestions yet'
    );
  });

  it('renders suggestion panel with header', () => {
    render(<SuggestionPanel {...defaultProps} />);
    expect(screen.getByTestId('suggestion-panel')).toBeDefined();
    expect(screen.getByTestId('suggestion-panel-header')).toBeDefined();
    expect(screen.getByTestId('suggestion-panel-header').textContent).toContain(
      'Vigilance Monitor'
    );
  });

  it('renders pending count badge', () => {
    render(
      <SuggestionPanel {...defaultProps} suggestions={[PENDING_SUGGESTION, ACCEPTED_SUGGESTION]} />
    );
    const badge = screen.getByTestId('suggestion-count-badge');
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe('1');
  });

  it('does not show badge when no pending suggestions', () => {
    render(<SuggestionPanel {...defaultProps} suggestions={[ACCEPTED_SUGGESTION]} />);
    expect(screen.queryByTestId('suggestion-count-badge')).toBeNull();
  });

  it('renders suggestion cards', () => {
    render(<SuggestionPanel {...defaultProps} suggestions={[PENDING_SUGGESTION]} />);
    expect(screen.getByTestId('suggestion-card-sug-1')).toBeDefined();
    expect(screen.getByTestId('suggestion-title-sug-1')).toBeDefined();
    expect(screen.getByTestId('suggestion-title-sug-1').textContent).toBe(
      'Schema drift on GET /users'
    );
  });

  it('renders type label and icon', () => {
    render(<SuggestionPanel {...defaultProps} suggestions={[PENDING_SUGGESTION]} />);
    expect(screen.getByTestId('suggestion-type-label-sug-1')).toBeDefined();
    expect(screen.getByTestId('suggestion-type-label-sug-1').textContent).toBe('Drift');
  });

  it('renders accept and dismiss buttons for pending suggestions', () => {
    render(<SuggestionPanel {...defaultProps} suggestions={[PENDING_SUGGESTION]} />);
    expect(screen.getByTestId('suggestion-accept-sug-1')).toBeDefined();
    expect(screen.getByTestId('suggestion-dismiss-sug-1')).toBeDefined();
  });

  it('does not render action buttons for resolved suggestions', () => {
    render(<SuggestionPanel {...defaultProps} suggestions={[ACCEPTED_SUGGESTION]} />);
    expect(screen.queryByTestId('suggestion-accept-sug-2')).toBeNull();
    expect(screen.queryByTestId('suggestion-dismiss-sug-2')).toBeNull();
  });

  it('calls onAccept when accept button clicked', () => {
    const onAccept = vi.fn();
    render(
      <SuggestionPanel {...defaultProps} onAccept={onAccept} suggestions={[PENDING_SUGGESTION]} />
    );
    fireEvent.click(screen.getByTestId('suggestion-accept-sug-1'));
    expect(onAccept).toHaveBeenCalledWith('sug-1');
  });

  it('calls onDismiss when dismiss button clicked', () => {
    const onDismiss = vi.fn();
    render(
      <SuggestionPanel {...defaultProps} onDismiss={onDismiss} suggestions={[PENDING_SUGGESTION]} />
    );
    fireEvent.click(screen.getByTestId('suggestion-dismiss-sug-1'));
    expect(onDismiss).toHaveBeenCalledWith('sug-1');
  });

  it('renders context link when endpoint is provided', () => {
    const onNavigate = vi.fn();
    render(
      <SuggestionPanel
        {...defaultProps}
        onNavigate={onNavigate}
        suggestions={[PENDING_SUGGESTION]}
      />
    );
    const link = screen.getByTestId('suggestion-context-link-sug-1');
    expect(link).toBeDefined();
    expect(link.textContent).toBe('GET /users');
  });

  it('calls onNavigate when context link clicked', () => {
    const onNavigate = vi.fn();
    render(
      <SuggestionPanel
        {...defaultProps}
        onNavigate={onNavigate}
        suggestions={[PENDING_SUGGESTION]}
      />
    );
    fireEvent.click(screen.getByTestId('suggestion-context-link-sug-1'));
    expect(onNavigate).toHaveBeenCalledWith(PENDING_SUGGESTION);
  });

  it('renders action description', () => {
    render(<SuggestionPanel {...defaultProps} suggestions={[PENDING_SUGGESTION]} />);
    expect(screen.getByTestId('suggestion-action-sug-1').textContent).toContain(
      'Update spec to include avatar_url'
    );
  });

  it('has proper ARIA attributes', () => {
    render(<SuggestionPanel {...defaultProps} />);
    const panel = screen.getByTestId('suggestion-panel');
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.getAttribute('aria-label')).toBe('AI Suggestions');
  });

  it('has ARIA labels on action buttons', () => {
    render(<SuggestionPanel {...defaultProps} suggestions={[PENDING_SUGGESTION]} />);
    const acceptBtn = screen.getByTestId('suggestion-accept-sug-1');
    expect(acceptBtn.getAttribute('aria-label')).toBe(
      'Accept suggestion: Schema drift on GET /users'
    );
  });

  it('displays error banner when error is set', () => {
    render(<SuggestionPanel {...defaultProps} error="Failed to fetch suggestions" />);
    const errorBanner = screen.getByTestId('suggestion-error');
    expect(errorBanner).toBeDefined();
    expect(errorBanner.textContent).toBe('Failed to fetch suggestions');
    expect(errorBanner.getAttribute('role')).toBe('alert');
  });

  it('does not display error banner when error is null', () => {
    render(<SuggestionPanel {...defaultProps} error={null} />);
    expect(screen.queryByTestId('suggestion-error')).toBeNull();
  });
});
