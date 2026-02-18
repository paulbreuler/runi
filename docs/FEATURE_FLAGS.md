# Feature Flags Reference

## Overview

Feature flags in runi support progressive disclosure across product layers and
allow safe experimentation without rebuilding. Flags are local-first and can be
hydrated from YAML config files in `~/.runi`.

### Layers

- Layer 0: HTTP Client (`http`)
- Layer 1: Spatial Canvas (`canvas`)
- Layer 2: Comprehension (`comprehension`)
- Layer 3: AI-Native (`ai`)
- Debug (`debug`)

### Progressive Disclosure States

- `hidden`: not visible in UI
- `teaser`: visible but not interactive
- `experimental`: visible and interactive with warning badge
- `stable`: fully integrated

## Flag Registry

### Layer 0: HTTP Client

| Flag                      | Default | State          | Description                                     |
| ------------------------- | ------- | -------------- | ----------------------------------------------- |
| `http.collectionsEnabled` | `true`  | `experimental` | Enable collections navigation in the sidebar.   |
| `http.collectionsSaving`  | `false` | `hidden`       | Allow saving and persisting collection changes. |
| `http.importBruno`        | `false` | `hidden`       | Import Bruno collections into runi.             |
| `http.importPostman`      | `false` | `hidden`       | Import Postman collections and environments.    |
| `http.importOpenAPI`      | `false` | `hidden`       | Import OpenAPI specs into the HTTP client.      |
| `http.exportCurl`         | `false` | `hidden`       | Export requests as curl commands.               |
| `http.exportPython`       | `false` | `hidden`       | Export requests as Python code snippets.        |
| `http.exportJavaScript`   | `false` | `hidden`       | Export requests as JavaScript code snippets.    |

### Layer 1: Spatial Canvas

| Flag                     | Default | State    | Description                             |
| ------------------------ | ------- | -------- | --------------------------------------- |
| `canvas.enabled`         | `false` | `hidden` | Enable the blueprint canvas view.       |
| `canvas.minimap`         | `false` | `hidden` | Show a minimap in the blueprint canvas. |
| `canvas.connectionLines` | `false` | `hidden` | Render connection lines between nodes.  |
| `canvas.snapToGrid`      | `false` | `hidden` | Snap canvas nodes to the grid.          |

### Layer 2: Comprehension

| Flag                              | Default | State    | Description                                 |
| --------------------------------- | ------- | -------- | ------------------------------------------- |
| `comprehension.driftDetection`    | `false` | `hidden` | Detect drift between requests and specs.    |
| `comprehension.aiVerification`    | `false` | `hidden` | Verify AI-generated requests against specs. |
| `comprehension.semanticLinks`     | `false` | `hidden` | Suggest semantic links across specs.        |
| `comprehension.temporalAwareness` | `false` | `hidden` | Track API changes over time.                |
| `comprehension.specBinding`       | `false` | `hidden` | Bind requests to OpenAPI specs.             |

### Layer 3: AI-Native

| Flag                         | Default | State    | Description                                  |
| ---------------------------- | ------- | -------- | -------------------------------------------- |
| `ai.ollamaIntegration`       | `false` | `hidden` | Enable local Ollama models for suggestions.  |
| `ai.naturalLanguageCommands` | `false` | `hidden` | Control runi with natural language commands. |
| `ai.mcpGeneration`           | `false` | `hidden` | Generate MCP actions from AI prompts.        |
| `ai.agenticTesting`          | `false` | `hidden` | Run agentic test flows across APIs.          |
| `ai.aiSuggestedIntegrations` | `false` | `hidden` | Surface AI-suggested API integrations.       |

### Intent

| Flag                   | Default | State    | Description                                                             |
| ---------------------- | ------- | -------- | ----------------------------------------------------------------------- |
| `intent.inputTracking` | `false` | `hidden` | Track mouse vs. keyboard input to suppress focus rings for mouse users. |

### Debug

| Flag                         | Default | State    | Description                                 |
| ---------------------------- | ------- | -------- | ------------------------------------------- |
| `debug.verboseLogging`       | `false` | `hidden` | Enable verbose logging for troubleshooting. |
| `debug.performanceOverlay`   | `false` | `hidden` | Show performance overlay metrics.           |
| `debug.mockResponses`        | `false` | `hidden` | Return mock responses for debugging.        |
| `debug.forceAllExperimental` | `false` | `hidden` | Force-enable all experimental features.     |

## Usage

### useFeatureFlag Hook

```tsx
const { enabled, state, isVisible } = useFeatureFlag('canvas', 'minimap');
```

### FeatureGate Component

```tsx
<FeatureGate layer="canvas" flag="minimap" fallback={<ComingSoon />}>
  <Minimap />
</FeatureGate>
```

## Configuration

### Team Config (`~/.runi/flags.yaml`)

```yaml
$schema: 'https://runi.dev/schema/flags/v1.json'

http:
  exportPython: true

canvas:
  enabled: true
```

### Personal Overrides (`~/.runi/flags.local.yaml`)

```yaml
canvas:
  minimap: true

debug:
  verboseLogging: true
```

### Merge Order

1. `DEFAULT_FLAGS` (code defaults)
2. `flags.yaml` (team overrides)
3. `flags.local.yaml` (personal overrides)
4. Runtime toggles (session)

## Flag Hygiene

- Use `{layer}.{featureName}` naming (example: `canvas.minimap`).
- Set `expectedGraduation` and review every 2-3 releases.
- Remove flags when features graduate to `stable`.
- Avoid committing `debug` flags in team config.
