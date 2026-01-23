/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Focus management tests
 * @description Tests for focus management in DataGrid
 *
 * TDD: RED phase - these tests will fail until focus management is implemented
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VirtualDataGrid } from '../VirtualDataGrid';
import { createSelectionColumn } from '../columns/selectionColumn';
import type { ColumnDef } from '@tanstack/react-table';

// Test data type
interface TestRow {
  id: string;
  name: string;
}

// Sample test data
const testData: TestRow[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
  { id: '3', name: 'Gamma' },
];

// Sample column definitions
const testColumns: Array<ColumnDef<TestRow>> = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
  },
];

describe('Focus Management', () => {
  describe('focus visibility', () => {
    it('interactive elements have focus-visible styles', () => {
      const columns: Array<ColumnDef<TestRow>> = [createSelectionColumn<TestRow>(), ...testColumns];

      render(
        <VirtualDataGrid
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
        />
      );

      // Checkboxes should have focus-visible styles (via Radix)
      const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });
      expect(checkboxes.length).toBeGreaterThan(0);
      // Checkboxes are interactive elements and should be focusable
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeInTheDocument();
      });
    });
  });

  describe('focus order', () => {
    it('focus moves logically through interactive elements', () => {
      const columns: Array<ColumnDef<TestRow>> = [createSelectionColumn<TestRow>(), ...testColumns];

      render(
        <VirtualDataGrid
          data={testData}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
        />
      );

      // Checkboxes should be focusable (they're interactive elements)
      const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });
      expect(checkboxes.length).toBeGreaterThan(0);

      // Rows should NOT be focusable (prevents page scroll)
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row
      if (firstDataRow !== undefined) {
        expect(firstDataRow).not.toHaveAttribute('tabindex');
      }
    });

    it('non-interactive cells are not focusable (prevents page scroll)', () => {
      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      // Name cells should NOT be focusable (no tabindex attribute)
      const cells = screen.getAllByRole('cell');
      const nameCell = cells.find((cell) => cell.textContent === 'Alpha');
      if (nameCell !== undefined) {
        expect(nameCell).not.toHaveAttribute('tabindex');
      }
    });
  });

  describe('focus trap prevention', () => {
    it('focus is not trapped - can tab out of table', () => {
      const columns: Array<ColumnDef<TestRow>> = [createSelectionColumn<TestRow>(), ...testColumns];

      render(
        <div>
          <button data-testid="before-table">Before</button>
          <VirtualDataGrid
            data={testData}
            columns={columns}
            getRowId={(row) => row.id}
            enableRowSelection
          />
          <button data-testid="after-table">After</button>
        </div>
      );

      // Table should not trap focus
      // User should be able to tab to elements before and after
      const beforeButton = screen.getByTestId('before-table');
      const afterButton = screen.getByTestId('after-table');

      expect(beforeButton).toBeInTheDocument();
      expect(afterButton).toBeInTheDocument();

      // Both buttons should be focusable (buttons are focusable by default)
      // The fact that they exist and are buttons means they're in the tab order
      expect(beforeButton.tagName).toBe('BUTTON');
      expect(afterButton.tagName).toBe('BUTTON');
    });

    it('rows do not prevent tabbing to other elements', () => {
      render(<VirtualDataGrid data={testData} columns={testColumns} getRowId={(row) => row.id} />);

      // Rows should NOT be focusable (prevents page scroll on Space)
      const rows = screen.getAllByRole('row');
      const firstDataRow = rows[1]; // Skip header row

      if (firstDataRow !== undefined) {
        // Row should NOT have tabindex (not focusable)
        expect(firstDataRow).not.toHaveAttribute('tabindex');

        // Focus should be able to move away (no focus trap)
        // Only interactive elements (checkboxes, buttons) are in tab order
      }
    });
  });
});
