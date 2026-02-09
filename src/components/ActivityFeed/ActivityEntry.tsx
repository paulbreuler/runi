/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Single activity entry in the feed.
 *
 * Displays: [icon] [actor] [action] [target] [timestamp]
 * Purple highlight for AI entries.
 */

import { Bot, Cog, User } from 'lucide-react';
import type { ActivityEntry as ActivityEntryType } from '@/stores/useActivityStore';
import { getParticipantColor, getActorLabel } from '@/utils/participantColors';
import { cn } from '@/utils/cn';

interface ActivityEntryProps {
  entry: ActivityEntryType;
  onClick?: (entry: ActivityEntryType) => void;
}

const ACTION_LABELS: Record<string, string> = {
  created_collection: 'created collection',
  deleted_collection: 'deleted collection',
  added_request: 'added request',
  updated_request: 'updated request',
  executed_request: 'executed request',
  saved_collection: 'saved collection',
};

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  if (diff < 5000) {
    return 'just now';
  }
  if (diff < 60_000) {
    return `${String(Math.floor(diff / 1000))}s ago`;
  }
  if (diff < 3_600_000) {
    return `${String(Math.floor(diff / 60_000))}m ago`;
  }
  return `${String(Math.floor(diff / 3_600_000))}h ago`;
}

const ActorIcon = ({ type }: { type: 'user' | 'ai' | 'system' }): React.JSX.Element => {
  switch (type) {
    case 'ai':
      return <Bot size={14} aria-hidden="true" />;
    case 'system':
      return <Cog size={14} aria-hidden="true" />;
    default:
      return <User size={14} aria-hidden="true" />;
  }
};

export const ActivityEntry = ({ entry, onClick }: ActivityEntryProps): React.JSX.Element => {
  const color = getParticipantColor(entry.actor);
  const label = getActorLabel(entry.actor);
  const actionLabel = ACTION_LABELS[entry.action] ?? entry.action;
  const isAi = entry.actor.type === 'ai';

  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
        'hover:bg-bg-raised/40',
        isAi && 'border-l-2 border-signal-ai/30'
      )}
      data-test-id={`activity-entry-${entry.id}`}
      onClick={
        onClick !== undefined
          ? (): void => {
              onClick(entry);
            }
          : undefined
      }
      aria-label={`${label} ${actionLabel} ${entry.target}`}
    >
      <span className={cn('shrink-0', color.textClass)}>
        <ActorIcon type={entry.actor.type} />
      </span>
      <span className={cn('font-medium shrink-0', color.textClass)}>{label}</span>
      <span className="text-text-muted">{actionLabel}</span>
      <span className="text-text-primary truncate font-medium">&ldquo;{entry.target}&rdquo;</span>
      {entry.seq !== undefined && (
        <span className="text-text-muted/50 shrink-0" title={`Sequence ${String(entry.seq)}`}>
          #{String(entry.seq)}
        </span>
      )}
      <span className="text-text-muted/50 shrink-0 ml-auto">
        {formatRelativeTime(entry.timestamp)}
      </span>
    </button>
  );
};
