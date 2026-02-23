/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { invoke } from '@tauri-apps/api/core';
import { open as openFileDialog } from '@tauri-apps/plugin-dialog';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Label';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import type { PinnedSpecVersion } from '@/types/generated/PinnedSpecVersion';

type ImportMode = 'url' | 'file';

interface ImportSpecDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportSpecDialog = ({
  open,
  onOpenChange,
}: ImportSpecDialogProps): React.ReactElement | null => {
  const importCollection = useCollectionStore((state) => state.importCollection);
  const refreshCollectionSpec = useCollectionStore((state) => state.refreshCollectionSpec);
  const loadCollection = useCollectionStore((state) => state.loadCollection);
  const [mode, setMode] = React.useState<ImportMode>('file');
  const [url, setUrl] = React.useState('');
  const [filePath, setFilePath] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [conflict, setConflict] = React.useState<{
    existingId: string;
    existingName: string;
    source: string;
    existingVersion: string | null;
  } | null>(null);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setMode('file');
      setUrl('');
      setFilePath('');
      setIsSubmitting(false);
      setConflict(null);
    }
  }, [open]);

  const canSubmit =
    !isSubmitting && (mode === 'url' ? url.trim().length > 0 : filePath.trim().length > 0);

  const handleBrowse = async (): Promise<void> => {
    try {
      const selected = await openFileDialog({
        multiple: false,
        filters: [{ name: 'OpenAPI', extensions: ['json', 'yaml', 'yml'] }],
      });
      if (typeof selected === 'string') {
        setFilePath(selected);
      }
    } catch (err) {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (mode !== 'url') {
      return trimmed;
    }
    if (trimmed === '') {
      return trimmed;
    }
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
      // Non-http(s) scheme (e.g. ftp://): return as-is; don't prepend http://
      return trimmed;
    } catch {
      /* not valid as-is — only prepend http:// if no scheme is present */
    }
    // Only auto-prepend if the input doesn't already contain a scheme separator
    if (trimmed.includes('://')) {
      return trimmed;
    }
    try {
      return new URL(`http://${trimmed}`).toString();
    } catch {
      return trimmed;
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);

    try {
      const source = mode === 'url' ? normalizeUrl(url) : filePath.trim();
      const result = await importCollection(
        mode === 'url'
          ? {
              url: source,
              filePath: null,
              inlineContent: null,
              displayName: null,
              repoRoot: null,
              specPath: null,
              refName: null,
            }
          : {
              url: null,
              filePath: source,
              inlineContent: null,
              displayName: null,
              repoRoot: null,
              specPath: null,
              refName: null,
            }
      );

      if (result !== null && result.status === 'success') {
        globalEventBus.emit('collection.imported', {
          collection_id: result.collection.id,
          url: source,
          actor: 'human',
        });
        onOpenChange(false);
      } else if (result !== null) {
        setConflict({
          existingId: result.existing_id,
          existingName: result.existing_name,
          source,
          existingVersion: result.existing_version ?? null,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplace = async (): Promise<void> => {
    if (conflict === null) {
      return;
    }
    setIsSubmitting(true);

    try {
      const success = await refreshCollectionSpec(conflict.existingId, conflict.source);
      if (success) {
        onOpenChange(false);
        setConflict(null);
      }
      // On failure: store already emitted toast; dialog stays open for retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConflictCancel = (): void => {
    setConflict(null);
  };

  const handlePin = async (): Promise<void> => {
    if (conflict === null) {
      return;
    }
    setIsSubmitting(true);
    try {
      await invoke<PinnedSpecVersion>('cmd_pin_spec_version', {
        collectionId: conflict.existingId,
        source: conflict.source,
      });
      await loadCollection(conflict.existingId);
      globalEventBus.emit('collection.imported', {
        collection_id: conflict.existingId,
        url: conflict.source,
        actor: 'human',
      });
      onOpenChange(false);
      setConflict(null);
    } catch (err) {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
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

  const handleModeKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>): void => {
    const modes: ImportMode[] = ['url', 'file'];
    const currentIndex = modes.indexOf(mode);
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % modes.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + modes.length) % modes.length;
    }
    if (nextIndex !== currentIndex) {
      setMode(modes[nextIndex] ?? 'url');
      // WAI-ARIA radiogroup: arrow keys must both select and focus the next option
      const buttons = e.currentTarget
        .closest('[role="radiogroup"]')
        ?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[nextIndex]?.focus();
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
          {conflict !== null ? (
            <>
              <Dialog.Title className="text-base font-medium text-text-primary mb-1">
                Collection already exists
              </Dialog.Title>
              <Dialog.Description
                className="text-sm text-text-secondary mb-2"
                data-test-id="import-conflict-message"
              >
                A collection named{' '}
                <span className="font-medium text-text-primary">
                  &ldquo;{conflict.existingName}&rdquo;
                </span>{' '}
                already exists. Importing will refresh the existing collection with the new spec.
              </Dialog.Description>
              <p
                className="text-xs text-text-muted mb-4"
                data-test-id="import-conflict-version-context"
              >
                Currently {conflict.existingVersion ?? '(unknown)'}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  data-test-id="import-conflict-cancel"
                  variant="outline"
                  size="sm"
                  onClick={handleConflictCancel}
                  disabled={isSubmitting}
                  autoFocus
                >
                  Cancel
                </Button>
                <Button
                  data-test-id="import-conflict-pin-version"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void handlePin();
                  }}
                  disabled={isSubmitting}
                >
                  Pin as new version
                </Button>
                <Button
                  data-test-id="import-conflict-replace"
                  variant="default"
                  size="sm"
                  onClick={() => {
                    void handleReplace();
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Replacing…' : 'Replace'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Dialog.Title className="text-base font-medium text-text-primary mb-1">
                Import OpenAPI spec
              </Dialog.Title>
              <Dialog.Description className="text-xs text-text-muted mb-4">
                Import from a live URL or a local JSON/YAML file.
              </Dialog.Description>

              {/* Mode toggle */}
              <div
                className="flex gap-1 p-0.5 bg-bg-surface rounded-md mb-4"
                role="radiogroup"
                aria-label="Import source"
                data-test-id="import-mode-toggle"
              >
                {(['url', 'file'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={mode === m}
                    tabIndex={mode === m ? 0 : -1}
                    data-test-id={`import-mode-${m}`}
                    onClick={() => {
                      setMode(m);
                    }}
                    onKeyDown={handleModeKeyDown}
                    className={cn(
                      'flex-1 py-1 text-xs font-medium rounded transition-colors outline-none',
                      focusRingClasses,
                      mode === m
                        ? 'bg-bg-elevated text-text-primary shadow-sm'
                        : 'text-text-muted hover:text-text-secondary'
                    )}
                  >
                    {m === 'url' ? 'URL' : 'Local file'}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {mode === 'url' ? (
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
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="import-spec-file" data-test-id="import-spec-file-label">
                      File
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="import-spec-file"
                        data-test-id="import-spec-file-input"
                        value={filePath}
                        onChange={(e) => {
                          setFilePath(e.target.value);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="/path/to/openapi.json"
                        noScale
                        className="flex-1 font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-test-id="import-spec-browse"
                        onClick={() => {
                          void handleBrowse();
                        }}
                      >
                        Browse
                      </Button>
                    </div>
                  </div>
                )}
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
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
