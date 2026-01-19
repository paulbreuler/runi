import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DataPanelHeader } from './DataPanelHeader';

describe('DataPanelHeader', () => {
  const defaultColumns = [
    { label: 'Level', className: 'text-xs' },
    { label: 'Message', className: 'flex-1 text-xs' },
    { label: 'Time', className: 'w-24 text-right text-xs' },
  ];

  describe('rendering', () => {
    it('renders column labels', () => {
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          onSelectAllChange={() => {}}
        />
      );

      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByText('Message')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('renders with custom className on columns', () => {
      render(
        <DataPanelHeader
          columns={[{ label: 'Test', className: 'custom-column-class' }]}
          allSelected={false}
          onSelectAllChange={() => {}}
        />
      );

      const column = screen.getByText('Test');
      expect(column).toHaveClass('custom-column-class');
    });

    it('renders with width on columns', () => {
      render(
        <DataPanelHeader
          columns={[{ label: 'Test', width: 'w-32' }]}
          allSelected={false}
          onSelectAllChange={() => {}}
        />
      );

      const column = screen.getByText('Test');
      expect(column).toHaveClass('w-32');
    });

    it('does not render when enabled is false', () => {
      const { container } = render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          onSelectAllChange={() => {}}
          enabled={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders when enabled is true', () => {
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          onSelectAllChange={() => {}}
          enabled={true}
        />
      );

      expect(screen.getByText('Level')).toBeInTheDocument();
    });

    it('renders when enabled is undefined (default true)', () => {
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          onSelectAllChange={() => {}}
        />
      );

      expect(screen.getByText('Level')).toBeInTheDocument();
    });
  });

  describe('select all checkbox', () => {
    it('shows select all checkbox when showSelectAll is true', () => {
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          showSelectAll={true}
          onSelectAllChange={() => {}}
        />
      );

      expect(screen.getByRole('checkbox', { name: /select all/i })).toBeInTheDocument();
    });

    it('hides select all checkbox when showSelectAll is false', () => {
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          showSelectAll={false}
          onSelectAllChange={() => {}}
        />
      );

      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('shows select all checkbox by default (showSelectAll undefined)', () => {
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          onSelectAllChange={() => {}}
        />
      );

      expect(screen.getByRole('checkbox', { name: /select all/i })).toBeInTheDocument();
    });

    it('checkbox is checked when allSelected is true', () => {
      render(
        <DataPanelHeader columns={defaultColumns} allSelected={true} onSelectAllChange={() => {}} />
      );

      const checkbox = screen.getByRole('checkbox', { name: /select all/i });
      expect(checkbox).toBeChecked();
    });

    it('checkbox is unchecked when allSelected is false', () => {
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          onSelectAllChange={() => {}}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /select all/i });
      expect(checkbox).not.toBeChecked();
    });

    it('checkbox is indeterminate when someSelected is true and allSelected is false', () => {
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          someSelected={true}
          onSelectAllChange={() => {}}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /select all/i });
      expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    });

    it('calls onSelectAllChange with true when checkbox is clicked (unchecked)', () => {
      const onSelectAllChange = vi.fn();
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          onSelectAllChange={onSelectAllChange}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(checkbox);

      expect(onSelectAllChange).toHaveBeenCalledWith(true);
    });

    it('calls onSelectAllChange with false when checkbox is clicked (checked)', () => {
      const onSelectAllChange = vi.fn();
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={true}
          onSelectAllChange={onSelectAllChange}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(checkbox);

      expect(onSelectAllChange).toHaveBeenCalledWith(false);
    });

    it('calls onSelectAllChange with true when indeterminate checkbox is clicked', () => {
      const onSelectAllChange = vi.fn();
      render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          someSelected={true}
          onSelectAllChange={onSelectAllChange}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(checkbox);

      expect(onSelectAllChange).toHaveBeenCalledWith(true);
    });
  });

  describe('children', () => {
    it('renders children content', () => {
      render(
        <DataPanelHeader columns={defaultColumns} allSelected={false} onSelectAllChange={() => {}}>
          <button>Extra Action</button>
        </DataPanelHeader>
      );

      expect(screen.getByRole('button', { name: /extra action/i })).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('has correct base styling', () => {
      const { container } = render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          onSelectAllChange={() => {}}
        />
      );

      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('flex');
      expect(header).toHaveClass('items-center');
      expect(header).toHaveClass('border-b');
    });

    it('applies custom className', () => {
      const { container } = render(
        <DataPanelHeader
          columns={defaultColumns}
          allSelected={false}
          onSelectAllChange={() => {}}
          className="custom-header-class"
        />
      );

      const header = container.firstChild as HTMLElement;
      expect(header).toHaveClass('custom-header-class');
    });
  });
});
