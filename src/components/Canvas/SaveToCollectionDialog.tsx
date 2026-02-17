/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useCollectionStore } from '@/stores/useCollectionStore';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Label';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';

const COLLECTION_PLACEHOLDER = 'Select a collection';

interface SaveToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  onSave: (collectionId: string, name: string) => void;
  errorMessage?: string | null;
}

export const SaveToCollectionDialog = ({
  open,
  onOpenChange,
  defaultName = '',
  onSave,
  errorMessage = null,
}: SaveToCollectionDialogProps): React.ReactElement | null => {
  const summaries = useCollectionStore((state) => state.summaries);
  const [selectedCollectionId, setSelectedCollectionId] = React.useState<string>('');
  const [requestName, setRequestName] = React.useState<string>(defaultName);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedCollectionId('');
      setRequestName(defaultName);
    }
  }, [open, defaultName]);

  const canSave = selectedCollectionId !== '' && requestName.trim() !== '';

  const handleSave = (): void => {
    if (canSave) {
      onSave(selectedCollectionId, requestName.trim());
    }
  };

  const handleCancel = (): void => {
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && canSave) {
      e.preventDefault();
      handleSave();
    }
  };

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
          data-test-id="save-to-collection-dialog"
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[420px] max-w-[90vw] rounded-xl',
            'bg-bg-elevated border border-border-default shadow-xl',
            'p-6',
            focusRingClasses
          )}
          style={{ zIndex: OVERLAY_Z_INDEX + 1 }}
          onKeyDown={handleKeyDown}
        >
          <Dialog.Title className="text-base font-medium text-text-primary mb-4">
            Save to Collection
          </Dialog.Title>

          <div className="space-y-4">
            {errorMessage !== null && errorMessage.length > 0 && (
              <div
                className="rounded-md border border-signal-error/30 bg-signal-error/10 px-3 py-2 text-xs text-signal-error"
                data-test-id="save-to-collection-error"
                role="alert"
              >
                {errorMessage}
              </div>
            )}
            {summaries.length === 0 ? (
              <p data-test-id="no-collections-message" className="text-sm text-text-muted">
                No collections available. Create a collection first.
              </p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="collection-picker">Collection</Label>
                <Select
                  value={selectedCollectionId}
                  onValueChange={(value) => {
                    setSelectedCollectionId(value ?? '');
                  }}
                >
                  <SelectTrigger
                    data-test-id="collection-picker"
                    id="collection-picker"
                    className="w-full"
                    role="button"
                    aria-haspopup="listbox"
                  >
                    <SelectValue placeholder={COLLECTION_PLACEHOLDER}>
                      {(value: string | null) => {
                        if (value === null || value === '') {
                          return COLLECTION_PLACEHOLDER;
                        }
                        const match = summaries.find((s) => s.id === value);
                        return match !== undefined
                          ? `${match.name} (${String(match.request_count)})`
                          : value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {summaries.map((summary) => (
                      <SelectItem
                        key={summary.id}
                        value={summary.id}
                        data-test-id={`collection-option-${summary.id}`}
                      >
                        {summary.name} ({summary.request_count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="request-name-input">Request Name</Label>
              <Input
                id="request-name-input"
                data-test-id="request-name-input"
                value={requestName}
                onChange={(e) => {
                  setRequestName(e.target.value);
                }}
                placeholder="Enter request name"
                noScale
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button data-test-id="cancel-button" variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              data-test-id="save-button"
              variant="default"
              size="sm"
              disabled={!canSave}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
