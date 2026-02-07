/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

const MAX_NAV_LABEL_LENGTH = 120;

/**
 * Truncate a navigation label to a max length.
 * Appends ellipsis when truncating and maxLength > 3.
 */
export const truncateNavLabel = (label: string, maxLength = MAX_NAV_LABEL_LENGTH): string => {
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
