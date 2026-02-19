/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { X } from 'lucide-react';
import { DriftActionCard } from '@/components/DriftActionCard/DriftActionCard';
import { Button } from '@/components/ui/button';
import type { DriftActionType } from '@/types/generated/DriftActionType';
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';

interface DriftReportProps {
  result: SpecRefreshResult;
  onDismiss: () => void;
  onAction: (actionType: DriftActionType) => void;
}

export const DriftReport = ({
  result,
  onDismiss,
  onAction,
}: DriftReportProps): React.JSX.Element | null => {
  if (!result.changed) {
    return null;
  }

  const breakingCount = result.operationsRemoved.length;
  const warningCount = result.operationsChanged.length;

  return (
    <div
      data-test-id="drift-report"
      className="mt-1 mb-2 mx-2 rounded-lg border border-border-subtle bg-bg-surface p-3 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p data-test-id="drift-report-summary" className="text-xs font-medium text-text-primary">
          Spec changed
          {breakingCount > 0 && (
            <span className="text-signal-error"> — {breakingCount} breaking</span>
          )}
          {warningCount > 0 && (
            <span className="text-signal-warning">, {warningCount} warnings</span>
          )}
        </p>
        <Button
          variant="ghost"
          size="icon-xs"
          className="size-5 text-text-muted hover:text-text-primary"
          data-test-id="drift-report-dismiss"
          aria-label="Dismiss drift report"
          onClick={onDismiss}
        >
          <X size={12} />
        </Button>
      </div>

      {/* Removed operations (breaking) */}
      {result.operationsRemoved.map((op) => (
        <DriftActionCard
          key={`removed-${op.method}-${op.path}`}
          method={op.method}
          path={op.path}
          severity="breaking"
          description="Removed — clients will get 404"
          actions={[
            { actionType: 'update_spec', label: 'Update spec', description: 'Accept the removal' },
            { actionType: 'ignore', label: 'Ignore', description: 'Dismiss this drift' },
          ]}
          onAction={onAction}
        />
      ))}

      {/* Changed operations (warning) */}
      {result.operationsChanged.map((op) => (
        <DriftActionCard
          key={`changed-${op.method}-${op.path}`}
          method={op.method}
          path={op.path}
          severity="warning"
          description={`Changed: ${op.changes.join(', ')}`}
          actions={[
            {
              actionType: 'fix_request',
              label: 'Fix request',
              description: 'Update request to match new spec',
            },
            { actionType: 'ignore', label: 'Ignore', description: 'Dismiss this drift' },
          ]}
          onAction={onAction}
        />
      ))}

      {/* Added operations (info) */}
      {result.operationsAdded.map((op) => (
        <DriftActionCard
          key={`added-${op.method}-${op.path}`}
          method={op.method}
          path={op.path}
          severity="info"
          description="New endpoint"
          actions={[
            {
              actionType: 'update_spec',
              label: 'Update spec',
              description: 'Accept the new endpoint',
            },
            { actionType: 'ignore', label: 'Ignore', description: 'Dismiss this drift' },
          ]}
          onAction={onAction}
        />
      ))}
    </div>
  );
};
