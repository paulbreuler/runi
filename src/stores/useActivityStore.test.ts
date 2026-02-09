/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useActivityStore, __resetActivityIdCounter, type ActivityEntry } from './useActivityStore';
import type { Actor } from '@/hooks/useCollectionEvents';

const AI_ACTOR: Actor = { type: 'ai', model: 'claude' };
const USER_ACTOR: Actor = { type: 'user' };
const SYSTEM_ACTOR: Actor = { type: 'system' };

function makeEntry(overrides: Partial<Omit<ActivityEntry, 'id'>> = {}): Omit<ActivityEntry, 'id'> {
  return {
    timestamp: new Date().toISOString(),
    actor: AI_ACTOR,
    action: 'created_collection',
    target: 'Test Collection',
    ...overrides,
  };
}

describe('useActivityStore', () => {
  beforeEach(() => {
    useActivityStore.setState({ entries: [] });
    __resetActivityIdCounter();
  });

  it('starts with empty entries', () => {
    expect(useActivityStore.getState().entries).toEqual([]);
  });

  it('adds an entry with auto-generated id', () => {
    useActivityStore.getState().addEntry(makeEntry());

    const { entries } = useActivityStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('activity-1');
    expect(entries[0].actor).toEqual(AI_ACTOR);
    expect(entries[0].action).toBe('created_collection');
    expect(entries[0].target).toBe('Test Collection');
  });

  it('prepends new entries (newest first)', () => {
    useActivityStore.getState().addEntry(makeEntry({ target: 'First' }));
    useActivityStore.getState().addEntry(makeEntry({ target: 'Second' }));

    const { entries } = useActivityStore.getState();
    expect(entries).toHaveLength(2);
    expect(entries[0].target).toBe('Second');
    expect(entries[1].target).toBe('First');
  });

  it('caps entries at 100', () => {
    for (let i = 0; i < 110; i++) {
      useActivityStore.getState().addEntry(makeEntry({ target: `Entry ${String(i)}` }));
    }

    expect(useActivityStore.getState().entries).toHaveLength(100);
  });

  it('preserves seq field when provided', () => {
    useActivityStore.getState().addEntry(makeEntry({ seq: 42 }));

    const { entries } = useActivityStore.getState();
    expect(entries[0].seq).toBe(42);
  });

  it('preserves targetId field when provided', () => {
    useActivityStore.getState().addEntry(makeEntry({ targetId: 'col_123' }));

    const { entries } = useActivityStore.getState();
    expect(entries[0].targetId).toBe('col_123');
  });

  it('clear removes all entries', () => {
    useActivityStore.getState().addEntry(makeEntry());
    useActivityStore.getState().addEntry(makeEntry());

    useActivityStore.getState().clear();

    expect(useActivityStore.getState().entries).toEqual([]);
  });

  it('prune removes entries older than 1 hour', () => {
    // Add an entry with a timestamp 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const recent = new Date().toISOString();

    useActivityStore.getState().addEntry(makeEntry({ timestamp: recent, target: 'Recent' }));
    useActivityStore.getState().addEntry(makeEntry({ timestamp: twoHoursAgo, target: 'Old' }));

    useActivityStore.getState().prune();

    const { entries } = useActivityStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0].target).toBe('Recent');
  });

  it('auto-prunes old entries on addEntry', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    // Directly set an old entry in state
    useActivityStore.setState({
      entries: [
        {
          id: 'old-1',
          timestamp: twoHoursAgo,
          actor: USER_ACTOR,
          action: 'deleted_collection',
          target: 'Old',
        },
      ],
    });

    // Adding a new entry should prune the old one
    useActivityStore.getState().addEntry(makeEntry({ target: 'New' }));

    const { entries } = useActivityStore.getState();
    expect(entries).toHaveLength(1);
    expect(entries[0].target).toBe('New');
  });

  it('supports all activity action types', () => {
    const actions = [
      'created_collection',
      'deleted_collection',
      'added_request',
      'updated_request',
      'executed_request',
      'saved_collection',
    ] as const;

    for (const action of actions) {
      useActivityStore.getState().addEntry(makeEntry({ action }));
    }

    expect(useActivityStore.getState().entries).toHaveLength(6);
  });

  it('supports all actor types', () => {
    useActivityStore.getState().addEntry(makeEntry({ actor: AI_ACTOR }));
    useActivityStore.getState().addEntry(makeEntry({ actor: USER_ACTOR }));
    useActivityStore.getState().addEntry(makeEntry({ actor: SYSTEM_ACTOR }));

    const { entries } = useActivityStore.getState();
    expect(entries).toHaveLength(3);
    expect(entries[0].actor.type).toBe('system');
    expect(entries[1].actor.type).toBe('user');
    expect(entries[2].actor.type).toBe('ai');
  });

  it('generates unique sequential ids', () => {
    useActivityStore.getState().addEntry(makeEntry());
    useActivityStore.getState().addEntry(makeEntry());
    useActivityStore.getState().addEntry(makeEntry());

    const { entries } = useActivityStore.getState();
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids).toContain('activity-1');
    expect(ids).toContain('activity-2');
    expect(ids).toContain('activity-3');
  });
});
