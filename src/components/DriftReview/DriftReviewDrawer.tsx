// Copyright (c) 2025 runi contributors
// SPDX-License-Identifier: MIT

import React, { useEffect, useCallback, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { useDriftReviewStore } from '@/stores/useDriftReviewStore';
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';
import type { DriftOperation } from '@/types/generated/DriftOperation';
import type { OperationChange } from '@/types/generated/OperationChange';
import { Button } from '@/components/ui/button';
import { getMethodColor } from '@/utils/http-colors';
import type { HttpMethod } from '@/utils/http-colors';

interface DriftReviewDrawerProps {
  collectionId: string;
  driftResult: SpecRefreshResult | undefined;
  fromVersion?: string;
  toVersion?: string;
}

interface DriftChangeCardProps {
  collectionId: string;
  method: string;
  path: string;
  severity: 'removed' | 'changed' | 'added';
  description: string;
}

const DriftChangeCard = ({
  collectionId,
  method,
  path,
  severity,
  description,
}: DriftChangeCardProps): React.JSX.Element | null => {
  const acceptChange = useDriftReviewStore((state) => state.acceptChange);
  const ignoreChange = useDriftReviewStore((state) => state.ignoreChange);
  const reviewState = useDriftReviewStore((state) => state.reviewState);

  const key = `${collectionId}:${method}:${path}`;
  const status = reviewState[key]?.status ?? 'pending';

  if (status !== 'pending') {
    return null;
  }

  const cardTestId = `drift-change-card-${method}-${path}`;
  const acceptTestId = `drift-change-accept-${method}-${path}`;
  const ignoreTestId = `drift-change-ignore-${method}-${path}`;

  const methodColor = getMethodColor(method as HttpMethod);

  const borderColorMap: Record<'removed' | 'changed' | 'added', string> = {
    removed: 'border-signal-error/30',
    changed: 'border-signal-warning/30',
    added: 'border-signal-success/30',
  };
  const borderColor = borderColorMap[severity];

  return (
    <div
      className={cn('rounded-lg border bg-bg-raised p-3 space-y-2', borderColor)}
      data-test-id={cardTestId}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('text-xs font-mono font-semibold shrink-0', methodColor)}>
            {method}
          </span>
          <span className="text-xs font-mono text-text-secondary truncate">{path}</span>
        </div>
      </div>
      <p className="text-xs text-text-muted">{description}</p>
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="ghost"
          size="xs"
          noScale
          className={cn(focusRingClasses, 'text-xs text-text-muted hover:text-text-primary')}
          data-test-id={ignoreTestId}
          aria-label={`Ignore change: ${method} ${path}`}
          onClick={() => {
            ignoreChange(collectionId, method, path);
          }}
        >
          Ignore
        </Button>
        <Button
          variant="outline"
          size="xs"
          noScale
          className={cn(focusRingClasses, 'text-xs')}
          data-test-id={acceptTestId}
          aria-label={`Accept change: ${method} ${path}`}
          onClick={() => {
            acceptChange(collectionId, method, path);
          }}
        >
          Accept
        </Button>
      </div>
    </div>
  );
};

/**
 * DriftReviewDrawer — Layer 2 of the drift review system.
 *
 * Right-side flyout drawer rendered via React portal over document.body.
 * Groups changes as REMOVED → CHANGED → ADDED.
 * Per-change Accept/Ignore buttons + Accept all / Dismiss all bulk actions.
 * Focus-trapped, Escape-closeable, backdrop-closeable.
 */
