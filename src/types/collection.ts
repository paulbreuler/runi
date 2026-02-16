/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * Collection types that exactly mirror Rust domain types.
 *
 * IMPORTANT: These types MUST match src-tauri/src/domain/collection/*.rs
 */

/** Schema URL for validation */
export const SCHEMA_URL = 'https://runi.dev/schema/collection/v1.json';

/** Current schema version - integer, not semver */
export const SCHEMA_VERSION = 1;

export type ExtensionFields = Record<`x-${string}`, unknown>;

export interface Collection extends ExtensionFields {
  $schema: string;
  version: number;
  id: string;
  metadata: CollectionMetadata;
  source: CollectionSource;
  auth?: AuthConfig;
  variables: Record<string, string>;
  requests: CollectionRequest[];
}

export interface CollectionMetadata {
  name: string;
  description?: string;
  tags: string[];
  created_at: string;
  modified_at: string;
}

export interface CollectionSource {
  source_type: SourceType;
  url?: string;
  hash?: string;
  spec_version?: string;
  fetched_at: string;
  source_commit?: string;
  repo_root?: string;
  spec_path?: string;
  ref_name?: string;
}

/** Request payload for the generic import command. */
export type { ImportCollectionRequest } from '@/types/generated/ImportCollectionRequest';

export type SourceType = 'openapi' | 'postman' | 'bruno' | 'insomnia' | 'curl' | 'manual' | 'mcp';

export interface CollectionRequest extends ExtensionFields {
  id: string;
  name: string;
  seq: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  params: RequestParam[];
  body?: RequestBody;
  auth?: AuthConfig;
  docs?: string;
  is_streaming: boolean;
  binding: SpecBinding;
  intelligence: IntelligenceMetadata;
  tags: string[];
}

export interface RequestParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestBody {
  type: BodyType;
  content?: string;
  file?: string;
}

export type BodyType = 'none' | 'json' | 'form' | 'raw' | 'graphql' | 'xml';

export interface AuthConfig {
  type: AuthType;
  token?: string;
  username?: string;
  password?: string;
  header?: string;
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'api_key';

export interface SpecBinding {
  operation_id?: string;
  path?: string;
  method?: string;
  bound_at?: string;
  is_manual: boolean;
}

export interface IntelligenceMetadata {
  ai_generated: boolean;
  generator_model?: string;
  verified?: boolean;
  drift_status?: DriftStatus;
  last_validated?: string;
}

export type DriftStatus = 'clean' | 'warning' | 'error';

export interface CollectionSummary {
  id: string;
  name: string;
  request_count: number;
  source_type: string;
  modified_at: string;
}

// ============================================
// Utility Functions
// ============================================

/** Check if a request is bound to an OpenAPI operation */
export function isBound(request: CollectionRequest): boolean {
  const { operation_id, path } = request.binding;
  const hasOperation = (operation_id?.length ?? 0) > 0;
  const hasPath = (path?.length ?? 0) > 0;
  return hasOperation || hasPath;
}

/** Check if a request was AI-generated */
export function isAiGenerated(request: CollectionRequest): boolean {
  return request.intelligence.ai_generated;
}

/** Get color class for drift status */
export function getDriftColor(status?: DriftStatus): string {
  switch (status) {
    case 'clean':
      return 'text-green-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
}

/** Get icon key for source type */
export function getSourceIcon(sourceType: SourceType): string {
  switch (sourceType) {
    case 'openapi':
      return 'source-openapi';
    case 'postman':
      return 'source-postman';
    case 'bruno':
      return 'source-bruno';
    case 'insomnia':
      return 'source-insomnia';
    case 'curl':
      return 'source-curl';
    case 'manual':
      return 'source-manual';
    case 'mcp':
      return 'source-mcp';
    default:
      return 'source-collection';
  }
}

/**
 * Sort requests by seq with id tiebreaker.
 *
 * WHY TIEBREAKER IS NEEDED:
 * When two devs add requests on different branches, both calculate
 * max(seq) + 1 and get the same seq value. Git merge succeeds
 * (different lines), but we end up with duplicate seq values.
 *
 * The id tiebreaker ensures deterministic ordering even with duplicates.
 */
export function sortRequests(requests: CollectionRequest[]): CollectionRequest[] {
  return [...requests].sort((a, b) => {
    if (a.seq !== b.seq) {
      return a.seq - b.seq;
    }
    return a.id.localeCompare(b.id);
  });
}

/** Get the next seq value for a new request. */
export function getNextSeq(requests: CollectionRequest[]): number {
  if (requests.length === 0) {
    return 1;
  }
  const maxSeq = Math.max(...requests.map((request) => request.seq));
  return maxSeq + 1;
}

/** Create default SpecBinding */
export function createDefaultBinding(): SpecBinding {
  return { is_manual: false };
}

/** Create default IntelligenceMetadata */
export function createDefaultIntelligence(): IntelligenceMetadata {
  return { ai_generated: false };
}
