// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import React from 'react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { useDriftReviewStore } from '@/stores/useDriftReviewStore';
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';

interface DriftBadgeProps {
  collectionId: string;
  collectionName: string;
  driftResult: SpecRefreshResult | undefined;
  fromVersion?: string;
  toVersion?: string;
}

/**
 * DriftBadge — Layer 1 of the drift review system.
 *
 * A compact badge rendered in the collection header showing version range
 * plus breaking (red) and warning (amber) change counts.
 * Clicking opens the DriftReviewDrawer.
 *
 * Renders nothing when:
 * - No drift result is present
 * - drift result has changed=false
 * - All changes have been accepted or ignored
 */
export const DriftBadge = ({
  collectionId,
  collectionName,
  driftResult,
  fromVersion,
  toVersion,
}: DriftBadgeProps): React.JSX.Element | null => {
  const openDrawer = useDriftReviewStore((state) => state.openDrawer);
  const reviewState = useDriftReviewStore((state) => state.reviewState);

  if (driftResult?.changed !== true) {
    return null;
  }

  // Filter out reviewed (accepted/ignored) operations from counts
  const pendingRemoved = driftResult.operationsRemoved.filter(
    (op) =>
      (reviewState[`${collectionId}:${op.method}:${op.path}`]?.status ?? 'pending') === 'pending'
  );
  const pendingChanged = driftResult.operationsChanged.filter(
    (op) =>
      (reviewState[`${collectionId}:${op.method}:${op.path}`]?.status ?? 'pending') === 'pending'
  );

  const breakingCount = pendingRemoved.length;
  const warningCount = pendingChanged.length;

  // If all changes have been reviewed, hide badge
  const totalPending = breakingCount + warningCount;
  if (totalPending === 0) {
    return null;
  }

  const handleClick = (): void => {
    openDrawer(collectionId);
  };

  const ariaLabel = `Open drift review for ${collectionName}: ${breakingCount > 0 ? `${String(breakingCount)} breaking` : ''}${breakingCount > 0 && warningCount > 0 ? ', ' : ''}${warningCount > 0 ? `${String(warningCount)} warnings` : ''}`;

  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 text-[10px] rounded px-1 py-0.5',
        'bg-bg-raised/60 hover:bg-bg-raised border border-border-subtle',
        'motion-safe:transition-colors motion-reduce:transition-none',
        focusRingClasses
      )}
      data-test-id={`drift-badge-${collectionId}`}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {/* Version range — only shown when version props are available */}
      {fromVersion !== undefined && toVersion !== undefined && (
        <span className="text-text-muted font-mono">
          {fromVersion}
          <span className="mx-0.5 text-text-muted/50">→</span>
          {toVersion}
        </span>
      )}

      {/* Breaking count chip (red) */}
      {breakingCount > 0 && (
        <span
          className="inline-flex items-center gap-0.5 text-signal-error"
          data-test-id={`drift-badge-breaking-${collectionId}`}
        >
          <span className="size-1.5 rounded-full bg-signal-error inline-block" />
          <span>{breakingCount}</span>
        </span>
      )}

      {/* Warning count chip (amber) */}
      {warningCount > 0 && (
        <span
          className="inline-flex items-center gap-0.5 text-signal-warning"
          data-test-id={`drift-badge-warning-${collectionId}`}
        >
          <span className="size-1.5 rounded-full bg-signal-warning inline-block" />
          <span>{warningCount}</span>
        </span>
      )}
    </button>
  );
};
