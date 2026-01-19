/**
 * @file DataGrid module barrel export
 * @description Exports all DataGrid components and utilities for external use
 *
 * This module provides a TanStack Table-based data grid with:
 * - Virtual scrolling for large datasets (10k+ rows)
 * - Row selection with checkboxes
 * - Row expansion with animated chevrons
 * - Header integration with DataPanelHeader
 *
 * @example
 * ```tsx
 * import {
 *   VirtualDataGrid,
 *   useDataGrid,
 *   createSelectionColumn,
 *   createExpanderColumn,
 * } from '@/components/DataGrid';
 * ```
 */

// Core components
export { VirtualDataGrid } from './VirtualDataGrid';
export type { VirtualDataGridProps } from './VirtualDataGrid';

export { DataGridHeader } from './DataGridHeader';
export type { DataGridHeaderProps } from './DataGridHeader';

// Hooks
export { useDataGrid } from './useDataGrid';
export type { UseDataGridOptions, UseDataGridReturn } from './useDataGrid';

// Column helpers
export { createSelectionColumn } from './columns/selectionColumn';
export type { SelectionColumnOptions } from './columns/selectionColumn';

export { createExpanderColumn } from './columns/expanderColumn';
export type { ExpanderColumnOptions } from './columns/expanderColumn';