export const DriftReviewDrawer = ({
  collectionId,
  driftResult,
  fromVersion,
  toVersion,
}: DriftReviewDrawerProps): React.JSX.Element | null => {
  const isOpen = useDriftReviewStore((state) => state.isOpen);
  const closeDrawer = useDriftReviewStore((state) => state.closeDrawer);
  const acceptAll = useDriftReviewStore((state) => state.acceptAll);
  const dismissAll = useDriftReviewStore((state) => state.dismissAll);
  const reviewState = useDriftReviewStore((state) => state.reviewState);
  const shouldReduceMotion = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const handleEscape = useCallback(
    (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        closeDrawer();
      }
    },
    [isOpen, closeDrawer]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return (): void => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [handleEscape]);

  if (!isOpen || driftResult === undefined) {
    return null;
  }

  const isPending = (op: DriftOperation | OperationChange): boolean => {
    const key = `${collectionId}:${op.method}:${op.path}`;
    return (reviewState[key]?.status ?? 'pending') === 'pending';
  };

  const allPendingKeys = [
    ...driftResult.operationsRemoved
      .filter(isPending)
      .map((op) => `${collectionId}:${op.method}:${op.path}`),
    ...driftResult.operationsChanged
      .filter(isPending)
      .map((op) => `${collectionId}:${op.method}:${op.path}`),
    ...driftResult.operationsAdded
      .filter(isPending)
      .map((op) => `${collectionId}:${op.method}:${op.path}`),
  ];

  const breakingCount = driftResult.operationsRemoved.filter(isPending).length;
  const warningCount = driftResult.operationsChanged.filter(isPending).length;
  const addedCount = driftResult.operationsAdded.filter(isPending).length;

  const slideAnimation =
    shouldReduceMotion === true
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
      : {
          initial: { x: '100%', opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '100%', opacity: 0 },
        };

  const drawer = (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 z-50 bg-bg-app/40 backdrop-blur-sm"
          data-test-id="drift-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeDrawer}
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <motion.div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed right-0 top-0 bottom-0 z-51 w-[420px] max-w-[90vw] flex flex-col bg-bg-surface border-l border-border-default shadow-xl overflow-hidden"
          data-test-id="drift-review-drawer"
          {...slideAnimation}
          transition={
            shouldReduceMotion === true
              ? { duration: 0 }
              : { type: 'spring', stiffness: 400, damping: 30 }
          }
        >
          {/* Header */}
          <div className="shrink-0 flex items-start justify-between gap-2 px-4 py-3 border-b border-border-subtle">
            <div className="min-w-0">
              <h2 id={titleId} className="text-sm font-semibold text-text-primary">
                Drift Review
                {fromVersion !== undefined && toVersion !== undefined && (
                  <span className="font-normal text-text-muted ml-1 font-mono text-xs">
                    {fromVersion} → {toVersion}
                  </span>
                )}
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                {breakingCount > 0 && (
                  <span className="text-signal-error">{breakingCount} breaking</span>
                )}
                {breakingCount > 0 && warningCount > 0 && (
                  <span className="text-text-muted/50"> · </span>
                )}
                {warningCount > 0 && (
                  <span className="text-signal-warning">
                    {warningCount} warning{warningCount !== 1 ? 's' : ''}
                  </span>
                )}
                {(breakingCount > 0 || warningCount > 0) && addedCount > 0 && (
                  <span className="text-text-muted/50"> · </span>
                )}
                {addedCount > 0 && <span className="text-signal-success">{addedCount} added</span>}
              </p>
            </div>
            <button
              type="button"
              className={cn(
                focusRingClasses,
                'shrink-0 size-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-raised motion-safe:transition-colors'
              )}
              data-test-id="drift-drawer-close"
              aria-label="Close drift review"
              onClick={closeDrawer}
            >
              <X size={15} />
            </button>
          </div>

          {/* Bulk actions */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-border-subtle bg-bg-app/30">
            <Button
              variant="outline"
              size="xs"
              noScale
              className={cn(focusRingClasses, 'text-xs')}
              data-test-id="drift-drawer-accept-all"
              aria-label="Accept all changes"
              onClick={() => {
                acceptAll(allPendingKeys);
              }}
            >
              Accept all
            </Button>
            <Button
              variant="ghost"
              size="xs"
              noScale
              className={cn(focusRingClasses, 'text-xs text-text-muted hover:text-text-primary')}
              data-test-id="drift-drawer-dismiss-all"
              aria-label="Dismiss all changes"
              onClick={() => {
                dismissAll(allPendingKeys);
              }}
            >
              Dismiss all
            </Button>
          </div>

          {/* Change groups — scrollable */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* REMOVED group */}
            {driftResult.operationsRemoved.some(isPending) && (
              <div data-drift-group="removed">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-signal-error mb-2">
                  Removed
                </p>
                <div className="space-y-2">
                  {driftResult.operationsRemoved.map((op) => (
                    <DriftChangeCard
                      key={`removed-${op.method}-${op.path}`}
                      collectionId={collectionId}
                      method={op.method}
                      path={op.path}
                      severity="removed"
                      description="Removed — clients will get 404"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* CHANGED group */}
            {driftResult.operationsChanged.some(isPending) && (
              <div data-drift-group="changed">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-signal-warning mb-2">
                  Changed
                </p>
                <div className="space-y-2">
                  {driftResult.operationsChanged.map((op) => (
                    <DriftChangeCard
                      key={`changed-${op.method}-${op.path}`}
                      collectionId={collectionId}
                      method={op.method}
                      path={op.path}
                      severity="changed"
                      description={`Changed: ${op.changes.join(', ')}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ADDED group */}
            {driftResult.operationsAdded.some(isPending) && (
              <div data-drift-group="added">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-signal-success mb-2">
                  Added
                </p>
                <div className="space-y-2">
                  {driftResult.operationsAdded.map((op) => (
                    <DriftChangeCard
                      key={`added-${op.method}-${op.path}`}
                      collectionId={collectionId}
                      method={op.method}
                      path={op.path}
                      severity="added"
                      description="New endpoint"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All reviewed state */}
            {allPendingKeys.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-text-muted">All changes reviewed</p>
              </div>
            )}
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );

  return createPortal(drawer, document.body);
};
