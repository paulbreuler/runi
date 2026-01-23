/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ARIA attributes tests
 * @description Tests for ARIA attributes in DataGrid
 *
 * TDD: RED phase - these tests will fail until ARIA attributes are implemented
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VirtualDataGrid } from '../VirtualDataGrid';
import { createSelectionColumn } from '../columns/selectionColumn';
import { createExpanderColumn } from '../columns/expanderColumn';
import type { ColumnDef } from '@tanstack/react-table';

// Test data type
interface TestRow {
  id: string;
  name: string;
  canExpand?: boolean;
}

// Sample test data
const testData: TestRow[] = [
  { id: '1', name: 'Alpha', canExpand: true },
  { id: '2', name: 'Beta', canExpand: false },
  { id: '3', name: 'Gamma', canExpand: true },
];

// Sample column definitions
const testColumns: Array<ColumnDef<TestRow>> = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
  },
];

describe('ARIA Attributes', () => {
  describe('table role', () => {
    it('table has role="table"', () => {
      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('row roles', () => {
    it('rows have role="row"', () => {
      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      const rows = screen.getAllByRole('row');
      // Should have header row + data rows
      expect(rows.length).toBeGreaterThan(1);

      // All rows should have role="row"
      rows.forEach((row) => {
        expect(row).toHaveAttribute('role', 'row');
      });
    });
  });

  describe('cell roles', () => {
    it('cells have role="cell"', () => {
      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBeGreaterThan(0);

      // All cells should have role="cell" (implicit for <td>)
      cells.forEach((cell) => {
        expect(cell.tagName).toBe('TD');
      });
    });
  });

  describe('header roles', () => {
    it('headers have role="columnheader"', () => {
      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);

      // All headers should have role="columnheader"
      headers.forEach((header) => {
        expect(header).toHaveAttribute('role', 'columnheader');
      });
    });
  });

  describe('expander buttons', () => {
    it('expand buttons have aria-expanded', () => {
      const columns: Array<ColumnDef<TestRow>> = [
        createExpanderColumn<TestRow>({
          canExpand: (row) => row.canExpand ?? false,
        }),
        ...testColumns,
      ];

      render(
        <VirtualDataGrid
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableExpanding
          getRowCanExpand={(row) => row.original.canExpand ?? false}
        />
      );

      const expanderButtons = screen.getAllByTestId('expand-button');
      expect(expanderButtons.length).toBeGreaterThan(0);

      expanderButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-expanded');
      });
    });

    it('expand buttons have aria-expanded="true" when expanded', () => {
      const columns: Array<ColumnDef<TestRow>> = [
        createExpanderColumn<TestRow>({
          canExpand: (row) => row.canExpand ?? false,
        }),
        ...testColumns,
      ];

      render(
        <VirtualDataGrid
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableExpanding
          initialExpanded={{ '1': true }}
          getRowCanExpand={(row) => row.original.canExpand ?? false}
        />
      );

      const expanderButtons = screen.getAllByTestId('expand-button');
      const firstButton = expanderButtons[0];
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('expand buttons have aria-expanded="false" when collapsed', () => {
      const columns: Array<ColumnDef<TestRow>> = [
        createExpanderColumn<TestRow>({
          canExpand: (row) => row.canExpand ?? false,
        }),
        ...testColumns,
      ];

      render(
        <VirtualDataGrid
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableExpanding
          getRowCanExpand={(row) => row.original.canExpand ?? false}
        />
      );

      const expanderButtons = screen.getAllByTestId('expand-button');
      const firstButton = expanderButtons[0];
      expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('checkboxes', () => {
    it('checkboxes have aria-label', () => {
      const columns: Array<ColumnDef<TestRow>> = [createSelectionColumn<TestRow>(), ...testColumns];

      render(
        <VirtualDataGrid
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
        />
      );

      const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });
      expect(checkboxes.length).toBeGreaterThan(0);

      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute('aria-label');
      });
    });

    it('header checkbox has aria-label for select all', () => {
      const columns: Array<ColumnDef<TestRow>> = [createSelectionColumn<TestRow>(), ...testColumns];

      render(
        <VirtualDataGrid
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
        />
      );

      const headerCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      expect(headerCheckbox).toHaveAttribute('aria-label');
    });
  });
});
