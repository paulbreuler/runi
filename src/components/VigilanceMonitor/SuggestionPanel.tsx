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
 */

import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { AlertTriangle, CheckCircle, Eye, Lightbulb, TestTube, X, Zap } from 'lucide-react';
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
  /** Additional CSS classes. */
  className?: string;
}

/** Icon and color mapping for suggestion types. */
const typeConfig: Record<SuggestionType, { icon: React.ReactNode; label: string; color: string }> =
  {
    drift_fix: {
      icon: <AlertTriangle className="size-3.5" />,
      label: 'Drift',
      color: 'text-signal-warning',
    },
    schema_update: {
      icon: <Eye className="size-3.5" />,
      label: 'Schema',
      color: 'text-accent-blue',
    },
    test_gap: {
      icon: <TestTube className="size-3.5" />,
      label: 'Test Gap',
      color: 'text-signal-error',
    },
    optimization: {
      icon: <Zap className="size-3.5" />,
      label: 'Optimize',
      color: 'text-signal-ai',
    },
  };

/**
 * Single suggestion card within the panel.
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
        'border border-border-subtle/40 rounded-md px-3 py-2.5 bg-bg-surface/30',
        !isPending && 'opacity-50'
      )}
      data-test-id={`suggestion-card-${suggestion.id}`}
    >
      {/* Header: type badge + title */}
      <div className="flex items-start gap-2">
        <span
          className={cn('mt-0.5 shrink-0', config.color)}
          data-test-id={`suggestion-type-icon-${suggestion.id}`}
        >
          {config.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className={cn('text-[9px] font-mono uppercase tracking-wider', config.color)}
              data-test-id={`suggestion-type-label-${suggestion.id}`}
            >
              {config.label}
            </span>
            {suggestion.source.length > 0 && (
              <span className="text-[9px] font-mono text-text-muted">via {suggestion.source}</span>
            )}
          </div>
          <h4
            className="text-xs font-medium text-text-primary leading-tight"
            data-test-id={`suggestion-title-${suggestion.id}`}
          >
            {suggestion.title}
          </h4>
          <p
            className="text-[11px] text-text-muted leading-relaxed mt-1"
            data-test-id={`suggestion-description-${suggestion.id}`}
          >
            {suggestion.description}
          </p>

          {/* Context link */}
          {suggestion.endpoint !== null && onNavigate !== undefined && (
            <button
              type="button"
              onClick={(): void => {
                onNavigate(suggestion);
              }}
              className={cn(
                'text-[10px] font-mono text-accent-blue hover:text-accent-blue/80 mt-1.5 cursor-pointer outline-none rounded-sm',
                focusRingClasses
              )}
              data-test-id={`suggestion-context-link-${suggestion.id}`}
              aria-label={`Navigate to ${suggestion.endpoint}`}
            >
              {suggestion.endpoint}
            </button>
          )}

          {/* Action description */}
          <div
            className="text-[10px] text-text-muted/70 mt-1.5 font-mono"
            data-test-id={`suggestion-action-${suggestion.id}`}
          >
            Action: {suggestion.action}
          </div>
        </div>
      </div>

      {/* Actions */}
      {isPending && (
        <div
          className="flex items-center gap-1.5 mt-2 pl-5.5"
          role="group"
          aria-label="Suggestion actions"
        >
          <button
            type="button"
            onClick={(): void => {
              onAccept(suggestion.id);
            }}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded',
              'bg-signal-success/10 text-signal-success hover:bg-signal-success/20',
              'transition-colors cursor-pointer outline-none',
              focusRingClasses
            )}
            data-test-id={`suggestion-accept-${suggestion.id}`}
            aria-label={`Accept suggestion: ${suggestion.title}`}
          >
            <CheckCircle className="size-3" />
            Accept
          </button>
          <button
            type="button"
            onClick={(): void => {
              onDismiss(suggestion.id);
            }}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded',
              'bg-text-muted/5 text-text-muted hover:bg-text-muted/10',
              'transition-colors cursor-pointer outline-none',
              focusRingClasses
            )}
            data-test-id={`suggestion-dismiss-${suggestion.id}`}
            aria-label={`Dismiss suggestion: ${suggestion.title}`}
          >
            <X className="size-3" />
            Dismiss
          </button>
        </div>
      )}

      {/* Resolved state */}
      {!isPending && (
        <div className="flex items-center gap-1.5 mt-2 pl-5.5">
          <span className="text-[10px] font-mono text-text-muted capitalize">
            {suggestion.status}
          </span>
          {suggestion.resolvedAt !== null && (
            <span className="text-[9px] font-mono text-text-muted/50">{suggestion.resolvedAt}</span>
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
 */
export const SuggestionPanel = ({
  suggestions,
  onAccept,
  onDismiss,
  onNavigate,
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
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-border-subtle/30"
        data-test-id="suggestion-panel-header"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="size-3.5 text-signal-ai" />
          <span className="text-xs font-medium text-text-primary">Vigilance Monitor</span>
          {pendingCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full bg-signal-warning/20 text-signal-warning"
              data-test-id="suggestion-count-badge"
              aria-label={`${String(pendingCount)} pending suggestions`}
            >
              {pendingCount}
            </span>
          )}
        </div>
      </div>

      {/* Suggestion list */}
      <div
        className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5"
        data-test-id="suggestion-list"
        role="list"
        aria-label="Suggestions"
      >
        <AnimatePresence mode="popLayout">
          {suggestions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
              data-test-id="suggestion-empty-state"
              role="listitem"
            >
              <Lightbulb className="size-6 text-text-muted/30 mb-2" />
              <p className="text-xs text-text-muted/50">No suggestions yet</p>
              <p className="text-[10px] text-text-muted/30 mt-1">AI insights will appear here</p>
            </motion.div>
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
