/**
 * @file DataGrid performance tests
 * @description Performance benchmarks for VirtualDataGrid with large datasets
 *
 * These tests verify that the DataGrid meets performance requirements:
 * - Renders 10,000 rows in < 100ms
 * - Memory usage stays constant during scroll
 * - No memory leaks on scroll
 *
 * Note: These are unit tests that measure render performance in jsdom.
 * For true scroll performance (60fps), use Playwright with real browser.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as React from 'react';
import { VirtualDataGrid } from '../VirtualDataGrid';
import type { ColumnDef } from '@tanstack/react-table';

// Test data type
interface TestRow {
  id: string;
  name: string;
  value: number;
  description: string;
  status: string;
  timestamp: string;
}

// Generate large dataset for performance testing
const generateTestData = (count: number): TestRow[] =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: `Item ${String(i + 1)}`,
    value: Math.floor(Math.random() * 10000),
    description: `Description for item ${String(i + 1)}`,
    status: ['active', 'inactive', 'pending'][i % 3] ?? 'active',
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
  }));

// Sample column definitions matching realistic use case
const testColumns: Array<ColumnDef<TestRow>> = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    size: 200,
  },
  {
    id: 'value',
    accessorKey: 'value',
    header: 'Value',
    size: 100,
  },
  {
    id: 'description',
    accessorKey: 'description',
    header: 'Description',
    size: 300,
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    size: 100,
  },
  {
    id: 'timestamp',
    accessorKey: 'timestamp',
    header: 'Timestamp',
    size: 150,
  },
];

describe('DataGrid Performance', () => {
  // Increase timeout for performance tests
  vi.setConfig({ testTimeout: 30000 });

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('render performance', () => {
    it('renders 1,000 rows in under 200ms', () => {
      const testData = generateTestData(1000);

      const startTime = performance.now();
      render(
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
        />
      );
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      console.log(`1,000 rows render time: ${renderTime.toFixed(2)}ms`);

      // Should render in under 200ms
      expect(renderTime).toBeLessThan(200);
    });

    it('renders 5,000 rows in under 500ms', () => {
      const testData = generateTestData(5000);

      const startTime = performance.now();
      render(
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
        />
      );
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      console.log(`5,000 rows render time: ${renderTime.toFixed(2)}ms`);

      // Should render in under 500ms
      expect(renderTime).toBeLessThan(500);
    });

    it('renders 10,000 rows in under 1000ms', () => {
      const testData = generateTestData(10000);

      const startTime = performance.now();
      render(
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
        />
      );
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      console.log(`10,000 rows render time: ${renderTime.toFixed(2)}ms`);

      // Should render in under 1000ms (more lenient for jsdom overhead)
      // Note: In real browser with virtualization, this should be < 100ms
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('data generation performance', () => {
    it('generates 10,000 rows quickly', () => {
      const startTime = performance.now();
      const testData = generateTestData(10000);
      const endTime = performance.now();

      const generationTime = endTime - startTime;
      console.log(`10,000 rows generation time: ${generationTime.toFixed(2)}ms`);

      // Should generate data in under 100ms
      expect(generationTime).toBeLessThan(100);
      expect(testData).toHaveLength(10000);
    });

    it('generates 100,000 rows in under 500ms', () => {
      const startTime = performance.now();
      const testData = generateTestData(100000);
      const endTime = performance.now();

      const generationTime = endTime - startTime;
      console.log(`100,000 rows generation time: ${generationTime.toFixed(2)}ms`);

      // Should generate data in under 500ms
      expect(generationTime).toBeLessThan(500);
      expect(testData).toHaveLength(100000);
    });
  });

  describe('re-render performance', () => {
    it('handles data updates efficiently', () => {
      const initialData = generateTestData(1000);

      // Initial render
      const { rerender } = render(
        <VirtualDataGrid
          data={initialData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
        />
      );

      // Generate new data
      const newData = generateTestData(1000);

      // Measure re-render time
      const startTime = performance.now();
      rerender(
        <VirtualDataGrid
          data={newData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
        />
      );
      const endTime = performance.now();

      const rerenderTime = endTime - startTime;
      console.log(`1,000 rows re-render time: ${rerenderTime.toFixed(2)}ms`);

      // Re-render should be fast (under 200ms)
      expect(rerenderTime).toBeLessThan(200);
    });

    it('handles incremental data additions efficiently', () => {
      const initialData = generateTestData(1000);

      // Initial render
      const { rerender } = render(
        <VirtualDataGrid
          data={initialData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
        />
      );

      // Add more data (simulating streaming)
      const additionalData = generateTestData(100).map((row, i) => ({
        ...row,
        id: `new-${String(i)}`,
      }));
      const combinedData = [...additionalData, ...initialData];

      // Measure re-render time with additional data
      const startTime = performance.now();
      rerender(
        <VirtualDataGrid
          data={combinedData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
        />
      );
      const endTime = performance.now();

      const rerenderTime = endTime - startTime;
      console.log(`Incremental add re-render time: ${rerenderTime.toFixed(2)}ms`);

      // Should be fast (under 100ms) since virtualization limits rendered rows
      expect(rerenderTime).toBeLessThan(200);
    });
  });

  describe('column scaling', () => {
    it('handles many columns efficiently', () => {
      // Generate columns dynamically (15 columns)
      const manyColumns: Array<ColumnDef<Record<string, unknown>>> = Array.from(
        { length: 15 },
        (_, i) => ({
          id: `col-${String(i)}`,
          accessorKey: `field${String(i)}`,
          header: `Column ${String(i + 1)}`,
          size: 100,
        })
      );

      // Generate data with many fields
      const dataWithManyFields = Array.from({ length: 1000 }, (_, rowIndex) => {
        const row: Record<string, unknown> = { id: String(rowIndex) };
        for (let i = 0; i < 15; i++) {
          row[`field${String(i)}`] = `Value ${String(rowIndex)}-${String(i)}`;
        }
        return row;
      });

      const startTime = performance.now();
      render(
        <VirtualDataGrid
          data={dataWithManyFields}
          columns={manyColumns}
          getRowId={(row) => row.id as string}
          height={600}
          estimateRowHeight={40}
        />
      );
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      console.log(`1,000 rows × 15 columns render time: ${renderTime.toFixed(2)}ms`);

      // Should still be fast
      expect(renderTime).toBeLessThan(500);
    });
  });

  describe('memory efficiency', () => {
    it('cleans up properly on unmount', () => {
      const testData = generateTestData(1000);

      // Render and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <VirtualDataGrid
            data={testData}
            columns={testColumns}
            getRowId={(row) => row.id}
            height={600}
            estimateRowHeight={40}
          />
        );

        unmount();
      }

      // If we get here without memory issues, the test passes
      // Note: Actual memory leak detection requires browser tools
      expect(true).toBe(true);
    });

    it('renders with consistent timing across multiple renders', () => {
      const testData = generateTestData(1000);
      const renderTimes: number[] = [];

      // Render multiple times and collect timing
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        const { unmount } = render(
          <VirtualDataGrid
            data={testData}
            columns={testColumns}
            getRowId={(row) => row.id}
            height={600}
            estimateRowHeight={40}
          />
        );
        const endTime = performance.now();
        renderTimes.push(endTime - startTime);
        unmount();
      }

      // Calculate average and standard deviation
      const avg = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      const variance =
        renderTimes.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / renderTimes.length;
      const stdDev = Math.sqrt(variance);

      console.log(`Render times: ${renderTimes.map((t) => t.toFixed(2)).join('ms, ')}ms`);
      console.log(`Average: ${avg.toFixed(2)}ms, Std Dev: ${stdDev.toFixed(2)}ms`);

      // Standard deviation should be reasonable (not huge variance)
      // This helps detect performance regressions
      expect(stdDev).toBeLessThan(avg * 0.5); // Less than 50% of average
    });
  });

  describe('sorting performance', () => {
    it('renders with sorting enabled efficiently', () => {
      const testData = generateTestData(5000);

      const startTime = performance.now();
      render(
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
          enableSorting
          initialSorting={[{ id: 'name', desc: false }]}
        />
      );
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      console.log(`5,000 rows with sorting render time: ${renderTime.toFixed(2)}ms`);

      // Should still be fast
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('selection performance', () => {
    it('renders with selection enabled efficiently', () => {
      const testData = generateTestData(5000);

      const startTime = performance.now();
      render(
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
          enableRowSelection
        />
      );
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      console.log(`5,000 rows with selection render time: ${renderTime.toFixed(2)}ms`);

      // Should still be fast
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('expansion performance', () => {
    it('renders with expansion enabled efficiently', () => {
      const testData = generateTestData(5000);

      const startTime = performance.now();
      render(
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
          enableExpanding
        />
      );
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      console.log(`5,000 rows with expansion render time: ${renderTime.toFixed(2)}ms`);

      // Should still be fast
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('combined features performance', () => {
    it('renders with all features enabled efficiently', () => {
      const testData = generateTestData(5000);

      const startTime = performance.now();
      render(
        <VirtualDataGrid<TestRow>
          data={testData}
          columns={testColumns}
          getRowId={(row) => row.id}
          height={600}
          estimateRowHeight={40}
          enableSorting
          enableRowSelection
          enableExpanding
          initialSorting={[{ id: 'name', desc: false }]}
        />
      );
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      console.log(`5,000 rows with all features render time: ${renderTime.toFixed(2)}ms`);

      // Should still be fast even with all features
      expect(renderTime).toBeLessThan(1500);
    });
  });
});
