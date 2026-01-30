/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { DataPanel } from './DataPanel';

interface TestItem {
  id: string;
  name: string;
}

describe('DataPanel', () => {
  const testItems: TestItem[] = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' },
    { id: '3', name: 'Item 3' },
  ];

  const renderRow = (item: TestItem, index: number): React.ReactNode => (
    <div key={item.id} data-test-id={`row-${item.id}`} data-index={index}>
      {item.name}
    </div>
  );

  describe('row rendering', () => {
    it('renders all items using renderRow function', () => {
      render(<DataPanel items={testItems} renderRow={renderRow} />);

      expect(screen.getByTestId('row-1')).toBeInTheDocument();
      expect(screen.getByTestId('row-2')).toBeInTheDocument();
      expect(screen.getByTestId('row-3')).toBeInTheDocument();
    });

    it('passes correct index to renderRow', () => {
      render(<DataPanel items={testItems} renderRow={renderRow} />);

      expect(screen.getByTestId('row-1')).toHaveAttribute('data-index', '0');
      expect(screen.getByTestId('row-2')).toHaveAttribute('data-index', '1');
      expect(screen.getByTestId('row-3')).toHaveAttribute('data-index', '2');
    });

    it('renders empty when items is empty', () => {
      render(<DataPanel items={[]} renderRow={renderRow} />);

      expect(screen.queryByTestId('row-1')).not.toBeInTheDocument();
    });
  });

  describe('header rendering', () => {
    it('renders header when header config is provided', () => {
      render(
        <DataPanel
          items={testItems}
          renderRow={renderRow}
          header={{
            columns: [{ label: 'Name' }, { label: 'Action' }],
            allSelected: false,
            onSelectAllChange: () => {},
          }}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('does not render header when header config is not provided', () => {
      render(<DataPanel items={testItems} renderRow={renderRow} />);

      // No checkbox should be present
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('shows select all checkbox in header', () => {
      render(
        <DataPanel
          items={testItems}
          renderRow={renderRow}
          header={{
            columns: [{ label: 'Name' }],
            showSelectAll: true,
            allSelected: false,
            onSelectAllChange: () => {},
          }}
        />
      );

      expect(screen.getByRole('checkbox', { name: /select all/i })).toBeInTheDocument();
    });

    it('hides header when header.enabled is false', () => {
      render(
        <DataPanel
          items={testItems}
          renderRow={renderRow}
          header={{
            columns: [{ label: 'Name' }],
            allSelected: false,
            enabled: false,
            onSelectAllChange: () => {},
          }}
        />
      );

      expect(screen.queryByText('Name')).not.toBeInTheDocument();
    });

    it('calls onSelectAllChange when select all is toggled', () => {
      const onSelectAllChange = vi.fn();
      render(
        <DataPanel
          items={testItems}
          renderRow={renderRow}
          header={{
            columns: [{ label: 'Name' }],
            allSelected: false,
            onSelectAllChange,
          }}
        />
      );

      const checkbox = screen.getByRole('checkbox', { name: /select all/i });
      fireEvent.click(checkbox);

      expect(onSelectAllChange).toHaveBeenCalledWith(true);
    });
  });

  describe('empty state', () => {
    it('renders emptyState when items is empty', () => {
      render(
        <DataPanel
          items={[]}
          renderRow={renderRow}
          emptyState={<div data-test-id="empty-state">No items</div>}
        />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('does not render emptyState when items exist', () => {
      render(
        <DataPanel
          items={testItems}
          renderRow={renderRow}
          emptyState={<div data-test-id="empty-state">No items</div>}
        />
      );

      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });

  describe('showHeaderOnlyWhenItemsExist', () => {
    it('hides header when items is empty and showHeaderOnlyWhenItemsExist is true', () => {
      render(
        <DataPanel
          items={[]}
          renderRow={renderRow}
          showHeaderOnlyWhenItemsExist={true}
          header={{
            columns: [{ label: 'Name' }],
            allSelected: false,
            onSelectAllChange: () => {},
          }}
        />
      );

      expect(screen.queryByText('Name')).not.toBeInTheDocument();
    });

    it('shows header when items exist and showHeaderOnlyWhenItemsExist is true', () => {
      render(
        <DataPanel
          items={testItems}
          renderRow={renderRow}
          showHeaderOnlyWhenItemsExist={true}
          header={{
            columns: [{ label: 'Name' }],
            allSelected: false,
            onSelectAllChange: () => {},
          }}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('shows header when items is empty and showHeaderOnlyWhenItemsExist is false', () => {
      render(
        <DataPanel
          items={[]}
          renderRow={renderRow}
          showHeaderOnlyWhenItemsExist={false}
          header={{
            columns: [{ label: 'Name' }],
            allSelected: false,
            onSelectAllChange: () => {},
          }}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  describe('scroll ref', () => {
    it('forwards scrollRef to the scroll container', () => {
      const scrollRef = createRef<HTMLDivElement>();
      render(<DataPanel items={testItems} renderRow={renderRow} scrollRef={scrollRef} />);

      expect(scrollRef.current).toBeInstanceOf(HTMLDivElement);
      expect(scrollRef.current).toHaveClass('overflow-auto');
    });
  });

  describe('styling', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <DataPanel items={testItems} renderRow={renderRow} className="custom-panel-class" />
      );

      expect(container.firstChild).toHaveClass('custom-panel-class');
    });

    it('has correct base styling', () => {
      const { container } = render(<DataPanel items={testItems} renderRow={renderRow} />);

      const panel = container.firstChild as HTMLElement;
      expect(panel).toHaveClass('flex');
      expect(panel).toHaveClass('flex-col');
    });
  });

  describe('generic type support', () => {
    interface CustomItem {
      uuid: string;
      title: string;
      count: number;
    }

    const customItems: CustomItem[] = [
      { uuid: 'a', title: 'First', count: 10 },
      { uuid: 'b', title: 'Second', count: 20 },
    ];

    it('supports custom item types', () => {
      const customRenderRow = (item: CustomItem): React.ReactNode => (
        <div key={item.uuid} data-test-id={`custom-${item.uuid}`}>
          {item.title}: {item.count}
        </div>
      );

      render(<DataPanel items={customItems} renderRow={customRenderRow} />);

      expect(screen.getByTestId('custom-a')).toHaveTextContent('First: 10');
      expect(screen.getByTestId('custom-b')).toHaveTextContent('Second: 20');
    });
  });
});
