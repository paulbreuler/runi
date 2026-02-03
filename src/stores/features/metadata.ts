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
      state: 'stable',
    },
    collectionsSaving: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Allow saving and persisting collection changes.',
      state: 'teaser',
    },
    importBruno: {
      addedVersion: '0.3.0',
      expectedGraduation: 'never',
      description: 'Import Bruno collections into runi.',
      state: 'teaser',
    },
    importPostman: {
      addedVersion: '0.3.0',
      expectedGraduation: 'never',
      description: 'Import Postman collections and environments.',
      state: 'teaser',
    },
    importOpenAPI: {
      addedVersion: '0.4.0',
      expectedGraduation: 'never',
      description: 'Import OpenAPI specs into the HTTP client.',
      state: 'teaser',
    },
    exportCurl: {
      addedVersion: '0.4.0',
      expectedGraduation: 'never',
      description: 'Export requests as curl commands.',
      state: 'teaser',
    },
    exportPython: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.6.0',
      description: 'Export requests as Python code snippets.',
      state: 'teaser',
    },
    exportJavaScript: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.6.0',
      description: 'Export requests as JavaScript code snippets.',
      state: 'teaser',
    },
  },
  canvas: {
    enabled: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Enable the blueprint canvas view.',
      state: 'teaser',
    },
    minimap: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Show a minimap in the blueprint canvas.',
      state: 'teaser',
    },
    connectionLines: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Render connection lines between nodes.',
      state: 'teaser',
    },
    snapToGrid: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Snap canvas nodes to the grid.',
      state: 'teaser',
    },
    commandBar: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Enable command bar actions inside the canvas.',
      state: 'teaser',
    },
  },
  comprehension: {
    driftDetection: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Detect drift between requests and specs.',
      state: 'teaser',
    },
    aiVerification: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.8.0',
      description: 'Verify AI-generated requests against specs.',
      state: 'teaser',
    },
    semanticLinks: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.8.0',
      description: 'Suggest semantic links across specs.',
      state: 'teaser',
    },
    temporalAwareness: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Track API changes over time.',
      state: 'teaser',
    },
    specBinding: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.7.0',
      description: 'Bind requests to OpenAPI specs.',
      state: 'teaser',
    },
  },
  ai: {
    ollamaIntegration: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Enable local Ollama models for suggestions.',
      state: 'teaser',
    },
    naturalLanguageCommands: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Control runi with natural language commands.',
      state: 'teaser',
    },
    mcpGeneration: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Generate MCP actions from AI prompts.',
      state: 'teaser',
    },
    agenticTesting: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Run agentic test flows across APIs.',
      state: 'teaser',
    },
    aiSuggestedIntegrations: {
      addedVersion: '0.5.0',
      expectedGraduation: '0.9.0',
      description: 'Surface AI-suggested API integrations.',
      state: 'teaser',
    },
  },
  debug: {
    verboseLogging: {
      addedVersion: '0.4.5',
      expectedGraduation: '0.6.0',
      description: 'Enable verbose logging for troubleshooting.',
      state: 'teaser',
    },
    performanceOverlay: {
      addedVersion: '0.4.5',
      expectedGraduation: '0.6.0',
      description: 'Show performance overlay metrics.',
      state: 'teaser',
    },
    mockResponses: {
      addedVersion: '0.4.5',
      expectedGraduation: '0.6.0',
      description: 'Return mock responses for debugging.',
      state: 'teaser',
    },
    forceAllExperimental: {
      addedVersion: '0.4.5',
      expectedGraduation: '0.6.0',
      description: 'Force-enable all experimental features.',
      state: 'teaser',
    },
  },
};
