// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import React from 'react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { matchesPathTemplate } from '@/utils/pathTemplate';
import { useDriftReviewStore } from '@/stores/useDriftReviewStore';
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';
import { Button } from '@/components/ui/button';

interface DriftContextBannerProps {
  /** Collection this request belongs to */
  collectionId: string;
  /** HTTP method of the active request */
  method: string;
  /** URL path of the active request (e.g. "/books/{id}") */
  path: string;
  /** Drift result for this collection */
  driftResult: SpecRefreshResult | undefined;
}

/**
 * DriftContextBanner — Layer 3 of the drift review system.
 *
 * A thin banner rendered below the URL bar in the active request tab
 * when the current operation was removed or changed in the latest spec refresh.
 *
 * Red for REMOVED operations, amber for CHANGED operations.
 * "Review" opens the DriftReviewDrawer scrolled to this operation.
 * "Dismiss" hides the banner for the current session.
 *
 * Returns null when:
 * - No drift result is present
 * - The operation is not in operationsRemoved or operationsChanged
 * - The banner has been dismissed for this session
 * - The change has been accepted or ignored via review state
 */
export const DriftContextBanner = ({
  collectionId,
  method,
  path,
  driftResult,
}: DriftContextBannerProps): React.JSX.Element | null => {
  const openDrawer = useDriftReviewStore((state) => state.openDrawer);
  const dismissBanner = useDriftReviewStore((state) => state.dismissBanner);
  const dismissedBannerKeys = useDriftReviewStore((state) => state.dismissedBannerKeys);
  const reviewState = useDriftReviewStore((state) => state.reviewState);

  if (driftResult === undefined) {
    return null;
  }

  // Find the matching operation using template matching so that resolved paths
  // like /books/123 match the OpenAPI template path /books/{id} in the drift result.
  const removedOp = driftResult.operationsRemoved.find(
    (op) => op.method === method && matchesPathTemplate(path, op.path)
  );
  const changedOp = driftResult.operationsChanged.find(
    (op) => op.method === method && matchesPathTemplate(path, op.path)
  );

  // Only show for removed or changed — not added
  const matchedOp = removedOp ?? changedOp;
  if (matchedOp === undefined) {
    return null;
  }

  // Use the template path from the matched spec operation so the bannerKey
  // is consistent with keys produced by acceptChange/ignoreChange, which
  // receive the template path from DriftChangeCard.
  const templatePath = matchedOp.path;
  const bannerKey = `${collectionId}:${method}:${templatePath}`;

  // Skip if already dismissed this session
  if (dismissedBannerKeys.has(bannerKey)) {
    return null;
  }

  // Skip if already reviewed (accepted or ignored)
  const changeStatus = reviewState[bannerKey]?.status ?? 'pending';
  if (changeStatus !== 'pending') {
    return null;
  }

  const isRemovedSeverity = removedOp !== undefined;

  const message = isRemovedSeverity
    ? `This endpoint was removed`
    : `Spec change: ${changedOp?.changes.join(', ') ?? ''}`;

  const handleReview = (): void => {
    openDrawer(collectionId, bannerKey);
  };

  const handleDismiss = (): void => {
    dismissBanner(collectionId, method, templatePath);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 text-xs',
        'border-b border-border-subtle',
        isRemovedSeverity
          ? 'bg-signal-error/8 text-signal-error'
          : 'bg-signal-warning/8 text-signal-warning'
      )}
      data-test-id="drift-context-banner"
      role="status"
      aria-live={isRemovedSeverity ? 'assertive' : 'polite'}
    >
      <span
        className={cn(
          'size-1.5 rounded-full shrink-0',
          isRemovedSeverity ? 'bg-signal-error' : 'bg-signal-warning'
        )}
        aria-hidden="true"
      />
      <span className="flex-1 min-w-0 truncate">{message}</span>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="xs"
          noScale
          className={cn(
            focusRingClasses,
            'h-5 px-1.5 text-[10px]',
            isRemovedSeverity
              ? 'text-signal-error hover:text-signal-error hover:bg-signal-error/10'
              : 'text-signal-warning hover:text-signal-warning hover:bg-signal-warning/10'
          )}
          data-test-id="drift-banner-review"
          aria-label="Review this drift change"
          onClick={handleReview}
        >
          Review
        </Button>
        <Button
          variant="ghost"
          size="xs"
          noScale
          className={cn(
            focusRingClasses,
            'h-5 px-1.5 text-[10px] text-text-muted hover:text-text-primary'
          )}
          data-test-id="drift-banner-dismiss"
          aria-label="Dismiss this drift banner"
          onClick={handleDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
};
