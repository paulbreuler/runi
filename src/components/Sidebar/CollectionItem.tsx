/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu } from '@base-ui/react/menu';
import { invoke } from '@tauri-apps/api/core';
import { open as openFileDialog } from '@tauri-apps/plugin-dialog';
import {
  Archive,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileDiff,
  Folder,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Timer,
  Trash2,
} from 'lucide-react';
import { DriftBadge } from '@/components/DriftReview/DriftBadge';
import { DriftReviewDrawer } from '@/components/DriftReview/DriftReviewDrawer';
import { RequestListComposite } from '@/components/Sidebar/composite';
import {
  useCollection,
  useCollectionStore,
  useIsExpanded,
  useSortedRequests,
} from '@/stores/useCollectionStore';
import type { Collection, CollectionSummary, PinnedSpecVersion } from '@/types/collection';
import type { SpecRefreshResult } from '@/types/generated/SpecRefreshResult';
import { cn } from '@/utils/cn';
import { focusRingClasses, useFocusVisible } from '@/utils/accessibility';
import { focusWithVisibility } from '@/utils/focusVisibility';
import { truncateNavLabel } from '@/utils/truncateNavLabel';
import { globalEventBus, type ToastEventPayload } from '@/events/bus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent } from '@/components/ui/Popover';
import { Tooltip } from '@/components/ui/Tooltip';
import { OVERLAY_Z_INDEX } from '@/utils/z-index';

interface VersionSwitcherPopoverProps {
  collection: Collection;
  onClose: () => void;
}

