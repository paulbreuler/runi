/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file SizeCell component
 * @description Renders response body size in human-readable format
 */

import * as React from 'react';

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${String(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface SizeCellProps {
  bytes: number;
}

/**
 * Renders response body size in human-readable format (B/KB/MB).
 *
 * @example
 * ```tsx
 * <SizeCell bytes={500} /> // "500 B"
 * <SizeCell bytes={2048} /> // "2.0 KB"
 * <SizeCell bytes={1048576} /> // "1.0 MB"
 * ```
 */
export const SizeCell = ({ bytes }: SizeCellProps): React.ReactElement => {
  return (
    <span className="text-xs font-mono text-text-muted" title={`${bytes.toLocaleString()} bytes`}>
      {formatSize(bytes)}
    </span>
  );
};
