/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

import type { FlagMetadata, FlagMetadataRegistry } from './types';

const compareVersions = (left: string, right: string): number => {
  const normalize = (value: string): number[] => {
    const base = value.split('-')[0] ?? value;
    return base
      .split('.')
      .map((segment) => Number.parseInt(segment, 10))
      .map((segment) => (Number.isNaN(segment) ? 0 : segment));
  };

  const leftParts = normalize(left);
  const rightParts = normalize(right);
  const maxLength = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? 0;
    const rightValue = rightParts[index] ?? 0;
    if (leftValue > rightValue) {
      return 1;
    }
    if (leftValue < rightValue) {
      return -1;
    }
  }

  return 0;
};

export const isStaleFlag = (metadata: FlagMetadata, currentVersion: string): boolean => {
  if (metadata.expectedGraduation === 'never') {
    return false;
  }

  return compareVersions(currentVersion, metadata.expectedGraduation) > 0;
};

export const FLAG_METADATA: FlagMetadataRegistry = {
  http: {
    collectionsEnabled: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Enable collections navigation in the sidebar.',
      state: 'experimental',
    },
    collectionsSaving: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Allow saving and persisting collection changes.',
      state: 'hidden',
    },
    importBruno: {
      addedVersion: '0.3.0',
      expectedGraduation: 'never',
      description: 'Import Bruno collections into runi.',
      state: 'hidden',
    },
    importPostman: {
      addedVersion: '0.3.0',
      expectedGraduation: 'never',
      description: 'Import Postman collections and environments.',
      state: 'hidden',
    },
    importOpenAPI: {
      addedVersion: '0.4.0',
      expectedGraduation: 'never',
      description: 'Import OpenAPI specs into the HTTP client.',
      state: 'hidden',
    },
    exportCurl: {
      addedVersion: '0.4.0',
      expectedGraduation: 'never',
      description: 'Export requests as curl commands.',
      state: 'hidden',
    },
    exportPython: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.6.0',
      description: 'Export requests as Python code snippets.',
      state: 'hidden',
    },
    exportJavaScript: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.6.0',
      description: 'Export requests as JavaScript code snippets.',
      state: 'hidden',
    },
  },
  canvas: {
    enabled: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Enable the blueprint canvas view.',
      state: 'hidden',
    },
    minimap: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Show a minimap in the blueprint canvas.',
      state: 'hidden',
    },
    connectionLines: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Render connection lines between nodes.',
      state: 'hidden',
    },
    snapToGrid: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Snap canvas nodes to the grid.',
      state: 'hidden',
    },
    popout: {
      addedVersion: '0.7.0',
      expectedGraduation: '0.9.0',
      description: 'Open contexts in separate popout windows.',
      state: 'hidden',
    },
  },
  comprehension: {
    driftDetection: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Detect drift between requests and specs.',
      state: 'hidden',
    },
    aiVerification: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.8.0',
      description: 'Verify AI-generated requests against specs.',
      state: 'hidden',
    },
    semanticLinks: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.8.0',
      description: 'Suggest semantic links across specs.',
      state: 'hidden',
    },
    temporalAwareness: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Track API changes over time.',
      state: 'hidden',
    },
    specBinding: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Bind requests to OpenAPI specs.',
      state: 'hidden',
    },
  },
  ai: {
    ollamaIntegration: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Enable local Ollama models for suggestions.',
      state: 'hidden',
    },
    naturalLanguageCommands: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Control runi with natural language commands.',
      state: 'hidden',
    },
    mcpGeneration: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Generate MCP actions from AI prompts.',
      state: 'hidden',
    },
    agenticTesting: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Run agentic test flows across APIs.',
      state: 'hidden',
    },
    aiSuggestedIntegrations: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Surface AI-suggested API integrations.',
      state: 'hidden',
    },
  },
  intent: {
    inputTracking: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Track mouse vs. keyboard input to suppress focus rings for mouse users.',
      state: 'hidden',
    },
  },
  debug: {
    verboseLogging: {
      addedVersion: '0.4.5',
      expectedGraduation: '0.6.0',
      description: 'Enable verbose logging for troubleshooting.',
      state: 'hidden',
    },
    performanceOverlay: {
      addedVersion: '0.4.5',
      expectedGraduation: '0.6.0',
      description: 'Show performance overlay metrics.',
      state: 'hidden',
    },
    mockResponses: {
      addedVersion: '0.4.5',
      expectedGraduation: '0.6.0',
      description: 'Return mock responses for debugging.',
      state: 'hidden',
    },
    forceAllExperimental: {
      addedVersion: '0.4.5',
      expectedGraduation: '0.6.0',
      description: 'Force-enable all experimental features.',
      state: 'hidden',
    },
  },
};
