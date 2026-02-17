/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { Code, BookOpen, Save, Clock, CircleDot } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';

interface ActionButtonsProps {
  /** Handler for Code button click */
  onCode: () => void;
  /** Handler for Docs button click */
  onDocs: () => void;
  /** Handler for Save button click */
  onSave: () => void;
  /** Handler for History button click */
  onHistory: () => void;
  /** Whether a URL is provided (enables Code button) */
  hasUrl?: boolean;
  /** Whether the current tab has unsaved changes */
  isDirty?: boolean;
  /** Number of history entries to show as badge */
  historyCount?: number;
}

/**
 * ActionButtons - Icon button group for common actions.
 *
 * Provides quick access to:
 * - Test: Run tests for the current request
 * - Code: Generate code snippet
 * - Docs: Open API documentation
 * - Save: Save to collection (with dirty indicator)
 * - History: Toggle history panel (with count badge)
 * - Env: Environment selector (shows current environment)
 *
 * Features:
 * - Muted by default, emphasis on hover (Zen aesthetic)
 * - Context-aware states (disabled when no data available)
 * - Visual indicators (dirty dot, count badge)
 * - Keyboard accessible with focus rings
 */
export const ActionButtons = ({
  onCode,
  onDocs,
  onSave,
  onHistory,
  hasUrl = false,
  isDirty = false,
  historyCount = 0,
}: ActionButtonsProps): React.JSX.Element => {
  const iconSize = 15;
  const buttonClasses = cn(
    'relative flex items-center justify-center',
    'h-[34px] w-[34px]',
    'text-text-muted hover:text-text-primary',
    'hover:bg-bg-raised/50',
    'motion-safe:transition-colors motion-reduce:transition-none',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted',
    focusRingClasses
  );

  return (
    <div className="flex items-center gap-3" data-test-id="action-buttons">
      {/* Request actions: Code, Docs */}
      <div className="flex items-center gap-1" role="group" aria-label="Request actions">
        <button
          type="button"
          onClick={onCode}
          disabled={!hasUrl}
          className={buttonClasses}
          aria-label="Generate code snippet"
          data-test-id="action-code"
          title="Generate code"
        >
          <Code size={iconSize} />
        </button>

        <button
          type="button"
          onClick={onDocs}
          className={buttonClasses}
          aria-label="Open API documentation"
          data-test-id="action-docs"
          title="Open docs"
        >
          <BookOpen size={iconSize} />
        </button>
      </div>

      {/* State actions: Save, History */}
      <div className="flex items-center gap-1" role="group" aria-label="State actions">
        <button
          type="button"
          onClick={onSave}
          className={cn(buttonClasses, 'relative')}
          aria-label={isDirty ? 'Save to collection (unsaved changes)' : 'Save to collection'}
          data-test-id="action-save"
          title="Save to collection"
        >
          <Save size={iconSize} />
          {isDirty && (
            <CircleDot
              size={8}
              className="absolute top-1 right-1 text-signal-warning"
              data-test-id="save-dirty-indicator"
              aria-hidden="true"
            />
          )}
        </button>

        <button
          type="button"
          onClick={onHistory}
          className={cn(buttonClasses, 'relative')}
          aria-label="Toggle history panel"
          data-test-id="action-history"
          title="History"
        >
          <Clock size={iconSize} />
          {historyCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-medium text-text-primary bg-bg-elevated border border-border-subtle rounded-full"
              data-test-id="history-count-badge"
              aria-label={`${String(historyCount)} history entries`}
            >
              {historyCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
