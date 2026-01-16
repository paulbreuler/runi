# Component Scaffold

Scaffold a new component, command, or utility with proper structure, tests, and Storybook story.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Parse the scaffold request:**
   - Format: `/scaffold <type> <name> [options]`
   - Types: `component`, `command`, `utility`, `store`
2. **Determine the target location:**
   - Components: `src/components/<Category>/<Name>.tsx`
   - Commands: `src-tauri/src/commands/<name>.rs`
   - Utilities: `src/utils/<name>.ts`
   - Stores: `src/stores/use<Name>Store.ts`
3. **Generate files:**
   - Main file with proper structure
   - Test file (failing test first - TDD)
   - Storybook story (for components)
   - Update exports if needed
4. **Follow runi's conventions:**
   - React 19 functional components with TypeScript
   - Zustand for global state
   - Motion 12 for animations (import from `motion/react`)
   - Rust pedantic clippy
   - Proper directory structure

## What This Does

This command scaffolds new code following runi's strict standards:

- **Components:** Creates React component with tests and Storybook story
- **Commands:** Creates Rust Tauri command with tests
- **Utilities:** Creates TypeScript utility with tests
- **Stores:** Creates Zustand store

All scaffolds follow TDD: test file is created first with failing tests.

## Usage

### In Cursor Chat

Type `/scaffold` followed by type and name:

```text
/scaffold component Request/RequestBuilder
```

```text
/scaffold command execute_request
```

```text
/scaffold utility url
```

```text
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

Creates a React component in the appropriate category directory:

```text
/scaffold component Request/RequestBuilder
```

**Generates:**

- `src/components/Request/RequestBuilder.tsx`
- `src/components/Request/RequestBuilder.test.tsx`
- `src/components/Request/RequestBuilder.stories.tsx`

**Structure:**

```tsx
import { useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * RequestBuilder component for constructing HTTP requests.
 */

interface RequestBuilderProps {
  initialUrl?: string;
  className?: string;
}

export const RequestBuilder = ({
  initialUrl = '',
  className,
}: RequestBuilderProps): JSX.Element => {
  // State
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);

  // Derived
  const isValid = url.length > 0;

  // Handlers
  const handleSend = async (): Promise<void> => {
    // Implementation
  };

  return (
    <motion.div
      className={cn('request-builder', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Component content */}
    </motion.div>
  );
};
```

### Command

Creates a Rust Tauri command:

```text
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

```text
/scaffold utility url
```

**Generates:**

- `src/utils/url.ts`
- `src/utils/url.test.ts`

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

### Store

Creates a Zustand store:

```text
/scaffold store request
```

**Generates:**

- `src/stores/useRequestStore.ts`
- `src/stores/useRequestStore.test.ts`

**Structure:**

```typescript
import { create } from 'zustand';

interface RequestState {
  url: string;
  method: string;
  loading: boolean;
  setUrl: (url: string) => void;
  setMethod: (method: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  url: '',
  method: 'GET',
  loading: false,
  setUrl: (url) => set({ url }),
  setMethod: (method) => set({ method }),
  setLoading: (loading) => set({ loading }),
}));
```

## Directory Structure

Components are organized by category:

- **Layout/** - App-level layout components (MainLayout, Sidebar, StatusBar)
- **Request/** - Request building components (RequestHeader, TabPanel, etc.)
- **Response/** - Response viewing components (ResponsePanel, StatusBadge, etc.)
- **Intelligence/** - AI and drift detection components
- **ui/** - Base UI components (button, input, select, etc.)

The scaffold command automatically determines the category from the path:

```text
/scaffold component Request/RequestBuilder  → src/components/Request/
/scaffold component Response/StatusBadge   → src/components/Response/
/scaffold component Layout/Sidebar         → src/components/Layout/
/scaffold component ui/Button             → src/components/ui/
```

## Naming Conventions

- **Components:** `PascalCase.tsx` (e.g., `RequestBuilder.tsx`)
- **Tests:** `ComponentName.test.tsx` (e.g., `RequestBuilder.test.tsx`)
- **Stories:** `ComponentName.stories.tsx` (e.g., `RequestBuilder.stories.tsx`)
- **Utilities:** `camelCase.ts` (e.g., `url.ts`)
- **Stores:** `use<Name>Store.ts` (e.g., `useRequestStore.ts`)
- **Commands:** `snake_case.rs` (e.g., `execute_request.rs`)

## TDD Workflow

Scaffolded tests are **failing by default** - this enforces TDD:

1. **RED:** Scaffold creates failing test
2. **GREEN:** Implement minimum code to pass
3. **REFACTOR:** Clean up while tests stay green

## Storybook Integration

Component scaffolds automatically include Storybook stories:

```tsx
// RequestBuilder.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { RequestBuilder } from './RequestBuilder';

const meta: Meta<typeof RequestBuilder> = {
  title: 'Request/RequestBuilder',
  component: RequestBuilder,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialUrl: 'https://api.example.com',
  },
};
```

## Examples

### Scaffold Request Component

```text
/scaffold component Request/RequestBuilder
```

Creates:

- Component with proper React 19 + TypeScript structure
- Failing test file (TDD)
- Storybook story with autodocs

### Scaffold Rust Command

```text
/scaffold command execute_request
```

Creates:

- Rust command with proper Tauri structure
- Doc comments for all public items
- Failing test file (TDD)

### Scaffold Utility Function

```text
/scaffold utility url
```

Creates:

- TypeScript utility with strict typing
- Failing test file (TDD)
- Proper exports

### Scaffold Zustand Store

```text
/scaffold store request
```

Creates:

- Zustand store with typed state and actions
- Failing test file (TDD)

## Related Commands

- `/test` - Generate tests for existing files
- `/code-review` - Review scaffolded code
- `just storybook` - View Storybook stories

## Notes

- **TDD Enforced:** All scaffolds include failing tests first
- **Consistent Structure:** Follows runi's established patterns
- **Type Safety:** All scaffolds use strict TypeScript/Rust
- **Documentation:** Components include Storybook stories
- **Motion 12:** Import from `motion/react`, not `framer-motion`
- **Zustand:** Use for global state, not React Context
