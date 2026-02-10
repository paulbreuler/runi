/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect } from 'vitest';
import { getParticipantColor, getActorLabel, getActorIcon } from './participantColors';
import type { Actor } from '@/hooks/useCollectionEvents';

const AI_ACTOR: Actor = { type: 'ai', model: 'claude-sonnet' };
const AI_NO_MODEL: Actor = { type: 'ai' };
const USER_ACTOR: Actor = { type: 'user' };
const SYSTEM_ACTOR: Actor = { type: 'system' };

describe('getParticipantColor', () => {
  it('returns purple for AI actors', () => {
    const color = getParticipantColor(AI_ACTOR);
    expect(color.cursor).toBe('var(--color-signal-ai)');
    expect(color.textClass).toBe('text-signal-ai');
    expect(color.dotClass).toBe('bg-signal-ai');
  });

  it('returns blue for user actors', () => {
    const color = getParticipantColor(USER_ACTOR);
    expect(color.cursor).toBe('var(--color-accent-blue)');
    expect(color.textClass).toBe('text-accent-blue');
  });

  it('returns gray for system actors', () => {
    const color = getParticipantColor(SYSTEM_ACTOR);
    expect(color.cursor).toBe('var(--color-text-muted)');
    expect(color.textClass).toBe('text-text-muted');
  });

  it('includes background and selection for all actor types', () => {
    for (const actor of [AI_ACTOR, USER_ACTOR, SYSTEM_ACTOR]) {
      const color = getParticipantColor(actor);
      expect(color.background).toBeTruthy();
      expect(color.selection).toBeTruthy();
    }
  });
});

describe('getActorLabel', () => {
  it('returns model name for AI with model', () => {
    expect(getActorLabel(AI_ACTOR)).toBe('claude-sonnet');
  });

  it('returns "AI" for AI without model', () => {
    expect(getActorLabel(AI_NO_MODEL)).toBe('AI');
  });

  it('returns "You" for user', () => {
    expect(getActorLabel(USER_ACTOR)).toBe('You');
  });

  it('returns "System" for system', () => {
    expect(getActorLabel(SYSTEM_ACTOR)).toBe('System');
  });
});

describe('getActorIcon', () => {
  it('returns "bot" for AI', () => {
    expect(getActorIcon(AI_ACTOR)).toBe('bot');
  });

  it('returns "user" for user', () => {
    expect(getActorIcon(USER_ACTOR)).toBe('user');
  });

  it('returns "cog" for system', () => {
    expect(getActorIcon(SYSTEM_ACTOR)).toBe('cog');
  });
});
