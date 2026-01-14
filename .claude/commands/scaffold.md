# Component Scaffold

Scaffold a new component, command, or utility with proper structure, tests, and Storybook story.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Parse the scaffold request:**
   - Format: `/scaffold <type> <name> [options]`
   - Types: `component`, `command`, `utility`, `store`
2. **Determine the target location:**
   - Components: `src/lib/components/<Category>/<Name>.svelte`
   - Commands: `src-tauri/src/commands/<name>.rs`
   - Utilities: `src/lib/utils/<name>.ts`
   - Stores: `src/lib/stores/<name>.ts`
3. **Generate files:**
   - Main file with proper structure
   - Test file (failing test first - TDD)
   - Storybook story (for components)
   - Update exports if needed
4. **Follow runi's conventions:**
   - Svelte 5 runes (`$state`, `$derived`, `$props`)
   - TypeScript strict mode
   - Rust pedantic clippy
   - Proper directory structure

## What This Does

This command scaffolds new code following runi's strict standards:

- **Components:** Creates Svelte component with tests and Storybook story
- **Commands:** Creates Rust Tauri command with tests
- **Utilities:** Creates TypeScript utility with tests
- **Stores:** Creates Svelte 5 runes-based store (if needed)

All scaffolds follow TDD: test file is created first with failing tests.

## Usage

### In Cursor Chat

Type `/scaffold` followed by type and name:

```
/scaffold component Request/RequestBuilder
```

```
/scaffold command execute_request
```

```
/scaffold utility url
```

```
/scaffold component Response/StatusBadge --with-storybook
```

**Options:**

- `--with-storybook` - Generate Storybook story (default for components)
- `--no-tests` - Skip test generation (not recommended, violates TDD)

### Via Command Palette

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Scaffold: Create Component/Command/Utility"
3. Enter type and name when prompted

## Scaffold Types

### Component

Creates a Svelte component in the appropriate category directory:

```
/scaffold component Request/RequestBuilder
```

**Generates:**

- `src/lib/components/Request/RequestBuilder.svelte`
- `src/lib/components/Request/RequestBuilder.test.ts`
- `src/lib/components/Request/RequestBuilder.stories.svelte`

**Structure:**

```svelte
<script lang="ts">
  /**
   * RequestBuilder component for constructing HTTP requests.
   */

  import type { RequestParams } from '$lib/types';

  // Props
  interface Props {
    initialUrl?: string;
  }
  let { initialUrl = '' }: Props = $props();

  // State (runes)
  let url = $state(initialUrl);
  let loading = $state(false);

  // Derived
  let isValid = $derived(url.length > 0);

  // Handlers
  async function handleSend(): Promise<void> {
    // Implementation
  }
</script>

<div class="request-builder">
  <!-- Component content -->
</div>
```

### Command

Creates a Rust Tauri command:

```
/scaffold command execute_request
```

**Generates:**

- `src-tauri/src/commands/execute_request.rs`
- `src-tauri/src/commands/execute_request_test.rs`

**Structure:**

```rust
//! Execute HTTP request command.

use serde::{Deserialize, Serialize};
use tauri::command;

/// Request parameters.
#[derive(Debug, Serialize, Deserialize)]
pub struct RequestParams {
    /// The target URL.
    pub url: String,
}

/// Execute an HTTP request.
///
/// # Errors
///
/// Returns an error string if the request fails.
#[command]
pub async fn execute_request(params: RequestParams) -> Result<String, String> {
    // Implementation
}
```

### Utility

Creates a TypeScript utility function:

```
/scaffold utility url
```

**Generates:**

- `src/lib/utils/url.ts`
- `src/lib/utils/url.test.ts`

**Structure:**

```typescript
/**
 * URL utility functions.
 */

/**
 * Parse a URL string into components.
 */
export function parseUrl(url: string): URL {
  return new URL(url);
}
```

## Directory Structure

Components are organized by category:

- **Layout/** - App-level layout components (MainLayout, Sidebar, StatusBar)
- **Request/** - Request building components (RequestHeader, TabPanel, etc.)
- **Response/** - Response viewing components (ResponsePanel, StatusBadge, etc.)
- **ui/** - shadcn-svelte base components (button, input, select, etc.)

The scaffold command automatically determines the category from the path:

```
/scaffold component Request/RequestBuilder  → src/lib/components/Request/
/scaffold component Response/StatusBadge   → src/lib/components/Response/
/scaffold component Layout/Sidebar         → src/lib/components/Layout/
/scaffold component ui/Button             → src/lib/components/ui/
```

## Naming Conventions

- **Components:** `PascalCase.svelte` (e.g., `RequestBuilder.svelte`)
- **Tests:** `ComponentName.test.ts` (e.g., `RequestBuilder.test.ts`)
- **Stories:** `ComponentName.stories.svelte` (e.g., `RequestBuilder.stories.svelte`)
- **Utilities:** `camelCase.ts` (e.g., `url.ts`)
- **Commands:** `snake_case.rs` (e.g., `execute_request.rs`)

## TDD Workflow

Scaffolded tests are **failing by default** - this enforces TDD:

1. **RED:** Scaffold creates failing test
2. **GREEN:** Implement minimum code to pass
3. **REFACTOR:** Clean up while tests stay green

## Storybook Integration

Component scaffolds automatically include Storybook stories:

```svelte
<!-- RequestBuilder.stories.svelte -->
<script lang="ts">
  import type { Meta, StoryObj } from '@storybook/svelte';
  import RequestBuilder from './RequestBuilder.svelte';

  const meta = {
    title: 'Request/RequestBuilder',
    component: RequestBuilder,
    tags: ['autodocs'],
  } satisfies Meta<RequestBuilder>;

  export default meta;
  type Story = StoryObj<typeof meta>;

  export const Default: Story = {
    args: {
      initialUrl: 'https://api.example.com',
    },
  };
</script>
```

## Examples

### Scaffold Request Component

```
/scaffold component Request/RequestBuilder
```

Creates:

- Component with proper Svelte 5 runes structure
- Failing test file (TDD)
- Storybook story with autodocs

### Scaffold Rust Command

```
/scaffold command execute_request
```

Creates:

- Rust command with proper Tauri structure
- Doc comments for all public items
- Failing test file (TDD)

### Scaffold Utility Function

```
/scaffold utility url
```

Creates:

- TypeScript utility with strict typing
- Failing test file (TDD)
- Proper exports

## Related Commands

- `/test` - Generate tests for existing files
- `/code-review` - Review scaffolded code
- `just storybook` - View Storybook stories

## Notes

- **TDD Enforced:** All scaffolds include failing tests first
- **Consistent Structure:** Follows runi's established patterns
- **Type Safety:** All scaffolds use strict TypeScript/Rust
- **Documentation:** Components include Storybook stories
