/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Vigilance Monitor — AI Suggestion Panel
 *
 * Cross-context panel that displays AI-generated suggestions. Shows drift fixes,
 * schema updates, test gaps, and optimization hints. Each suggestion is actionable
 * (accept/dismiss) and links to its originating context.
 *
 * Design principles:
 * - "Clear all" is a destructive bulk action: visually isolated in the header, separated
 *   from per-card actions, uses text-signal-error on hover to signal danger.
 * - Card actions (Accept/Dismiss) are separated from card content by a top border divider,
 *   making it impossible to confuse them with bulk actions.
 * - Type chips are colored, pill-shaped, and scannable at a glance.
 * - Resolved suggestions are visually muted so pending items stay dominant.
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { AlertTriangle, Check, Eye, Lightbulb, TestTube, X, Zap } from 'lucide-react';
import { cn } from '@/utils/cn';
import { focusRingClasses } from '@/utils/accessibility';
import type { Suggestion } from '@/types/generated/Suggestion';
import type { SuggestionType } from '@/types/generated/SuggestionType';

interface SuggestionPanelProps {
  /** List of suggestions to display. */
  suggestions: Suggestion[];
  /** Callback when a suggestion is accepted. */
  onAccept: (id: string) => void;
  /** Callback when a suggestion is dismissed. */
  onDismiss: (id: string) => void;
  /** Callback when a suggestion's context link is clicked. */
  onNavigate?: (suggestion: Suggestion) => void;
  /** Callback to clear all pending suggestions. */
  onClearAll?: () => void;
  /** Backend error message, if any. */
  error?: string | null;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Icon, label, and color config per suggestion type.
 *
 * Colors follow the runi signal system:
 *   drift_fix   → amber  (warning: something has drifted)
 *   schema_update → blue (informational update)
 *   test_gap    → red    (missing coverage is a gap/error)
 *   optimization → purple/AI (intelligence insight)
 */
const typeConfig: Record<
  SuggestionType,
  {
    icon: React.ReactNode;
    label: string;
    textColor: string;
    bgColor: string;
  }
> = {
  drift_fix: {
    icon: <AlertTriangle className="size-3" />,
    label: 'Drift',
    textColor: 'text-signal-warning',
    bgColor: 'bg-signal-warning/10',
  },
  schema_update: {
    icon: <Eye className="size-3" />,
    label: 'Schema',
    textColor: 'text-accent-blue',
    bgColor: 'bg-accent-blue/10',
  },
  test_gap: {
    icon: <TestTube className="size-3" />,
    label: 'Test Gap',
    textColor: 'text-signal-error',
    bgColor: 'bg-signal-error/10',
  },
  optimization: {
    icon: <Zap className="size-3" />,
    label: 'Optimize',
    textColor: 'text-signal-ai',
    bgColor: 'bg-signal-ai/10',
  },
};

/**
 * Single suggestion card.
 *
 * Layout:
 *   [Type chip]  [source via]
 *   Title
 *   Description
 *   [endpoint link]   [action note]
 *   ─────────────────────────────  ← border divider (only for pending)
 *   [✓ Accept]  [✕ Dismiss]        ← well below content, never near "Clear all"
 */
const SuggestionCard = ({
  suggestion,
  onAccept,
  onDismiss,
  onNavigate,
}: {
  suggestion: Suggestion;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate?: (suggestion: Suggestion) => void;
}): React.JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const config = typeConfig[suggestion.suggestionType];
  const isPending = suggestion.status === 'pending';

