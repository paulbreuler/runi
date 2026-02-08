/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

export type FeatureState = 'hidden' | 'teaser' | 'experimental' | 'stable';

export interface FeatureFlags {
  http: HttpFlags;
  canvas: CanvasFlags;
  comprehension: ComprehensionFlags;
  ai: AiFlags;
  debug: DebugFlags;
}

export interface HttpFlags {
  collectionsEnabled: boolean;
  collectionsSaving: boolean;
  importBruno: boolean;
  importPostman: boolean;
  importOpenAPI: boolean;
  exportCurl: boolean;
  exportPython: boolean;
  exportJavaScript: boolean;
}

export interface CanvasFlags {
  enabled: boolean;
  minimap: boolean;
  connectionLines: boolean;
  snapToGrid: boolean;
}

export interface ComprehensionFlags {
  driftDetection: boolean;
  aiVerification: boolean;
  semanticLinks: boolean;
  temporalAwareness: boolean;
  specBinding: boolean;
}

export interface AiFlags {
  ollamaIntegration: boolean;
  naturalLanguageCommands: boolean;
  mcpGeneration: boolean;
  agenticTesting: boolean;
  aiSuggestedIntegrations: boolean;
}

export interface DebugFlags {
  verboseLogging: boolean;
  performanceOverlay: boolean;
  mockResponses: boolean;
  forceAllExperimental: boolean;
}

export interface FlagMetadata {
  addedVersion: string;
  expectedGraduation: string;
  description: string;
  state: FeatureState;
}

export type FlagMetadataRegistry = {
  [Group in keyof FeatureFlags]: {
    [Flag in keyof FeatureFlags[Group]]: FlagMetadata;
  };
};

export type DeepPartial<T> = T extends object ? { [Key in keyof T]?: DeepPartial<T[Key]> } : T;

export const isFeatureVisible = (state: FeatureState): boolean => state !== 'hidden';

export const isFeatureInteractive = (state: FeatureState): boolean =>
  state === 'experimental' || state === 'stable';
