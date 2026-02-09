/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Participant color system (Zed-inspired).
 *
 * Maps ParticipantId → color palette for multiplayer-like attribution.
 * AI gets reserved purple (#a855f7), matching runi's signal system.
 */

import type { Actor } from '@/hooks/useCollectionEvents';

/** Zed-style player color with cursor, background, and selection variants. */
export interface ParticipantColor {
  /** Primary color for cursor/dot indicators. */
  cursor: string;
  /** Subtle background tint for highlights. */
  background: string;
  /** Selection/border color for ghost nodes. */
  selection: string;
  /** Tailwind text class. */
  textClass: string;
  /** Tailwind bg class for dot indicators. */
  dotClass: string;
}

/** AI participant color — purple signal. */
const AI_COLOR: ParticipantColor = {
  cursor: '#a855f7',
  background: 'rgba(168, 85, 247, 0.06)',
  selection: 'rgba(168, 85, 247, 0.19)',
  textClass: 'text-signal-ai',
  dotClass: 'bg-signal-ai',
};

/** User participant color — blue (default runi accent). */
const USER_COLOR: ParticipantColor = {
  cursor: '#3b82f6',
  background: 'rgba(59, 130, 246, 0.06)',
  selection: 'rgba(59, 130, 246, 0.19)',
  textClass: 'text-accent-blue',
  dotClass: 'bg-accent-blue',
};

/** System participant color — gray/neutral. */
const SYSTEM_COLOR: ParticipantColor = {
  cursor: '#6b7280',
  background: 'rgba(107, 114, 128, 0.06)',
  selection: 'rgba(107, 114, 128, 0.19)',
  textClass: 'text-text-muted',
  dotClass: 'bg-text-muted',
};

/** Get the color palette for an actor. */
export function getParticipantColor(actor: Actor): ParticipantColor {
  switch (actor.type) {
    case 'ai':
      return AI_COLOR;
    case 'user':
      return USER_COLOR;
    case 'system':
      return SYSTEM_COLOR;
    default:
      return USER_COLOR;
  }
}

/** Get a human-readable label for an actor. */
export function getActorLabel(actor: Actor): string {
  switch (actor.type) {
    case 'ai':
      return actor.model ?? 'AI';
    case 'user':
      return 'You';
    case 'system':
      return 'System';
    default:
      return 'Unknown';
  }
}

/** Get the icon identifier for an actor. */
export function getActorIcon(actor: Actor): 'user' | 'bot' | 'cog' {
  switch (actor.type) {
    case 'ai':
      return 'bot';
    case 'user':
      return 'user';
    case 'system':
      return 'cog';
    default:
      return 'user';
  }
}
