/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file Participant identity and Lamport timestamps for multiplayer-like provenance.
 *
 * Mirrors Rust types from `domain/participant.rs`.
 * Inspired by Zed's ReplicaId/ParticipantId pattern.
 */

/**
 * Identifies WHO made a change — the multiplayer "cursor".
 *
 * Maps to Zed's ParticipantId:
 * - User (replica 0) — the human at the keyboard
 * - System (replica 1) — automated runi actions
 * - Ai (replica 2) — AI agents via MCP
 */
export type ParticipantId =
  | { type: 'user' }
  | { type: 'system' }
  | { type: 'ai'; session_id?: string; model?: string };

/** Logical (Lamport) sequence number per participant. */
export type Seq = number;

/**
 * A Lamport timestamp: (participant, sequence).
 *
 * Provides causal ordering of events across participants.
 */
export interface LamportTimestamp {
  participant: ParticipantId;
  seq: Seq;
}

/** Check if a participant is an AI agent. */
export function isAiParticipant(
  p: ParticipantId
): p is { type: 'ai'; session_id?: string; model?: string } {
  return p.type === 'ai';
}

/** Check if a participant is the human user. */
export function isUserParticipant(p: ParticipantId): p is { type: 'user' } {
  return p.type === 'user';
}

/** Check if a participant is a system action. */
export function isSystemParticipant(p: ParticipantId): p is { type: 'system' } {
  return p.type === 'system';
}
