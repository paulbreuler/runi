/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ProtocolCell component
 * @description Renders HTTP protocol version badges with color coding
 */

import * as React from 'react';
import { cn } from '@/utils/cn';

interface ProtocolCellProps {
  protocol: string | null | undefined;
}

/**
 * Renders an HTTP protocol version badge with appropriate color styling.
 * HTTP/2 is displayed in blue, HTTP/1.1 and HTTP/1.0 are displayed in gray.
 *
 * @example
 * ```tsx
 * <ProtocolCell protocol="HTTP/2" />
 * <ProtocolCell protocol="HTTP/1.1" />
 * <ProtocolCell protocol={null} />
 * ```
 */
export const ProtocolCell = ({ protocol }: ProtocolCellProps): React.ReactElement => {
  if (protocol === null || protocol === undefined) {
    return (
      <div data-test-id="protocol-cell" className="text-xs text-text-muted">
        —
      </div>
    );
  }

  // HTTP/2 is blue, HTTP/1.x is gray
  const isHttp2 = protocol === 'HTTP/2';
  const colorClass = isHttp2 ? 'text-accent-blue' : 'text-text-muted';
  const bgClass = isHttp2 ? 'bg-accent-blue/10' : 'bg-text-muted/10';

  return (
    <span
      data-test-id="protocol-cell"
      className={cn('px-1.5 py-0.5 text-xs font-semibold rounded font-mono', colorClass, bgClass)}
    >
      {protocol}
    </span>
  );
};
