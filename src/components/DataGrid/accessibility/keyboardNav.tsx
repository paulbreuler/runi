/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Keyboard navigation utilities
 * @description Keyboard navigation handlers for DataGrid interactive elements
 *
 * Provides keyboard navigation support for:
 * - Tab/Shift+Tab: Navigate through interactive elements (checkboxes, expander buttons)
 * - Enter: Expand/collapse rows (on expander buttons)
 * - Space: Select rows (on checkboxes, handled by Radix)
 * - Arrow keys: Navigate between interactive elements in adjacent rows/cells
 *
 * IMPORTANT: Only interactive elements (checkboxes, buttons) are focusable.
 * Rows and cells are NOT focusable to prevent page scrolling on Space key.
 */

import * as React from 'react';

/**
 * Finds the next interactive element in the same column (for arrow navigation)
 */
function findNextInteractiveInColumn(
  currentElement: HTMLElement,
  direction: 'up' | 'down'
): HTMLElement | null {
  const currentRow = currentElement.closest('tr[data-row-id]');
  if (currentRow === null || !(currentRow instanceof HTMLTableRowElement)) {
    return null;
  }

  const currentCell = currentElement.closest('td');
  if (currentCell === null || !(currentCell instanceof HTMLTableCellElement)) {
    return null;
  }

  // Get the column index
  const cells = Array.from(currentRow.cells);
  const columnIndex = cells.indexOf(currentCell);

  // Find the next/previous row
  const targetRow =
    direction === 'down' ? currentRow.nextElementSibling : currentRow.previousElementSibling;

  if (
    targetRow === null ||
    !(targetRow instanceof HTMLTableRowElement) ||
    !targetRow.hasAttribute('data-row-id')
  ) {
    return null;
  }

  // Get the cell in the same column
  const targetCell = targetRow.cells[columnIndex];
  if (!(targetCell instanceof HTMLTableCellElement)) {
    return null;
  }

  // Find the first interactive element in that cell (checkbox, button, etc.)
  const interactiveElement = targetCell.querySelector<HTMLElement>(
    'input[type="checkbox"], button, [role="checkbox"], [role="button"]'
  );

  return interactiveElement;
}

/**
 * Finds the next interactive element in the same row (for arrow navigation)
 */
function findNextInteractiveInRow(
  currentElement: HTMLElement,
  direction: 'left' | 'right'
): HTMLElement | null {
  const currentRow = currentElement.closest('tr[data-row-id]');
  if (currentRow === null || !(currentRow instanceof HTMLTableRowElement)) {
    return null;
  }

  const currentCell = currentElement.closest('td');
  if (currentCell === null || !(currentCell instanceof HTMLTableCellElement)) {
    return null;
  }

  // Find the next/previous cell
  const cells = Array.from(currentRow.cells);
  const currentIndex = cells.indexOf(currentCell);
  const targetIndex = direction === 'right' ? currentIndex + 1 : currentIndex - 1;

  if (targetIndex < 0 || targetIndex >= cells.length) {
    return null;
  }

  const targetCell = cells[targetIndex];
  if (!(targetCell instanceof HTMLTableCellElement)) {
    return null;
  }

  // Find the first interactive element in that cell
  const interactiveElement = targetCell.querySelector<HTMLElement>(
    'input[type="checkbox"], button, [role="checkbox"], [role="button"]'
  );

  return interactiveElement;
}

/**
 * Keyboard event handler for interactive elements (checkboxes, expander buttons)
 * Handles arrow key navigation between interactive elements
 */
export function useKeyboardNavInteractive(): {
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
} {
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLElement>): void => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        e.stopPropagation();
        const nextElement = findNextInteractiveInColumn(e.currentTarget, 'down');
        if (nextElement !== null) {
          nextElement.focus();
        }
        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        e.stopPropagation();
        const prevElement = findNextInteractiveInColumn(e.currentTarget, 'up');
        if (prevElement !== null) {
          prevElement.focus();
        }
        break;
      }

      case 'ArrowRight': {
        e.preventDefault();
        e.stopPropagation();
        const nextElement = findNextInteractiveInRow(e.currentTarget, 'right');
        if (nextElement !== null) {
          nextElement.focus();
        }
        break;
      }

      case 'ArrowLeft': {
        e.preventDefault();
        e.stopPropagation();
        const prevElement = findNextInteractiveInRow(e.currentTarget, 'left');
        if (prevElement !== null) {
          prevElement.focus();
        }
        break;
      }

      default:
        break;
    }
  }, []);

  return {
    onKeyDown: handleKeyDown,
  };
}

/**
 * Keyboard event handler for expander buttons
 */
export function useKeyboardNavExpander({ onToggleExpand }: { onToggleExpand: () => void }): {
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
} {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onToggleExpand();
      }
    },
    [onToggleExpand]
  );

  return {
    onKeyDown: handleKeyDown,
  };
}

// Note: Selection checkboxes use Radix UI Checkbox which already handles Space key
// No additional keyboard handler needed
