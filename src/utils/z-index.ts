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

/**
 * Z-index for the status bar so it (and its metrics popover trigger) stay above
 * the dockable tray and any expanded row content. Just below OVERLAY_Z_INDEX so
 * popovers/modals still appear above the bar.
 */
export const STATUS_BAR_Z_INDEX = 999;

/**
 * Z-index for the dockable panel so it stacks below the status bar. Resizer
 * and other panel UI use higher values within this context (e.g. z-30).
 */
export const DOCKABLE_PANEL_Z_INDEX = 10;
