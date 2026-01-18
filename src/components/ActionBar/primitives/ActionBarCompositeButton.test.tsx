import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Download, Save } from 'lucide-react';
import { ActionBarCompositeButton } from '../ActionBarCompositeButton';

describe('ActionBarCompositeButton', () => {
  const defaultPrimary = {
    label: 'Save Selected',
    icon: <Download size={12} />,
    onClick: vi.fn(),
  };

  const defaultOptions = [
    { label: 'Save Selected', icon: <Download size={12} />, onClick: vi.fn() },
    { label: 'Save All', icon: <Save size={12} />, onClick: vi.fn() },
  ];

  it('renders primary button with label', () => {
    render(<ActionBarCompositeButton primary={defaultPrimary} options={defaultOptions} />);

    expect(screen.getByRole('button', { name: 'Save Selected' })).toBeInTheDocument();
  });

  it('calls primary onClick when primary button is clicked', async () => {
    const handleClick = vi.fn();
    render(
      <ActionBarCompositeButton
        primary={{ ...defaultPrimary, onClick: handleClick }}
        options={defaultOptions}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save Selected' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when primary is disabled', async () => {
    const handleClick = vi.fn();
    render(
      <ActionBarCompositeButton
        primary={{ ...defaultPrimary, onClick: handleClick, disabled: true }}
        options={defaultOptions}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save Selected' }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('opens dropdown when dropdown trigger is clicked', async () => {
    render(<ActionBarCompositeButton primary={defaultPrimary} options={defaultOptions} />);

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));

    // Check dropdown menu appears
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Save Selected' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Save All' })).toBeInTheDocument();
  });

  it('calls option onClick when menu item is clicked', async () => {
    const handleSaveAll = vi.fn();
    render(
      <ActionBarCompositeButton
        primary={defaultPrimary}
        options={[...defaultOptions.slice(0, 1), { label: 'Save All', onClick: handleSaveAll }]}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Save All' }));

    expect(handleSaveAll).toHaveBeenCalledTimes(1);
  });

  it('closes dropdown after option is clicked', async () => {
    render(<ActionBarCompositeButton primary={defaultPrimary} options={defaultOptions} />);

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Save All' }));

    // Menu should close
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <span data-testid="outside">Outside</span>
        <ActionBarCompositeButton primary={defaultPrimary} options={defaultOptions} />
      </div>
    );

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.click(screen.getByTestId('outside'));

    // Menu should close
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes dropdown when escape is pressed', async () => {
    render(<ActionBarCompositeButton primary={defaultPrimary} options={defaultOptions} />);

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');

    // Menu should close
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders only icon button in icon mode', () => {
    render(
      <ActionBarCompositeButton
        primary={defaultPrimary}
        options={defaultOptions}
        displayVariant="icon"
      />
    );

    // Should show only one button with the icon (no dropdown in icon mode)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0]).toHaveAttribute('aria-label', 'Save Selected');
  });

  it('applies variant styles correctly', () => {
    const { rerender } = render(
      <ActionBarCompositeButton
        primary={defaultPrimary}
        options={defaultOptions}
        variant="default"
      />
    );

    let primaryButton = screen.getByRole('button', { name: 'Save Selected' });
    expect(primaryButton).toHaveClass('bg-accent-blue');

    rerender(
      <ActionBarCompositeButton
        primary={defaultPrimary}
        options={defaultOptions}
        variant="outline"
      />
    );

    primaryButton = screen.getByRole('button', { name: 'Save Selected' });
    expect(primaryButton).toHaveClass('bg-bg-surface');
  });

  it('disables individual options when specified', async () => {
    const handleClick = vi.fn();
    render(
      <ActionBarCompositeButton
        primary={defaultPrimary}
        options={[
          { label: 'Enabled', onClick: handleClick },
          { label: 'Disabled', onClick: handleClick, disabled: true },
        ]}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'More options' }));

    // Click disabled option
    await userEvent.click(screen.getByRole('menuitem', { name: 'Disabled' }));
    expect(handleClick).not.toHaveBeenCalled();

    // Click enabled option
    await userEvent.click(screen.getByRole('menuitem', { name: 'Enabled' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
