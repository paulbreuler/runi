/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { cn } from '@/utils/cn';
import {
  methodTextColors,
  methodBgColors,
  statusRangeColors,
  intelligenceColors,
  type HttpMethod,
  type StatusRange,
  type IntelligenceSignal,
} from '@/utils/http-colors';

/**
 * Option type for HTTP method select.
 */
export interface MethodSelectOption {
  value: 'ALL' | HttpMethod;
  label: string;
}

/**
 * Option type for status range select.
 */
export interface StatusSelectOption {
  value: string;
  label: string;
  range?: StatusRange;
}

/**
 * Option type for intelligence signal select.
 */
export interface IntelligenceSelectOption {
  value: string;
  label: string;
  signal?: IntelligenceSignal;
}

/**
 * Renders a method option with colored badge styling.
 * "ALL" is rendered as plain text, methods are rendered as colored badges.
 */
export const renderMethodOption = (option: MethodSelectOption): React.ReactNode => {
  if (option.value === 'ALL') {
    return <span className="text-text-secondary">{option.label}</span>;
  }

  const method = option.value;
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 text-xs font-semibold rounded font-mono',
        methodTextColors[method],
        methodBgColors[method]
      )}
    >
      {option.value}
    </span>
  );
};

/**
 * Renders a status option with colored dot and text.
 * Options without a range are rendered as plain text.
 */
export const renderStatusOption = (option: StatusSelectOption): React.ReactNode => {
  if (option.range === undefined) {
    return <span className="text-text-secondary">{option.label}</span>;
  }

  const colors = statusRangeColors[option.range];
  return (
    <span className="flex items-center gap-2">
      <span className={cn('w-2 h-2 rounded-full shrink-0', colors.dot)} />
      <span className={colors.text}>{option.label}</span>
    </span>
  );
};

/**
 * Renders an intelligence option with colored dot and text.
 * Options without a signal are rendered as plain text.
 */
export const renderIntelligenceOption = (option: IntelligenceSelectOption): React.ReactNode => {
  if (option.signal === undefined) {
    return <span className="text-text-secondary">{option.label}</span>;
  }

  const colors = intelligenceColors[option.signal];
  return (
    <span className="flex items-center gap-2">
      <span className={cn('w-2 h-2 rounded-full shrink-0', colors.dot)} />
      <span className={colors.text}>{option.label}</span>
    </span>
  );
};
