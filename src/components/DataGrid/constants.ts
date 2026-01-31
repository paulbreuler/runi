/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file DataGrid layout constants
 * @description Reusable constants for DataGrid component alignment and spacing
 *
 * These constants ensure consistent alignment across all DataGrid implementations
 * (Console, Network History, etc.) so that expanded content aligns properly
 * with the first data column.
 */

/**
 * Column widths (in pixels) for fixed-width columns.
 * These match the sizes defined in column helpers.
 */
export const COLUMN_WIDTHS = {
  /** Selection checkbox column width (32px for square appearance, matches natural checkbox size) */
  SELECTION: 32,
  /** Expander chevron column width (16px for compact chevron with 14px icon) */
  EXPANDER: 16,
} as const;

/**
 * Cell padding values (in pixels).
 * These match the padding classes used in VirtualDataGrid:
 * - Selection column: px-2 = 8px total = 4px per side (matches expander column)
 * - Expander column: px-2 = 8px total = 4px per side (equal spacing)
 * - Regular columns: px-3 = 12px total = 6px per side
 * - Method column: px-3 = 12px total = 6px per side (matches Console Level column)
 */
export const CELL_PADDING = {
  /** Selection column: px-2 = 8px total = 4px per side (matches expander column) */
  SELECTION_LEFT: 4,
  SELECTION_RIGHT: 4,
  /** Expander column: px-2 = 8px total = 4px per side (equal spacing) */
  EXPANDER: 4,
  /** Regular columns: px-3 = 12px total = 6px per side */
  REGULAR: 6,
  /** Method column: px-3 = 12px total = 6px per side (matches Console Level column) */
  METHOD: 6,
} as const;

/**
 * Left margin (in pixels) for expanded content.
 * Set to 0 so the expanded panel uses full available width (all the way left).
 *
 * Use this with inline styles: `style={{ marginLeft: \`${EXPANDED_CONTENT_LEFT_MARGIN_PX}px\` }}`
 */
export const EXPANDED_CONTENT_LEFT_MARGIN_PX = 0;

/**
 * Z-index hierarchy for DataGrid components.
 * Higher values appear above lower values.
 *
 * Hierarchy:
 * - HEADER_RIGHT (30): Table headers (right sticky columns) - topmost element
 * - HEADER_LEFT (25): Table headers (left sticky columns) - second highest
 * - CELL_RIGHT (10): Table body cells (right sticky columns)
 * - EXPANDED_PANEL (8): Expanded panel content - part of table body, scrolls under header
 * - CELL_LEFT (5): Table body cells (left sticky columns)
 *
 * The header must always be topmost so that table body content (including expanded panels)
 * scrolls underneath and is properly occluded by the header's background.
 */
export const Z_INDEX = {
  /** Table headers (right sticky columns) - topmost element, always above all content */
  HEADER_RIGHT: 30,
  /** Table headers (left sticky columns) - second highest, above all body content */
  HEADER_LEFT: 25,
  /** Table body cells (right sticky columns) */
  CELL_RIGHT: 10,
  /** Expanded panel content - part of table body, scrolls under header */
  EXPANDED_PANEL: 8,
  /** Table body cells (left sticky columns) */
  CELL_LEFT: 5,
} as const;
