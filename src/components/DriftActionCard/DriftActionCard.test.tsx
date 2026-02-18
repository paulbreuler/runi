import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { DriftActionCard } from './DriftActionCard';
import type { DriftSeverity } from '@/types/generated/DriftSeverity';
import type { DriftSuggestedAction } from '@/types/generated/DriftSuggestedAction';

const defaultActions: DriftSuggestedAction[] = [
  {
    actionType: 'update_spec',
    label: 'Update Spec',
    description: 'Update the spec to match the new version',
  },
  {
    actionType: 'fix_request',
    label: 'Fix Request',
    description: 'Update the request to match the spec',
  },
  {
    actionType: 'ignore',
    label: 'Ignore',
    description: 'Suppress this drift warning',
  },
];

const defaultProps = {
  method: 'GET',
  path: '/users',
  severity: 'warning' as DriftSeverity,
  description: 'Parameters changed: added limit parameter',
  actions: defaultActions,
  onAction: vi.fn(),
};

describe('DriftActionCard', () => {
  it('renders drift description and method/path', () => {
    render(<DriftActionCard {...defaultProps} />);

    expect(screen.getByTestId('drift-action-card')).toBeInTheDocument();
    expect(screen.getByTestId('drift-method')).toHaveTextContent('GET');
    expect(screen.getByTestId('drift-path')).toHaveTextContent('/users');
    expect(screen.getByTestId('drift-description')).toHaveTextContent(
      'Parameters changed: added limit parameter'
    );
  });

  it('renders severity badge', () => {
    render(<DriftActionCard {...defaultProps} />);

    const badge = screen.getByTestId('drift-severity');
    expect(badge).toHaveTextContent('warning');
  });

  it('renders all action buttons', () => {
    render(<DriftActionCard {...defaultProps} />);

    expect(screen.getByTestId('drift-action-update_spec')).toBeInTheDocument();
    expect(screen.getByTestId('drift-action-fix_request')).toBeInTheDocument();
    expect(screen.getByTestId('drift-action-ignore')).toBeInTheDocument();
  });

  it('calls onAction with correct action type when clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<DriftActionCard {...defaultProps} onAction={onAction} />);

    await user.click(screen.getByTestId('drift-action-update_spec'));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith('update_spec');
  });

  it('calls onAction for fix_request', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<DriftActionCard {...defaultProps} onAction={onAction} />);

    await user.click(screen.getByTestId('drift-action-fix_request'));
    expect(onAction).toHaveBeenCalledWith('fix_request');
  });

  it('calls onAction for ignore', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<DriftActionCard {...defaultProps} onAction={onAction} />);

    await user.click(screen.getByTestId('drift-action-ignore'));
    expect(onAction).toHaveBeenCalledWith('ignore');
  });

  it('renders with breaking severity', () => {
    render(<DriftActionCard {...defaultProps} severity="breaking" />);

    const badge = screen.getByTestId('drift-severity');
    expect(badge).toHaveTextContent('breaking');
  });

  it('renders resolved state when resolved is true', () => {
    render(<DriftActionCard {...defaultProps} resolved />);

    expect(screen.getByTestId('drift-action-card')).toBeInTheDocument();
    expect(screen.getByTestId('drift-resolved-indicator')).toBeInTheDocument();
  });

  it('disables action buttons when resolved', () => {
    render(<DriftActionCard {...defaultProps} resolved />);

    const button = screen.getByTestId('drift-action-update_spec');
    expect(button).toBeDisabled();
  });

  it('supports keyboard navigation to action buttons', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<DriftActionCard {...defaultProps} onAction={onAction} />);

    await user.tab();
    await user.tab();
    await user.tab();
    // One of the buttons should be focused
    const updateBtn = screen.getByTestId('drift-action-update_spec');
    const fixBtn = screen.getByTestId('drift-action-fix_request');
    const ignoreBtn = screen.getByTestId('drift-action-ignore');

    const focusedElement = document.activeElement;
    const isActionFocused =
      focusedElement === updateBtn || focusedElement === fixBtn || focusedElement === ignoreBtn;
    expect(isActionFocused).toBe(true);
  });

  it('renders with only two actions (added operation)', () => {
    const addedActions: DriftSuggestedAction[] = [
      {
        actionType: 'update_spec',
        label: 'Update Spec',
        description: 'Accept this new endpoint into the spec',
      },
      {
        actionType: 'ignore',
        label: 'Ignore',
        description: 'Suppress this drift warning',
      },
    ];

    render(<DriftActionCard {...defaultProps} actions={addedActions} />);

    expect(screen.getByTestId('drift-action-update_spec')).toBeInTheDocument();
    expect(screen.getByTestId('drift-action-ignore')).toBeInTheDocument();
    expect(screen.queryByTestId('drift-action-fix_request')).not.toBeInTheDocument();
  });
});
