/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

export interface KeyValueEntry {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  /** Current entries to display */
  entries: KeyValueEntry[];
  /** Called when entries change (add, edit, remove) */
  onEntriesChange: (entries: KeyValueEntry[]) => void;
  /** Separator character between key and value */
  separator: ':' | '=';
  /** Placeholder for the key input */
  keyPlaceholder: string;
  /** Placeholder for the value input */
  valuePlaceholder: string;
  /** Test ID prefix for all data-test-id attributes */
  testIdPrefix: string;
  /** Accessible label prefix (e.g., "header" or "parameter") */
  labelPrefix: string;
}

/**
 * Shared key-value pair editor used by HeaderEditor and ParamsEditor.
 *
 * Provides an always-visible empty row at the bottom for adding new entries,
 * read-only display rows that click to edit, and hover-revealed delete buttons.
 */
export const KeyValueEditor = ({
  entries,
  onEntriesChange,
  separator,
  keyPlaceholder,
  valuePlaceholder,
  testIdPrefix,
  labelPrefix,
}: KeyValueEditorProps): React.JSX.Element => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [emptyRowKey, setEmptyRowKey] = useState('');
  const [emptyRowValue, setEmptyRowValue] = useState('');
  const shouldReduceMotion = useReducedMotion();
  const emptyRowKeyRef = useRef<HTMLInputElement>(null);

  const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 };
  const transition = shouldReduceMotion === true ? { duration: 0 } : springTransition;

  // --- Empty row (add new entry) ---

  const commitEmptyRow = useCallback((): void => {
    const trimmedKey = emptyRowKey.trim();
    if (trimmedKey.length === 0) {
      setEmptyRowKey('');
      setEmptyRowValue('');
      return;
    }

    onEntriesChange([...entries, { key: trimmedKey, value: emptyRowValue.trim() }]);
    setEmptyRowKey('');
    setEmptyRowValue('');

    requestAnimationFrame(() => {
      emptyRowKeyRef.current?.focus();
    });
  }, [emptyRowKey, emptyRowValue, entries, onEntriesChange]);

  const handleEmptyRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEmptyRow();
      } else if (e.key === 'Escape') {
        setEmptyRowKey('');
        setEmptyRowValue('');
        (e.target as HTMLInputElement).blur();
      }
    },
    [commitEmptyRow]
  );

  const handleEmptyRowValueKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitEmptyRow();
      } else if (e.key === 'Escape') {
        setEmptyRowKey('');
        setEmptyRowValue('');
        (e.target as HTMLInputElement).blur();
      }
    },
    [commitEmptyRow]
  );

  const handleEmptyRowValueBlur = useCallback((): void => {
    if (emptyRowKey.trim().length > 0) {
      commitEmptyRow();
    }
  }, [emptyRowKey, commitEmptyRow]);

  // --- Edit existing entry ---

  const startEdit = (index: number): void => {
    const entry = entries[index];
    if (entry === undefined) {
      return;
    }
    setEditingIndex(index);
    setEditKey(entry.key);
    setEditValue(entry.value);
  };

  const saveEdit = (): void => {
    if (editingIndex === null) {
      return;
    }
    const trimmedKey = editKey.trim();
    if (trimmedKey.length === 0) {
      setEditingIndex(null);
      return;
    }

    const updated = entries.map((entry, i) =>
      i === editingIndex ? { key: trimmedKey, value: editValue.trim() } : entry
    );
    onEntriesChange(updated);
    setEditingIndex(null);
    setEditKey('');
    setEditValue('');
  };

  const cancelEdit = (): void => {
    setEditingIndex(null);
    setEditKey('');
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  // --- Remove entry ---

  const removeEntry = (index: number): void => {
    onEntriesChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full w-full flex flex-col" data-test-id={`${testIdPrefix}-editor`}>
      <div className="flex-1 overflow-auto p-4" style={{ scrollbarGutter: 'stable' }}>
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {entries.map((entry, index) => (
              <motion.div
                key={`${String(index)}-${entry.key}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={transition}
                className="flex items-center gap-2 group"
              >
                {editingIndex === index ? (
                  <>
                    <Input
                      value={editKey}
                      onChange={(e) => {
                        setEditKey(e.target.value);
                      }}
                      onKeyDown={handleEditKeyDown}
                      placeholder={keyPlaceholder}
                      className="flex-1 font-mono text-sm"
                      noScale
                      autoFocus
                      data-test-id={`${testIdPrefix}-key-input-${String(index)}`}
                      aria-label={`${labelPrefix} name`}
                    />
                    <span className="text-text-muted">{separator}</span>
                    <Input
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                      }}
                      onKeyDown={handleEditKeyDown}
                      placeholder={valuePlaceholder}
                      className="flex-1 font-mono text-sm"
                      noScale
                      data-test-id={`${testIdPrefix}-value-input-${String(index)}`}
                      aria-label={`${labelPrefix} value`}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={cancelEdit}
                      className="text-text-muted hover:text-text-primary"
                      data-test-id={`${testIdPrefix}-cancel-edit-${String(index)}`}
                      aria-label={`Cancel editing`}
                    >
                      <X />
                    </Button>
                  </>
                ) : (
                  <>
                    <div
                      className={cn(
                        'flex-1 flex items-center gap-2 cursor-pointer',
                        focusRingClasses
                      )}
                      onClick={() => {
                        startEdit(index);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          startEdit(index);
                        }
                      }}
                      data-test-id={`${testIdPrefix}-row-${String(index)}`}
                      aria-label={`Edit ${entry.key} ${labelPrefix}`}
                    >
                      <Input
                        value={entry.key}
                        readOnly
                        tabIndex={-1}
                        className="flex-1 font-mono text-sm text-accent-blue font-medium pointer-events-none"
                        noScale
                        aria-hidden="true"
                      />
                      <span className="text-text-muted">{separator}</span>
                      <Input
                        value={entry.value}
                        readOnly
                        tabIndex={-1}
                        className="flex-1 font-mono text-sm text-text-secondary pointer-events-none"
                        noScale
                        aria-hidden="true"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        removeEntry(index);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 transition-opacity text-signal-error hover:text-signal-error hover:bg-signal-error/10"
                      data-test-id={`${testIdPrefix}-remove-${String(index)}`}
                      aria-label={`Remove ${entry.key} ${labelPrefix}`}
                    >
                      <X />
                    </Button>
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Always-visible empty row for adding new entries */}
          <div className="flex items-center gap-2" data-test-id={`${testIdPrefix}-empty-row`}>
            <Input
              ref={emptyRowKeyRef}
              value={emptyRowKey}
              onChange={(e) => {
                setEmptyRowKey(e.target.value);
              }}
              onKeyDown={handleEmptyRowKeyDown}
              placeholder={keyPlaceholder}
              className="flex-1 font-mono text-sm"
              noScale
              data-test-id={`${testIdPrefix}-empty-row-key`}
              aria-label={`New ${labelPrefix} name`}
            />
            <span className="text-text-muted">{separator}</span>
            <Input
              value={emptyRowValue}
              onChange={(e) => {
                setEmptyRowValue(e.target.value);
              }}
              onKeyDown={handleEmptyRowValueKeyDown}
              onBlur={handleEmptyRowValueBlur}
              placeholder={valuePlaceholder}
              className="flex-1 font-mono text-sm"
              noScale
              data-test-id={`${testIdPrefix}-empty-row-value`}
              aria-label={`New ${labelPrefix} value`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
