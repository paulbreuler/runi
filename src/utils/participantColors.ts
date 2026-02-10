/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Participant color system for multiplayer-like attribution.
 *
 * Maps ParticipantId → color palette for multiplayer-like attribution.
 * AI gets reserved purple (#a855f7), matching runi's signal system.
 */

import type { Actor } from '@/hooks/useCollectionEvents';

/** Player color with cursor, background, and selection variants. */
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

/** AI participant color — purple signal. Uses CSS vars for theme/blur consistency. */
const AI_COLOR: ParticipantColor = {
  cursor: 'var(--color-signal-ai)',
  background: 'oklch(0.65 0.1 300 / 6%)',
  selection: 'oklch(0.65 0.1 300 / 19%)',
  textClass: 'text-signal-ai',
  dotClass: 'bg-signal-ai',
};

/** User participant color — blue (default runi accent). */
const USER_COLOR: ParticipantColor = {
  cursor: 'var(--color-accent-blue)',
  background: 'oklch(0.7 0.1 230 / 6%)',
  selection: 'oklch(0.7 0.1 230 / 19%)',
  textClass: 'text-accent-blue',
  dotClass: 'bg-accent-blue',
};

/** System participant color — gray/neutral. */
const SYSTEM_COLOR: ParticipantColor = {
  cursor: 'var(--color-text-muted)',
  background: 'oklch(0.65 0.01 240 / 6%)',
  selection: 'oklch(0.65 0.01 240 / 19%)',
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
