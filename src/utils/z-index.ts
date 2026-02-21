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
 * Z-index for toast notifications.
 * Must be above dialogs/modals (OVERLAY_Z_INDEX + 1) so toasts are always visible
 * even when a dialog with a backdrop-blur is open.
 */
export const TOAST_Z_INDEX = OVERLAY_Z_INDEX + 10;

/**
 * Shared z-index for the global command bar palette.
 * Must be topmost to ensure search visibility over all panels and overlays.
 */
export const COMMAND_BAR_Z_INDEX = OVERLAY_Z_INDEX + 100;

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
