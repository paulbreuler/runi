/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file UrlCell component
 * @description Renders URL with truncation and intelligence signals
 */

import * as React from 'react';
import type { IntelligenceInfo } from '@/types/history';
import { IntelligenceSignals } from '@/components/History/IntelligenceSignals';

interface UrlCellProps {
  url: string;
  intelligence?: IntelligenceInfo;
}

/**
 * Renders a URL with optional intelligence signals.
 * URLs are truncated with ellipsis and the full URL is available in the title attribute.
 *
 * @example
 * ```tsx
 * <UrlCell url="https://api.example.com/users" />
 * <UrlCell
 *   url="https://api.example.com/users"
 *   intelligence={{
 *     boundToSpec: true,
 *     specOperation: 'getUsers',
 *     drift: null,
 *     aiGenerated: false,
 *     verified: true,
 *   }}
 * />
 * ```
 */
export const UrlCell = ({ url, intelligence }: UrlCellProps): React.ReactElement => {
  return (
    <div className="flex-1 min-w-0 flex items-center gap-2">
      <span className="text-sm text-text-primary font-mono truncate" title={url}>
        {url}
      </span>
      {intelligence !== undefined && (
        <div data-test-id="intelligence-signals">
          <IntelligenceSignals intelligence={intelligence} />
        </div>
      )}
    </div>
  );
};
