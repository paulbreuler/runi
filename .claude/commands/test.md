# Test Generation

Generate tests for the specified file or component following runi's TDD standards.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Identify the target file** from the user's message (file path after `/test`)
2. **Determine the test type:**
   - Rust files (`src-tauri/src/**/*.rs`) → Generate unit tests adjacent to source
   - Svelte components (`src/lib/components/**/*.svelte`) → Generate vitest component tests
   - TypeScript utilities (`src/lib/utils/**/*.ts`) → Generate vitest unit tests
3. **Follow TDD workflow:**
   - Write failing test first (RED)
   - Test should be meaningful and cover edge cases
   - Ensure ≥85% coverage target
4. **Generate test file** with proper structure and imports
5. **Provide implementation guidance** if needed

## What This Does

This command generates test files following runi's strict TDD standards:

- **Rust:** Unit tests in `*_test.rs` file adjacent to source (or in same file with `#[cfg(test)]`)
- **Svelte:** Component tests using `@testing-library/svelte` and vitest
- **TypeScript:** Unit tests using vitest with proper mocking

All tests follow the **RED → GREEN → REFACTOR** workflow.

## Usage

### In Cursor Chat

Type `/test` followed by the file path:

```text
/test src/lib/components/Request/RequestHeader.svelte
```

```text
/test src-tauri/src/commands/http.rs
```

```text
/test src/lib/utils/url.ts
```

**When invoked, this command will:**

1. Analyze the target file
2. Generate appropriate test file structure
3. Write failing tests first (TDD)
4. Provide guidance for implementation

### Via Command Palette

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Test: Generate Tests"
3. Enter file path when prompted

## Test Patterns

### Rust Tests

```rust
// src-tauri/src/commands/http_test.rs

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_execute_request_success() {
        // Test implementation
    }

    #[tokio::test]
    async fn test_execute_request_error() {
        // Test error handling
    }
}
```

### Svelte Component Tests

```typescript
// src/lib/components/Request/RequestHeader.test.ts

import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import RequestHeader from './RequestHeader.svelte';

test('renders URL input', () => {
  render(RequestHeader, { props: { initialUrl: 'https://api.example.com' } });
  expect(screen.getByPlaceholderText(/enter url/i)).toBeInTheDocument();
});
```

### TypeScript Utility Tests

```typescript
// src/lib/utils/url.test.ts

import { describe, it, expect } from 'vitest';
import { parseUrl } from './url';

describe('parseUrl', () => {
  it('parses valid URL', () => {
    expect(parseUrl('https://api.example.com/users')).toEqual({
      protocol: 'https:',
      host: 'api.example.com',
      pathname: '/users',
    });
  });

  it('handles invalid URL', () => {
    expect(() => parseUrl('not-a-url')).toThrow();
  });
});
```

## TDD Workflow

1. **RED:** Generate failing test first
   - Test should fail for the right reason
   - Test should be specific and meaningful
   - Tests should cover positive, negative, and edge cases

2. **GREEN:** Implement minimum code to pass
   - Write just enough code to make test pass
   - Don't over-engineer

3. **REFACTOR:** Clean up while tests stay green
   - Improve code quality
   - All tests must still pass

4. **COMMIT:** Only commit when tests pass
   - Run `just test` before commit
   - Ensure ≥85% coverage

## Coverage Requirements

- **Minimum:** 85% coverage for new code
- **Target:** 90%+ coverage for critical paths
- **Tools:**
  - Rust: `cargo tarpaulin`
  - Frontend: `vitest --coverage`

## Test Quality Standards

- **Meaningful:** Tests should verify behavior, not implementation
- **Isolated:** Each test should be independent
- **Fast:** Tests should run quickly (prefer unit tests over integration)
- **Clear:** Test names should describe what they test
- **Edge Cases:** Cover error conditions, boundary values

## Examples

### Generate Tests for Component

```text
/test src/lib/components/Response/StatusBadge.svelte
```

Generates:

- `StatusBadge.test.ts` with component tests
- Tests for different status codes (200, 404, 500)
- Tests for loading/error states

### Generate Tests for Rust Command

```text
/test src-tauri/src/commands/http.rs
```

Generates:

- `http_test.rs` with unit tests
- Tests for successful requests
- Tests for error handling
- Tests for timeout scenarios

### Generate Tests for Utility

```text
/test src/lib/utils/url.ts
```

Generates:

- `url.test.ts` with unit tests
- Tests for URL parsing
- Tests for URL validation
- Tests for edge cases (invalid URLs, special characters)

## Related Commands

- `/code-review` - Review code including tests
- `just test` - Run all tests
- `just test-coverage` - Run tests with coverage report

## Notes

- **TDD Required:** Tests must be written before implementation
- **Coverage Minimum:** 85% for new code
- **Test Isolation:** Each test must clean up its own state
- **Fast Feedback:** Prefer unit tests; use integration/E2E only when necessary