  return (
    <motion.div
      layout
      initial={prefersReducedMotion === true ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion === true ? { opacity: 0 } : { opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-md border border-border-subtle/40 bg-bg-surface/30 overflow-hidden',
        !isPending && 'opacity-40'
      )}
      data-test-id={`suggestion-card-${suggestion.id}`}
    >
      {/* Card body */}
      <div className="px-3 pt-2.5 pb-2">
        {/* Row 1: type chip + source */}
        <div className="flex items-center gap-2 mb-1.5">
          {/* Type chip — colored pill, immediately scannable */}
          <span
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium',
              config.textColor,
              config.bgColor
            )}
            data-test-id={`suggestion-type-icon-${suggestion.id}`}
            aria-hidden="true"
          >
            {config.icon}
            <span data-test-id={`suggestion-type-label-${suggestion.id}`}>{config.label}</span>
          </span>

          {suggestion.source.length > 0 && (
            <span className="text-[9px] font-mono text-text-muted/60 truncate">
              via {suggestion.source}
            </span>
          )}
        </div>

        {/* Row 2: title */}
        <h4
          className="text-[11px] font-semibold text-text-primary leading-snug mb-1"
          data-test-id={`suggestion-title-${suggestion.id}`}
        >
          {suggestion.title}
        </h4>

        {/* Row 3: description */}
        <p
          className="text-[11px] text-text-muted leading-relaxed mb-1.5"
          data-test-id={`suggestion-description-${suggestion.id}`}
        >
          {suggestion.description}
        </p>

        {/* Row 4: context link + action note */}
        <div className="flex items-start justify-between gap-2">
          {suggestion.endpoint !== null && onNavigate !== undefined ? (
            <button
              type="button"
              onClick={(): void => {
                onNavigate(suggestion);
              }}
              className={cn(
                'text-[10px] font-mono text-accent-blue hover:text-accent-blue/80',
                'transition-colors cursor-pointer outline-none rounded-sm leading-none',
                focusRingClasses
              )}
              data-test-id={`suggestion-context-link-${suggestion.id}`}
              aria-label={`Navigate to ${suggestion.endpoint}`}
            >
              {suggestion.endpoint}
            </button>
          ) : (
            /* Keep the action node in layout even when no endpoint */
            <span />
          )}

          <div
            className="text-[9px] font-mono text-text-muted/50 leading-none text-right shrink-0"
            data-test-id={`suggestion-action-${suggestion.id}`}
          >
            {suggestion.action}
          </div>
        </div>
      </div>

      {/* Pending: action row separated by a border — impossible to confuse with "Clear all" */}
      {isPending && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 border-t border-border-subtle/30 bg-bg-app/20"
          role="group"
          aria-label="Suggestion actions"
        >
          <button
            type="button"
            onClick={(): void => {
              onAccept(suggestion.id);
            }}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded',
              'bg-signal-success/10 text-signal-success',
              'hover:bg-signal-success/20',
              'transition-colors cursor-pointer outline-none',
              focusRingClasses
            )}
            data-test-id={`suggestion-accept-${suggestion.id}`}
            aria-label={`Accept suggestion: ${suggestion.title}`}
          >
            <Check className="size-3 shrink-0" />
            Accept
          </button>

          <button
            type="button"
            onClick={(): void => {
              onDismiss(suggestion.id);
            }}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded',
              'bg-text-muted/5 text-text-muted',
              'hover:bg-text-muted/10 hover:text-text-secondary',
              'transition-colors cursor-pointer outline-none',
              focusRingClasses
            )}
            data-test-id={`suggestion-dismiss-${suggestion.id}`}
            aria-label={`Dismiss suggestion: ${suggestion.title}`}
          >
            <X className="size-3 shrink-0" />
            Dismiss
          </button>
        </div>
      )}

      {/* Resolved: status stamp */}
      {!isPending && (
        <div className="flex items-center gap-2 px-3 py-1 border-t border-border-subtle/20">
          <span className="text-[9px] font-mono text-text-muted/50 capitalize">
            {suggestion.status}
          </span>
          {suggestion.resolvedAt !== null && (
            <span className="text-[9px] font-mono text-text-muted/30">{suggestion.resolvedAt}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Vigilance Monitor — AI Suggestion Panel.
 *
 * Cross-context panel displaying all AI-generated suggestions with
 * type badges, context links, and accept/dismiss actions.
 *
 * "Clear all" is a destructive bulk action rendered at the far right of the
 * panel header — visually separated from all per-card actions by the card
 * borders and spacing below it. Hovering reveals text-signal-error to
 * communicate its destructive intent.
 */
export const SuggestionPanel = ({
  suggestions,
  onAccept,
  onDismiss,
  onNavigate,
  onClearAll,
  error,
  className,
}: SuggestionPanelProps): React.JSX.Element => {
  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      data-test-id="suggestion-panel"
      role="region"
      aria-label="AI Suggestions"
    >
      {/*
       * Header — only shown when there are pending suggestions.
       *
       * Structure:
       *   [Lightbulb icon]  [N pending badge]     [Clear all ←destructive]
       *
       * "Clear all" is right-aligned, visually distant from the badge,
       * and uses text-signal-error on hover to telegraph its danger.
       * It is NOT near any per-card Accept/Dismiss buttons.
       */}
      {pendingCount > 0 && (
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-border-subtle/30 shrink-0"
          data-test-id="suggestion-panel-header"
        >
          {/* Left: icon + count */}
          <div className="flex items-center gap-2">
            <Lightbulb className="size-3.5 text-signal-ai shrink-0" aria-hidden="true" />
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-[10px] font-bold rounded-full bg-signal-warning/20 text-signal-warning tabular-nums"
              data-test-id="suggestion-count-badge"
              aria-label={`${String(pendingCount)} pending suggestion${pendingCount === 1 ? '' : 's'}`}
            >
              {pendingCount}
            </span>
            <span className="text-[10px] text-text-muted/60 font-mono">pending</span>
          </div>

          {/* Right: "Clear all" — destructive bulk action, clearly separated from card actions */}
          {onClearAll !== undefined && (
            <button
              type="button"
              onClick={onClearAll}
              aria-label="Clear all suggestions"
              data-test-id="clear-all-suggestions"
              className={cn(
                'text-[10px] font-mono font-medium text-text-muted/50',
                'hover:text-signal-error',
                'transition-colors cursor-pointer outline-none rounded-sm px-1 py-0.5',
                'border border-transparent hover:border-signal-error/20',
                focusRingClasses
              )}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Error banner */}
      {error !== null && error !== undefined && (
        <div
          className="mx-2 mt-2 px-2.5 py-1.5 text-[10px] font-mono text-signal-error bg-signal-error/10 border border-signal-error/20 rounded shrink-0"
          data-test-id="suggestion-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Suggestion list */}
      <div
        className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5"
        data-test-id="suggestion-list"
        role="list"
        aria-label="Suggestions"
      >
        <AnimatePresence mode="popLayout">
          {suggestions.length === 0 ? (
            <div
              key="empty"
              className="flex flex-col items-center justify-center gap-2 h-full text-text-muted"
              data-test-id="suggestion-empty-state"
              role="listitem"
            >
              <Lightbulb size={24} className="opacity-30" aria-hidden="true" />
              <span className="text-xs">No suggestions yet</span>
              <span className="text-xs opacity-60">AI insights will appear here</span>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div key={suggestion.id} role="listitem">
                <SuggestionCard
                  suggestion={suggestion}
                  onAccept={onAccept}
                  onDismiss={onDismiss}
                  onNavigate={onNavigate}
                />
              </div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
