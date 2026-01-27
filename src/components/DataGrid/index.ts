/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

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
export type { VirtualDataGridProps, VirtualDataGridHandle } from './VirtualDataGrid';

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

// Network panel columns
export {
  createNetworkColumns,
  MethodCell,
  StatusCell,
  UrlCell,
  TimingCell,
  SizeCell,
  TimeAgoCell,
  ActionsCell,
} from './columns/networkColumns';

// Console panel columns
export {
  createConsoleColumns,
  LevelCell,
  MessageCell,
  TimestampCell,
  ConsoleActionsCell,
} from './columns/consoleColumns';

// Expansion components
export { ExpandedContent } from './ExpandedContent';
export type { ExpandedContentProps } from './ExpandedContent';

// Layout constants
export { COLUMN_WIDTHS, CELL_PADDING, EXPANDED_CONTENT_LEFT_MARGIN_PX } from './constants';
