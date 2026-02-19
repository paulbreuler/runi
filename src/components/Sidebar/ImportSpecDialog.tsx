/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Label';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';
import { globalEventBus } from '@/events/bus';

interface ImportSpecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportSpecDialog = ({
  open,
  onOpenChange,
}: ImportSpecDialogProps): React.ReactElement | null => {
  const importCollection = useCollectionStore((state) => state.importCollection);
  const [url, setUrl] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setUrl('');
      setLocalError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  const canSubmit = url.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      const result = await importCollection({
        url: url.trim(),
        filePath: null,
        inlineContent: null,
        displayName: null,
        repoRoot: null,
        specPath: null,
        refName: null,
      });

      if (result !== null) {
        globalEventBus.emit('collection.imported', {
          collection_id: result.id,
          url: url.trim(),
          actor: 'human',
        });
        onOpenChange(false);
      } else {
        setLocalError('Failed to import spec. Check the URL and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (): void => {
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && canSubmit) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const displayError = localError;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          style={{ zIndex: OVERLAY_Z_INDEX }}
        />
        <Dialog.Popup
          data-test-id="import-spec-dialog"
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[420px] max-w-[90vw] rounded-xl',
            'bg-bg-elevated border border-border-default shadow-xl',
            'p-6',
            focusRingClasses
          )}
          style={{ zIndex: OVERLAY_Z_INDEX + 1 }}
        >
          <Dialog.Title className="text-base font-medium text-text-primary mb-1">
            Import OpenAPI spec
          </Dialog.Title>
          <p className="text-xs text-text-muted mb-4">
            Enter the URL of a live API spec to create a collection.
          </p>

          <div className="space-y-4">
            {displayError !== null && (
              <div
                className="rounded-md border border-signal-error/30 bg-signal-error/10 px-3 py-2 text-xs text-signal-error"
                data-test-id="import-spec-error"
                role="alert"
              >
                {displayError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="import-spec-url" data-test-id="import-spec-url-label">
                URL
              </Label>
              <Input
                id="import-spec-url"
                data-test-id="import-spec-url-input"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                placeholder="https://…"
                noScale
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              data-test-id="import-spec-cancel"
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              data-test-id="import-spec-submit"
              variant="default"
              size="sm"
              disabled={!canSubmit}
              onClick={() => {
                void handleSubmit();
              }}
            >
              {isSubmitting ? 'Importing…' : 'Import'}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
