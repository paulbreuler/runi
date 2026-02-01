/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { FeatureFlags } from './types';

export const DEFAULT_FLAGS: FeatureFlags = {
  http: {
    importBruno: true,
    importPostman: true,
    importOpenAPI: true,
    exportCurl: true,
    exportPython: false,
    exportJavaScript: false,
  },
  canvas: {
    enabled: false,
    minimap: false,
    connectionLines: false,
    snapToGrid: false,
    commandBar: false,
  },
  comprehension: {
    driftDetection: false,
    aiVerification: false,
    semanticLinks: false,
    temporalAwareness: false,
    specBinding: false,
  },
  ai: {
    ollamaIntegration: false,
    naturalLanguageCommands: false,
    mcpGeneration: false,
    agenticTesting: false,
    aiSuggestedIntegrations: false,
  },
  debug: {
    verboseLogging: false,
    performanceOverlay: false,
    mockResponses: false,
    forceAllExperimental: false,
  },
};
