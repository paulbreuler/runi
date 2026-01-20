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
  /** Expander chevron column width (32px to match selection column for square appearance) */
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
 * Left margin (in pixels) needed for expanded content to align with
 * the first data column's content start.
 *
 * This accounts for:
 * - Selection column width (32px)
 * - Expander column width (32px)
 * - First data column's left padding (6px from px-3)
 *
 * Total: 32 + 32 + 6 = 70px
 *
 * Use this with inline styles: `style={{ marginLeft: \`${EXPANDED_CONTENT_LEFT_MARGIN_PX}px\` }}`
 */
export const EXPANDED_CONTENT_LEFT_MARGIN_PX =
  COLUMN_WIDTHS.SELECTION + COLUMN_WIDTHS.EXPANDER + CELL_PADDING.REGULAR; // 32 + 32 + 6 = 70px
