/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/utils/cn';

interface CollectionEmptyStateProps {
  isLoading: boolean;
  error?: string | null;
  onAddHttpbin: () => Promise<unknown>;
}

export const CollectionEmptyState = ({
  isLoading,
  error,
  onAddHttpbin,
}: CollectionEmptyStateProps): React.JSX.Element => {
  const showError = error !== undefined && error !== null && error.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {showError && (
        <div className="text-xs text-signal-error" data-test-id="collection-empty-error">
          {error}
        </div>
      )}
      <EmptyState variant="muted" size="sm" title="No collections yet" />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className={cn('w-full')}
        data-test-id="add-httpbin-button"
        onClick={() => {
          void onAddHttpbin();
        }}
        disabled={isLoading}
      >
        Add httpbin.org
      </Button>
    </div>
  );
};
