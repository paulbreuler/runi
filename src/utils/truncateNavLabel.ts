/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

const maxNavLabelLength = 120;

/** Truncate a navigation label to a max length, appending ellipsis if needed. */
export const truncateNavLabel = (label: string, maxLength = maxNavLabelLength): string => {
  if (maxLength <= 0) {
    return '';
  }
  if (label.length <= maxLength) {
    return label;
  }
  if (maxLength <= 3) {
    return label.slice(0, maxLength);
  }
  return `${label.slice(0, maxLength - 3)}...`;
};
