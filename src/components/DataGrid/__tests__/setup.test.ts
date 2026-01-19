/**
 * @file TanStack Table setup test
 * @description RED phase: Verify that @tanstack/react-table is properly installed
 *
 * This test will FAIL until @tanstack/react-table is installed.
 */

import { describe, it, expect } from 'vitest';

describe('TanStack Table Setup', () => {
  it('should be able to import useReactTable from @tanstack/react-table', async () => {
    // Dynamic import to test that the package exists
    const reactTable = await import('@tanstack/react-table');

    expect(reactTable).toBeDefined();
    expect(typeof reactTable.useReactTable).toBe('function');
  });

  it('should be able to import createColumnHelper from @tanstack/react-table', async () => {
    const reactTable = await import('@tanstack/react-table');

    expect(typeof reactTable.createColumnHelper).toBe('function');
  });

  it('should be able to import getCoreRowModel from @tanstack/react-table', async () => {
    const reactTable = await import('@tanstack/react-table');

    expect(typeof reactTable.getCoreRowModel).toBe('function');
  });

  it('should be able to import getExpandedRowModel from @tanstack/react-table', async () => {
    const reactTable = await import('@tanstack/react-table');

    expect(typeof reactTable.getExpandedRowModel).toBe('function');
  });

  it('should be able to import getFilteredRowModel from @tanstack/react-table', async () => {
    const reactTable = await import('@tanstack/react-table');

    expect(typeof reactTable.getFilteredRowModel).toBe('function');
  });

  it('should be able to import getSortedRowModel from @tanstack/react-table', async () => {
    const reactTable = await import('@tanstack/react-table');

    expect(typeof reactTable.getSortedRowModel).toBe('function');
  });

  it('should have @tanstack/react-virtual already installed for virtualization', async () => {
    const reactVirtual = await import('@tanstack/react-virtual');

    expect(reactVirtual).toBeDefined();
    expect(typeof reactVirtual.useVirtualizer).toBe('function');
  });
});