const VersionSwitcherPopover = ({
  collection,
  onClose,
}: VersionSwitcherPopoverProps): React.JSX.Element => {
  const setDriftResult = useCollectionStore((state) => state.setDriftResult);
  const loadCollection = useCollectionStore((state) => state.loadCollection);
  const [confirmingActivate, setConfirmingActivate] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);
  const [comparingVersionId, setComparingVersionId] = useState<string | null>(null);
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const activeVersion = collection.source.spec_version ?? null;
  const stagedVersions = collection.pinned_versions.filter((v) => v.role === 'staging');
  const archivedVersions = collection.pinned_versions.filter((v) => v.role === 'archived');

  const stagedCount = stagedVersions.length;
  const badgeText =
    stagedCount > 0
      ? `${activeVersion ?? 'v?'} · +${String(stagedCount)}`
      : (activeVersion ?? 'v?');

  const handleActivate = async (pinnedVersionId: string): Promise<void> => {
    try {
      await invoke<Collection>('cmd_activate_pinned_version', {
        collectionId: collection.id,
        pinnedVersionId,
      });
      await loadCollection(collection.id);
      globalEventBus.emit('collection.version-activated', {
        collection_id: collection.id,
        pinned_version_id: pinnedVersionId,
        actor: 'human',
      });
      onClose();
    } catch (err) {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleRemove = async (pinnedVersionId: string): Promise<void> => {
    try {
      await invoke('cmd_remove_pinned_version', {
        collectionId: collection.id,
        pinnedVersionId,
      });
      await loadCollection(collection.id);
      globalEventBus.emit('collection.version-removed', {
        collection_id: collection.id,
        pinned_version_id: pinnedVersionId,
        actor: 'human',
      });
      onClose();
    } catch (err) {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleCompare = async (pinnedVersionId: string): Promise<void> => {
    setComparingVersionId(pinnedVersionId);
    try {
      const result = await invoke<SpecRefreshResult>('cmd_compare_spec_versions', {
        collectionId: collection.id,
        pinnedVersionId,
      });
      setDriftResult(collection.id, result);
      onClose();
    } catch (err) {
      globalEventBus.emit<ToastEventPayload>('toast.show', {
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setComparingVersionId(null);
    }
  };

  const renderStagedRowContent = (version: PinnedSpecVersion): React.JSX.Element => {
    if (confirmingActivate === version.id) {
      return (
        <div
          className="rounded-md p-2 space-y-1.5"
          style={{ background: '#f59e0b0f', border: '1px solid #f59e0b40' }}
          data-test-id={`version-switcher-activate-confirm-block-${version.id}`}
        >
          <p className="text-[11px] font-medium text-text-primary">
            Activate {version.label} as the working spec?
          </p>
          {activeVersion !== null && (
            <p className="text-[10px] text-text-muted">
              {activeVersion} will become the standby version.
            </p>
          )}
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              variant="outline"
              size="xs"
              noScale
              onClick={() => {
                setConfirmingActivate(null);
              }}
              data-test-id={`version-switcher-activate-cancel-${version.id}`}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="xs"
              noScale
              className="bg-signal-amber/20 text-signal-amber border-signal-amber/40 hover:bg-signal-amber/30"
              onClick={() => {
                void handleActivate(version.id);
              }}
              data-test-id={`version-switcher-activate-confirm-${version.id}`}
            >
              Activate
            </Button>
          </div>
        </div>
      );
    }
    if (confirmingRemove === version.id) {
      return (
        <div
          className="rounded-md p-2 space-y-1.5"
          style={{ background: '#ef44440f', border: '1px solid #ef444440' }}
          data-test-id={`version-switcher-remove-confirm-block-${version.id}`}
        >
          <p className="text-[11px] font-medium text-text-primary">
            Remove {version.label}? This cannot be undone.
          </p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              variant="outline"
              size="xs"
              noScale
              onClick={() => {
                setConfirmingRemove(null);
              }}
              data-test-id={`version-switcher-remove-cancel-${version.id}`}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="xs"
              noScale
              onClick={() => {
                void handleRemove(version.id);
              }}
              data-test-id={`version-switcher-remove-confirm-${version.id}`}
            >
              Remove
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 pt-0.5">
        <Button
          variant="outline"
          size="xs"
          noScale
          disabled={comparingVersionId === version.id}
          onClick={() => {
            void handleCompare(version.id);
          }}
          data-test-id={`version-switcher-compare-${version.id}`}
        >
          {comparingVersionId === version.id ? 'Comparing…' : 'Compare'}
        </Button>
        <Button
          variant="outline"
          size="xs"
          noScale
          onClick={() => {
            setConfirmingActivate(version.id);
            setConfirmingRemove(null);
          }}
          data-test-id={`version-switcher-activate-${version.id}`}
        >
          Activate
        </Button>
        <Button
          variant="outline"
          size="xs"
          noScale
          onClick={() => {
            setConfirmingRemove(version.id);
            setConfirmingActivate(null);
          }}
          data-test-id={`version-switcher-remove-${version.id}`}
        >
          Remove
        </Button>
      </div>
    );
  };

  const renderArchivedRowContent = (version: PinnedSpecVersion): React.JSX.Element => {
    if (confirmingActivate === version.id) {
      return (
        <div
          className="rounded-md p-2 space-y-1.5"
          style={{ background: '#3b82f60f', border: '1px solid #3b82f640' }}
          data-test-id={`version-switcher-activate-confirm-block-${version.id}`}
        >
          <p className="text-[11px] font-medium text-text-primary">
            Restore {version.label} as the working spec?
          </p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              variant="outline"
              size="xs"
              noScale
              onClick={() => {
                setConfirmingActivate(null);
              }}
              data-test-id={`version-switcher-activate-cancel-${version.id}`}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="xs"
              noScale
              onClick={() => {
                void handleActivate(version.id);
              }}
              data-test-id={`version-switcher-activate-confirm-${version.id}`}
            >
              Restore
            </Button>
          </div>
        </div>
      );
    }
    if (confirmingRemove === version.id) {
      return (
        <div
          className="rounded-md p-2 space-y-1.5"
          style={{ background: '#ef44440f', border: '1px solid #ef444440' }}
          data-test-id={`version-switcher-remove-confirm-block-${version.id}`}
        >
          <p className="text-[11px] font-medium text-text-primary">
            Remove {version.label}? This cannot be undone.
          </p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              variant="outline"
              size="xs"
              noScale
              onClick={() => {
                setConfirmingRemove(null);
              }}
              data-test-id={`version-switcher-remove-cancel-${version.id}`}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="xs"
              noScale
              onClick={() => {
                void handleRemove(version.id);
              }}
              data-test-id={`version-switcher-remove-confirm-${version.id}`}
            >
              Remove
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="xs"
          noScale
          onClick={() => {
            setConfirmingActivate(version.id);
            setConfirmingRemove(null);
          }}
          data-test-id={`version-switcher-activate-${version.id}`}
        >
          Restore
        </Button>
        <Button
          variant="outline"
          size="xs"
          noScale
          onClick={() => {
            setConfirmingRemove(version.id);
            setConfirmingActivate(null);
          }}
          data-test-id={`version-switcher-remove-${version.id}`}
        >
          Remove
        </Button>
      </div>
    );
  };

  return (
    <div className="w-[260px]" data-test-id="version-switcher-popover">
      {/* Collection header row */}
      <div className="flex items-center gap-2 px-[10px] py-2 rounded-t-lg bg-bg-elevated border-b border-border-default">
        <Folder size={14} className="shrink-0 text-signal-blue" />
        <span className="flex-1 text-[13px] font-medium text-text-primary truncate">
          {collection.metadata.name}
        </span>
        <span
          className="inline-flex items-center justify-center rounded-full bg-bg-raised border border-border-default px-2 py-0.5"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700 }}
        >
          <span className="text-text-muted">{badgeText}</span>
        </span>
        <ChevronDown size={12} className="shrink-0 text-text-muted" />
      </div>

      {/* ACTIVE section */}
      <div className="px-3 py-[10px] space-y-1.5">
        <p
          className="text-text-muted tracking-wider"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700 }}
        >
          ACTIVE
        </p>
        <div
          className="flex items-center gap-2 rounded-md px-2 py-1.5"
          style={{ background: '#22c55e0d' }}
          data-test-id="version-switcher-active-row"
        >
          <Check size={13} className="shrink-0 text-signal-success" />
          <span
            className="flex-1 text-text-primary truncate"
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 600 }}
          >
            {activeVersion ?? '(unknown)'}
          </span>
          <span className="text-[11px] font-medium text-signal-success">Active</span>
        </div>
      </div>

      {/* STAGED section */}
      {stagedVersions.length > 0 && (
        <>
          <div className="h-px bg-border-subtle" role="separator" />
          <div className="px-3 py-[10px] space-y-1.5">
            <p
              className="text-text-muted tracking-wider"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700 }}
            >
              STAGED
            </p>
            {stagedVersions.map((v) => (
              <div key={v.id} data-test-id={`version-switcher-staged-row-${v.id}`}>
                <div
                  className="flex items-center gap-2 rounded-md px-2 py-1.5"
                  style={{ background: '#f59e0b0d' }}
                >
                  <Timer size={13} className="shrink-0 text-signal-amber" />
                  <span
                    className="flex-1 text-text-primary truncate"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {v.label}
                  </span>
                  <span className="text-[11px] font-medium text-signal-amber">Staging</span>
                </div>
                {renderStagedRowContent(v)}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ARCHIVED section — collapsible footer */}
      <div className="h-px bg-border-subtle" role="separator" />
      {archivedExpanded && archivedVersions.length > 0 ? (
        <>
          <div className="px-3 pt-[10px] pb-1 space-y-1.5">
            <button
              type="button"
              className={cn(
                focusRingClasses,
                'w-full flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors'
              )}
              onClick={() => {
                setArchivedExpanded(false);
              }}
              data-test-id="version-switcher-archived-toggle"
              aria-expanded={true}
            >
              <Archive size={13} className="shrink-0" />
              <span
                className="tracking-wider uppercase"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700 }}
              >
                ARCHIVED
              </span>
              <span
                className="ml-1"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
              >
                {archivedVersions.length} version{archivedVersions.length !== 1 ? 's' : ''}
              </span>
              <ChevronDown size={12} className="ml-auto shrink-0" />
            </button>
          </div>
          <div className="px-3 pb-[10px] space-y-1.5 rounded-b-lg">
            {archivedVersions.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5"
                style={{ background: '#ffffff08' }}
                data-test-id={`version-switcher-archived-row-${v.id}`}
              >
                <Archive size={12} className="shrink-0 text-text-muted" />
                <span
                  className="flex-1 text-text-muted truncate"
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 500 }}
                >
                  {v.label}
                </span>
                <span className="text-[11px] text-text-muted">Archived</span>
                <div className="ml-auto">{renderArchivedRowContent(v)}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <button
          type="button"
          className={cn(
            focusRingClasses,
            'w-full flex items-center gap-2 px-3 py-[10px] rounded-b-lg text-text-muted hover:text-text-primary transition-colors',
            archivedVersions.length === 0 && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
          onClick={() => {
            if (archivedVersions.length > 0) {
              setArchivedExpanded(true);
            }
          }}
          data-test-id="version-switcher-archived-toggle"
          aria-expanded={false}
          disabled={archivedVersions.length === 0}
        >
          <Archive size={13} className="shrink-0" />
          <span className="text-[12px]">Archived</span>
          <span className="ml-1" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
            {archivedVersions.length} version{archivedVersions.length !== 1 ? 's' : ''}
          </span>
          <ChevronRight size={12} className="ml-auto shrink-0" />
        </button>
      )}
    </div>
  );
};

interface CollectionItemProps {
  summary: CollectionSummary;
  onDelete?: (collectionId: string) => void;
  onRename?: (collectionId: string, newName: string) => void;
  onDuplicate?: (collectionId: string) => void;
  onAddRequest?: (collectionId: string) => void;
  /** When true, the item mounts in inline-rename mode immediately. */
  startInRenameMode?: boolean;
  /** Called after the component has consumed the startInRenameMode flag. */
  onRenameStarted?: () => void;
}

export const CollectionItem = ({
  summary,
  onDelete,
  onRename,
  onDuplicate,
  onAddRequest,
  startInRenameMode = false,
  onRenameStarted,
}: CollectionItemProps): React.JSX.Element => {
  const isExpanded = useIsExpanded(summary.id);
  const selectedCollectionId = useCollectionStore((state) => state.selectedCollectionId);
  const isSelected = selectedCollectionId === summary.id;
  const toggleExpanded = useCollectionStore((state) => state.toggleExpanded);
  const loadCollection = useCollectionStore((state) => state.loadCollection);
  const selectCollection = useCollectionStore((state) => state.selectCollection);
  const collection = useCollection(summary.id);
  const sortedRequests = useSortedRequests(summary.id);
  const displayName = truncateNavLabel(summary.name);
  const refreshCollectionSpec = useCollectionStore((state) => state.refreshCollectionSpec);
  const driftResult = useCollectionStore((state) => state.driftResults[summary.id]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [versionSwitcherOpen, setVersionSwitcherOpen] = useState(false);
  const versionBadgeRef = useRef<HTMLButtonElement>(null);

  const [isRenaming, setIsRenaming] = useState(startInRenameMode);
  const [renameValue, setRenameValue] = useState(startInRenameMode ? summary.name : '');
  const [deletePopoverOpen, setDeletePopoverOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<{
    getBoundingClientRect: () => DOMRect;
  } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const didCancelRef = useRef(false);
  const actionsKeyboardFocused = useFocusVisible(actionsRef);

  // Reset cancel flag when entering rename mode
  useEffect(() => {
    if (isRenaming) {
      didCancelRef.current = false;
    }
  }, [isRenaming]);

  // Auto-focus and select when mounting in rename mode
  useEffect(() => {
    if (startInRenameMode) {
      if (renameInputRef.current !== null) {
        focusWithVisibility(renameInputRef.current);
        renameInputRef.current.select();
      }
      onRenameStarted?.();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.currentTarget.focus({ preventScroll: true });
    const nextExpanded = !isExpanded;
    toggleExpanded(summary.id);
    selectCollection(summary.id);
    if (nextExpanded && collection === undefined) {
      void loadCollection(summary.id);
    }
  };

  const startRename = useCallback((): void => {
    setRenameValue(summary.name);
    setIsRenaming(true);
    requestAnimationFrame(() => {
      if (renameInputRef.current !== null) {
        focusWithVisibility(renameInputRef.current);
        renameInputRef.current.select();
      }
    });
  }, [summary.name]);

  const commitRename = useCallback((): void => {
    if (didCancelRef.current) {
      return;
    }
    const trimmed = renameValue.trim();
    if (trimmed.length > 0 && trimmed !== summary.name) {
      onRename?.(summary.id, trimmed);
    }
    setIsRenaming(false);
  }, [renameValue, summary.name, summary.id, onRename]);

  const cancelRename = useCallback((): void => {
    didCancelRef.current = true;
    setIsRenaming(false);
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitRename();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelRename();
      }
    },
    [commitRename, cancelRename]
  );

  const handleDelete = useCallback((): void => {
    onDelete?.(summary.id);
    setDeletePopoverOpen(false);
  }, [summary.id, onDelete]);

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>): void => {
      if (e.key === 'F2') {
        e.preventDefault();
        startRename();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        setDeletePopoverOpen(true);
      }
    },
    [startRename]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    const x = e.clientX;
    const y = e.clientY;
    setContextMenuAnchor({
      getBoundingClientRect: () => new DOMRect(x, y, 0, 0),
    });
    setMenuOpen(true);
  }, []);

  const handleMenuRename = useCallback((): void => {
    setMenuOpen(false);
    setContextMenuAnchor(null);
    requestAnimationFrame(() => {
      startRename();
    });
  }, [startRename]);

  const handleMenuDuplicate = useCallback((): void => {
    setMenuOpen(false);
    setContextMenuAnchor(null);
    onDuplicate?.(summary.id);
  }, [summary.id, onDuplicate]);

  const handleMenuAddRequest = useCallback((): void => {
    setMenuOpen(false);
    setContextMenuAnchor(null);
    onAddRequest?.(summary.id);
  }, [summary.id, onAddRequest]);

  const handleMenuDelete = useCallback((): void => {
    setMenuOpen(false);
    setContextMenuAnchor(null);
    setDeletePopoverOpen(true);
  }, []);

  const handleMenuRefreshSpec = useCallback((): void => {
    setMenuOpen(false);
    setContextMenuAnchor(null);
    setIsRefreshing(true);
    void refreshCollectionSpec(summary.id).finally(() => {
      setIsRefreshing(false);
    });
  }, [summary.id, refreshCollectionSpec]);

  const handleMenuCompareWithFile = useCallback((): void => {
    setMenuOpen(false);
    setContextMenuAnchor(null);
    void (async (): Promise<void> => {
      try {
        const selected = await openFileDialog({
          multiple: false,
          filters: [{ name: 'OpenAPI', extensions: ['json', 'yaml', 'yml'] }],
        });
        if (typeof selected === 'string') {
          setIsRefreshing(true);
          void refreshCollectionSpec(summary.id, selected).finally(() => {
            setIsRefreshing(false);
          });
        }
      } catch (err) {
        setIsRefreshing(false);
        globalEventBus.emit<ToastEventPayload>('toast.show', {
          type: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }, [summary.id, refreshCollectionSpec]);

  // Determine if refresh spec should be shown
  // url may be undefined (local type) or null (runtime data from Rust backend)
  const collectionUrl = collection?.source.url ?? null;
  const canRefreshSpec =
    collection?.source.source_type === 'openapi' &&
    collectionUrl !== null &&
    collectionUrl.length > 0;

  const handleMenuOpenChange = useCallback((open: boolean): void => {
    setMenuOpen(open);
    if (!open) {
      setContextMenuAnchor(null);
    }
  }, []);

  return (
    <div className="border-b border-border-subtle last:border-b-0">
      {isRenaming ? (
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="text-text-muted">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <Folder size={14} className="shrink-0 text-text-muted" />
          <Input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => {
              setRenameValue(e.target.value);
            }}
            onKeyDown={handleRenameKeyDown}
            onBlur={commitRename}
            className="flex-1 text-sm h-6 py-0 px-1"
            noScale
            autoFocus
            data-test-id={`collection-rename-input-${summary.id}`}
            aria-label={`Rename collection ${summary.name}`}
          />
        </div>
      ) : (
        <div
          ref={rowRef}
          className="group/collection"
          onContextMenu={handleContextMenu}
          data-test-id={`collection-row-${summary.id}`}
        >
          <div
            className={cn(
              'w-full flex items-center justify-between gap-3 px-2 py-1 transition-colors',
              isSelected ? 'bg-accent-blue/10' : 'hover:bg-bg-raised/40'
            )}
          >
            <Tooltip
              content={summary.name}
              delayDuration={500}
              data-test-id={`collection-tooltip-${summary.id}`}
            >
              <button
                type="button"
                className={cn(
                  focusRingClasses,
                  'flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer bg-transparent border-none p-0'
                )}
                data-test-id={`collection-item-${summary.id}`}
                data-active={isSelected || undefined}
                data-nav-item="true"
                onClick={handleToggle}
                onKeyDown={handleRowKeyDown}
                aria-expanded={isExpanded}
              >
                <span className="text-text-muted">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <Folder size={14} className="shrink-0 text-text-muted" />
                <span
                  className="text-sm text-text-primary truncate"
                  data-test-id={`collection-name-${summary.id}`}
                >
                  {displayName}
                </span>
              </button>
            </Tooltip>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <span
                  className="inline-block min-w-[3ch] text-right tabular-nums"
                  data-test-id={`collection-count-${summary.id}`}
                >
                  {summary.request_count}
                </span>
                <span className="text-text-muted/70">•</span>
                <span
                  className="uppercase tracking-wider"
                  data-test-id={`collection-source-${summary.id}`}
                >
                  {summary.source_type}
                </span>
                {summary.pinned_version_count > 0 ? (
                  <>
                    <span className="text-text-muted/70">•</span>
                    <Popover open={versionSwitcherOpen} onOpenChange={setVersionSwitcherOpen}>
                      <button
                        ref={versionBadgeRef}
                        type="button"
                        className={cn(
                          focusRingClasses,
                          'inline-flex items-center gap-0.5 text-xs text-text-muted cursor-pointer hover:text-text-primary transition-colors bg-transparent border-none p-0'
                        )}
                        data-test-id="collection-version-badge"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (collection === undefined) {
                            void loadCollection(summary.id);
                          }
                          setVersionSwitcherOpen((v) => !v);
                        }}
                        aria-label={`Version history for ${summary.name}`}
                        aria-expanded={versionSwitcherOpen}
                        aria-haspopup="true"
                      >
                        {summary.spec_version ?? 'v?'}
                        <ChevronDown size={10} className="shrink-0" />
                      </button>
                      {collection !== undefined && (
                        <PopoverContent
                          side="right"
                          align="start"
                          anchor={versionBadgeRef}
                          className="p-0"
                          data-test-id="version-switcher-popover-container"
                        >
                          <VersionSwitcherPopover
                            collection={collection}
                            onClose={() => {
                              setVersionSwitcherOpen(false);
                            }}
                          />
                        </PopoverContent>
                      )}
                    </Popover>
                  </>
                ) : summary.spec_version !== undefined ? (
                  <>
                    <span className="text-text-muted/70">•</span>
                    <span
                      className="text-xs text-text-muted"
                      data-test-id={`collection-version-${summary.id}`}
                    >
                      {summary.spec_version}
                    </span>
                  </>
                ) : null}
                <DriftBadge
                  collectionId={summary.id}
                  collectionName={summary.name}
                  driftResult={driftResult}
                />
              </div>

              {/* Three-dot menu button — hover-revealed */}
              <div
                ref={actionsRef}
                className={cn(
                  'flex items-center',
                  menuOpen || actionsKeyboardFocused
                    ? 'visible pointer-events-auto'
                    : 'invisible pointer-events-none group-hover/collection:visible group-hover/collection:pointer-events-auto group-focus-within/collection:visible group-focus-within/collection:pointer-events-auto',
                  'motion-safe:transition-[visibility,opacity] motion-safe:duration-150'
                )}
                data-test-id={`collection-actions-${summary.id}`}
              >
                <Menu.Root open={menuOpen} onOpenChange={handleMenuOpenChange}>
                  <Menu.Trigger
                    nativeButton={true}
                    render={(props) => (
                      <Button
                        {...props}
                        variant="ghost"
                        size="icon-xs"
                        noScale
                        className="size-5 text-text-muted hover:text-text-primary"
                        data-test-id={`collection-menu-trigger-${summary.id}`}
                        aria-label={`Actions for ${summary.name}`}
                      >
                        <MoreHorizontal size={12} />
                      </Button>
                    )}
                  />
                  <Menu.Portal>
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: OVERLAY_Z_INDEX,
                        pointerEvents: 'none',
                      }}
                    >
                      <div style={{ pointerEvents: 'auto' }}>
                        <Menu.Positioner
                          side={contextMenuAnchor !== null ? 'bottom' : undefined}
                          sideOffset={4}
                          align="start"
                          anchor={contextMenuAnchor ?? undefined}
                        >
                          <Menu.Popup
                            style={{ zIndex: OVERLAY_Z_INDEX }}
                            className="min-w-[140px] bg-bg-elevated border border-border-default rounded-lg shadow-lg overflow-hidden py-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-reduce:animate-none"
                            data-test-id={`collection-context-menu-${summary.id}`}
                          >
                            <Menu.Item
                              nativeButton={true}
                              label="Add Request"
                              className={cn(
                                focusRingClasses,
                                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer transition-colors',
                                'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus-visible:bg-bg-raised focus-visible:text-text-primary'
                              )}
                              onClick={handleMenuAddRequest}
                              closeOnClick={true}
                              data-test-id={`collection-menu-add-request-${summary.id}`}
                            >
                              <Plus size={12} className="shrink-0" />
                              <span>Add Request</span>
                            </Menu.Item>
                            {canRefreshSpec && (
                              <Menu.Item
                                nativeButton={true}
                                label="Refresh spec"
                                className={cn(
                                  focusRingClasses,
                                  'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer transition-colors',
                                  'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus-visible:bg-bg-raised focus-visible:text-text-primary'
                                )}
                                onClick={handleMenuRefreshSpec}
                                closeOnClick={true}
                                data-test-id={`collection-menu-refresh-spec-${summary.id}`}
                              >
                                <RefreshCw
                                  size={12}
                                  className={cn(
                                    'shrink-0',
                                    isRefreshing && 'motion-safe:animate-spin'
                                  )}
                                />
                                <span>{isRefreshing ? 'Refreshing…' : 'Refresh spec'}</span>
                              </Menu.Item>
                            )}
                            {canRefreshSpec && (
                              <Menu.Item
                                nativeButton={true}
                                label="Compare with file…"
                                className={cn(
                                  focusRingClasses,
                                  'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer transition-colors',
                                  'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus-visible:bg-bg-raised focus-visible:text-text-primary'
                                )}
                                onClick={handleMenuCompareWithFile}
                                closeOnClick={true}
                                data-test-id={`collection-menu-compare-with-file-${summary.id}`}
                              >
                                <FileDiff size={12} className="shrink-0" />
                                <span>Compare with file…</span>
                              </Menu.Item>
                            )}
                            <div className="my-1 h-px bg-border-subtle" role="separator" />
                            <Menu.Item
                              nativeButton={true}
                              label="Rename"
                              className={cn(
                                focusRingClasses,
                                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer transition-colors',
                                'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus-visible:bg-bg-raised focus-visible:text-text-primary'
                              )}
                              onClick={handleMenuRename}
                              closeOnClick={true}
                              data-test-id={`collection-menu-rename-${summary.id}`}
                            >
                              <Pencil size={12} className="shrink-0" />
                              <span>Rename</span>
                              <span className="ml-auto text-text-muted text-[10px]">F2</span>
                            </Menu.Item>
                            <Menu.Item
                              nativeButton={true}
                              label="Duplicate"
                              className={cn(
                                focusRingClasses,
                                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer transition-colors',
                                'text-text-secondary hover:bg-bg-raised hover:text-text-primary focus-visible:bg-bg-raised focus-visible:text-text-primary'
                              )}
                              onClick={handleMenuDuplicate}
                              closeOnClick={true}
                              data-test-id={`collection-menu-duplicate-${summary.id}`}
                            >
                              <Copy size={12} className="shrink-0" />
                              <span>Duplicate</span>
                            </Menu.Item>
                            <div className="my-1 h-px bg-border-subtle" role="separator" />
                            <Menu.Item
                              nativeButton={true}
                              label="Delete"
                              className={cn(
                                focusRingClasses,
                                'w-full px-3 py-1.5 text-xs text-left flex items-center gap-2 cursor-pointer transition-colors',
                                'text-signal-error hover:bg-signal-error/10 focus-visible:bg-signal-error/10'
                              )}
                              onClick={handleMenuDelete}
                              closeOnClick={true}
                              data-test-id={`collection-menu-delete-${summary.id}`}
                            >
                              <Trash2 size={12} className="shrink-0" />
                              <span>Delete</span>
                              <span className="ml-auto text-text-muted text-[10px]">Del</span>
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </div>
                    </div>
                  </Menu.Portal>
                </Menu.Root>
              </div>
            </div>
          </div>

          {/* Delete confirmation popover — rendered outside the menu */}
          <Popover open={deletePopoverOpen} onOpenChange={setDeletePopoverOpen}>
            <PopoverContent
              side="right"
              align="start"
              anchor={rowRef}
              className="w-56 p-3"
              data-test-id={`collection-delete-confirm-${summary.id}`}
            >
              <p className="text-sm text-text-primary mb-3">
                Delete <span className="font-medium">{summary.name}</span>?
              </p>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="xs"
                  noScale
                  onClick={() => {
                    setDeletePopoverOpen(false);
                  }}
                  data-test-id={`collection-delete-cancel-${summary.id}`}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="xs"
                  noScale
                  onClick={handleDelete}
                  data-test-id={`collection-delete-confirm-btn-${summary.id}`}
                >
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
      {isExpanded && (
        <div className="ml-3 border-l border-border-subtle pb-2" data-test-id="collection-requests">
          <RequestListComposite collectionId={summary.id} requests={sortedRequests} />
        </div>
      )}
      {driftResult !== undefined && driftResult.changed && (
        <DriftReviewDrawer collectionId={summary.id} driftResult={driftResult} />
      )}
    </div>
  );
};
