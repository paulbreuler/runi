/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { CheckCircle, ArrowRightLeft, AlertTriangle, XCircle, ShieldCheck, Sparkles, Link } from 'lucide-react';
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
    return (
      <span className="text-text-secondary" data-test-id="method-option-all">
        {option.label}
      </span>
    );
  }

  const method = option.value;
  return (
    <span
      className={cn(
        'px-1.5 py-0.5 text-xs font-semibold rounded font-mono',
        methodTextColors[method],
        methodBgColors[method]
      )}
      data-test-id={`method-option-${method}`}
    >
      {option.value}
    </span>
  );
};

const statusRangeIcons: Record<StatusRange, React.ComponentType<{ size?: number; className?: string }>> = {
  '2xx': CheckCircle,
  '3xx': ArrowRightLeft,
  '4xx': AlertTriangle,
  '5xx': XCircle,
};

/**
 * Renders a status option with colored icon and text.
 * Options without a range are rendered as plain text.
 */
export const renderStatusOption = (option: StatusSelectOption): React.ReactNode => {
  if (option.range === undefined) {
    return (
      <span className="text-text-secondary" data-test-id="status-option-all">
        {option.label}
      </span>
    );
  }

  const colors = statusRangeColors[option.range];
  const Icon = statusRangeIcons[option.range];
  return (
    <span className="flex items-center gap-2" data-test-id={`status-option-${option.range}`}>
      <Icon size={12} className={cn('shrink-0', colors.icon)} />
      <span className={colors.text}>{option.label}</span>
    </span>
  );
};

const intelligenceIcons: Record<IntelligenceSignal, React.ComponentType<{ size?: number; className?: string }>> = {
  verified: ShieldCheck,
  drift: AlertTriangle,
  ai: Sparkles,
  bound: Link,
};

/**
 * Renders an intelligence option with colored icon and text.
 * Options without a signal are rendered as plain text.
 */
export const renderIntelligenceOption = (option: IntelligenceSelectOption): React.ReactNode => {
  if (option.signal === undefined) {
    return (
      <span className="text-text-secondary" data-test-id="intelligence-option-all">
        {option.label}
      </span>
    );
  }

  const colors = intelligenceColors[option.signal];
  const Icon = intelligenceIcons[option.signal];
  return (
    <span className="flex items-center gap-2" data-test-id={`intelligence-option-${option.signal}`}>
      <Icon size={12} className={cn('shrink-0', colors.icon)} />
      <span className={colors.text}>{option.label}</span>
    </span>
  );
};
