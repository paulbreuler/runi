/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Shared z-index for overlay content (Select, Menu, Popover, etc.).
 * Must be strictly greater than DataGrid sticky/pinned columns (max z-index 30)
 * so dropdowns and popovers render above the table header and pinned columns.
 */
export const OVERLAY_Z_INDEX = 1000;
