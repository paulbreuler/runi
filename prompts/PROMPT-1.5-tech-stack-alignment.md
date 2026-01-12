# Ralph Run 1.5: SvelteKit Validation & E2E Testing

## CRITICAL: Avoid Premature Exit Triggers

**Ralph detects these words/phrases and may exit prematurely. NEVER use them:**
- ❌ "done", "complete", "finished", "completed"
- ❌ "all tasks complete", "project complete", "ready for review"
- ❌ "nothing to do", "no changes", "already implemented", "up to date"

**Use these alternatives instead:**
- ✅ "accomplished", "implemented", "created", "added"
- ✅ "moving to next task", "proceeding with..."
- ✅ "CONTINUING - more work ahead"

**At the END of EVERY response, output:**
```
STATUS: WORK_IN_PROGRESS
NEXT: [describe next task]
```

---

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**STATUS:** The SvelteKit implementation is complete and correct:
- Svelte 5 runes (`$state`, `$derived`, `$props`) properly used
- Button component follows shadcn-svelte CVA pattern
- Unit tests exist (Button.test.ts, cn.test.ts, http.test.ts)
- Storybook configured with Button.stories.svelte

**GAP:** No end-to-end testing validates that the application works as a user would experience it.

**THIS RUN ADDS:**
1. Playwright E2E testing infrastructure
2. Full user flow validation (URL → Send → Response)
3. Interaction tests (keyboard, loading states, errors)
4. Accessibility verification
5. Storybook visual validation

## Tech Stack (Reference Only - Already Correct)

- **SvelteKit** 2.49.x with **Svelte 5.46.x** (runes mandatory)
- **Tailwind CSS v4** with `@import 'tailwindcss'` syntax
- **shadcn-svelte** v1.1.0 for UI components
- **Tauri v2** for desktop runtime
- **Vitest** for unit tests
- **Playwright** for E2E tests (to be added)

## Phase 1: Playwright Infrastructure Setup

### 1.1 Install Playwright

```bash
npm init playwright@latest
# Choose: TypeScript, tests folder, GitHub Actions workflow, install browsers
```

### 1.2 Configure playwright.config.ts

**File:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 1.3 Create Tauri Mock Fixture

Since E2E tests run in a browser (not Tauri), we need to mock the Tauri invoke API.

**File:** `tests/fixtures/tauri-mock.ts`

```typescript
import { Page } from '@playwright/test';

export interface MockResponse {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  timing: {
    total_ms: number;
    dns_ms: number | null;
    connect_ms: number | null;
    tls_ms: number | null;
    first_byte_ms: number | null;
  };
}

export async function mockTauriInvoke(page: Page, responses: Record<string, MockResponse | Error>): Promise<void> {
  await page.addInitScript((responses) => {
    (window as any).__TAURI_INTERNALS__ = {
      invoke: async (cmd: string, args?: Record<string, unknown>) => {
        const response = responses[cmd];
        if (!response) {
          throw new Error(`No mock for command: ${cmd}`);
        }
        if (response instanceof Error) {
          throw response;
        }
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return response;
      },
    };
  }, responses);
}

export const mockSuccessResponse: MockResponse = {
  status: 200,
  status_text: 'OK',
  headers: { 'content-type': 'application/json' },
  body: '{"message": "Hello, World!"}',
  timing: {
    total_ms: 150,
    dns_ms: 10,
    connect_ms: 20,
    tls_ms: 30,
    first_byte_ms: 50,
  },
};

export const mock404Response: MockResponse = {
  status: 404,
  status_text: 'Not Found',
  headers: { 'content-type': 'application/json' },
  body: '{"error": "Not found"}',
  timing: {
    total_ms: 100,
    dns_ms: 10,
    connect_ms: 20,
    tls_ms: null,
    first_byte_ms: 40,
  },
};

export const mock500Response: MockResponse = {
  status: 500,
  status_text: 'Internal Server Error',
  headers: { 'content-type': 'application/json' },
  body: '{"error": "Server error"}',
  timing: {
    total_ms: 200,
    dns_ms: 10,
    connect_ms: 20,
    tls_ms: 30,
    first_byte_ms: 100,
  },
};
```

### 1.4 Add npm Scripts

**Update `package.json`:**

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Phase 2: Core HTTP Flow E2E Tests

**File:** `tests/e2e/http-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { mockTauriInvoke, mockSuccessResponse, mock404Response, mock500Response } from '../fixtures/tauri-mock';

test.describe('HTTP Request Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriInvoke(page, {
      execute_request: mockSuccessResponse,
    });
    await page.goto('/');
  });

  test('page loads with URL input and method selector', async ({ page }) => {
    await expect(page.getByTestId('url-input')).toBeVisible();
    await expect(page.getByTestId('method-select')).toBeVisible();
    await expect(page.getByTestId('send-button')).toBeVisible();
  });

  test('can enter URL in input field', async ({ page }) => {
    const urlInput = page.getByTestId('url-input');
    await urlInput.fill('https://api.example.com/users');
    await expect(urlInput).toHaveValue('https://api.example.com/users');
  });

  test('can select HTTP method from dropdown', async ({ page }) => {
    const methodSelect = page.getByTestId('method-select');
    await methodSelect.selectOption('POST');
    await expect(methodSelect).toHaveValue('POST');
  });

  test('Send button triggers request and shows response', async ({ page }) => {
    const urlInput = page.getByTestId('url-input');
    const sendButton = page.getByTestId('send-button');

    await urlInput.fill('https://httpbin.org/get');
    await sendButton.click();

    // Wait for response to appear
    await expect(page.getByTestId('response-panel')).toBeVisible();
    await expect(page.getByTestId('status-badge')).toContainText('200');
  });

  test('status badge shows green for 2xx responses', async ({ page }) => {
    await page.getByTestId('url-input').fill('https://httpbin.org/get');
    await page.getByTestId('send-button').click();

    const statusBadge = page.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveClass(/bg-green|text-green|green/);
  });

  test('status badge shows yellow for 4xx responses', async ({ page }) => {
    await mockTauriInvoke(page, { execute_request: mock404Response });
    await page.goto('/');

    await page.getByTestId('url-input').fill('https://httpbin.org/status/404');
    await page.getByTestId('send-button').click();

    const statusBadge = page.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveClass(/bg-yellow|text-yellow|yellow/);
  });

  test('status badge shows red for 5xx responses', async ({ page }) => {
    await mockTauriInvoke(page, { execute_request: mock500Response });
    await page.goto('/');

    await page.getByTestId('url-input').fill('https://httpbin.org/status/500');
    await page.getByTestId('send-button').click();

    const statusBadge = page.getByTestId('status-badge');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toHaveClass(/bg-red|text-red|red/);
  });

  test('response body displays correctly', async ({ page }) => {
    await page.getByTestId('url-input').fill('https://httpbin.org/get');
    await page.getByTestId('send-button').click();

    const responseBody = page.getByTestId('response-body');
    await expect(responseBody).toBeVisible();
    await expect(responseBody).toContainText('Hello, World!');
  });

  test('timing information displays', async ({ page }) => {
    await page.getByTestId('url-input').fill('https://httpbin.org/get');
    await page.getByTestId('send-button').click();

    await expect(page.getByTestId('response-timing')).toBeVisible();
    await expect(page.getByTestId('response-timing')).toContainText('ms');
  });
});
```

## Phase 3: Interaction E2E Tests

**File:** `tests/e2e/interactions.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { mockTauriInvoke, mockSuccessResponse } from '../fixtures/tauri-mock';

test.describe('User Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriInvoke(page, {
      execute_request: mockSuccessResponse,
    });
    await page.goto('/');
  });

  test('Enter key in URL input triggers send', async ({ page }) => {
    const urlInput = page.getByTestId('url-input');
    await urlInput.fill('https://httpbin.org/get');
    await urlInput.press('Enter');

    await expect(page.getByTestId('response-panel')).toBeVisible();
  });

  test('loading state shows during request', async ({ page }) => {
    // Add delay to mock to catch loading state
    await page.addInitScript(() => {
      (window as any).__TAURI_INTERNALS__ = {
        invoke: async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
          return {
            status: 200,
            status_text: 'OK',
            headers: {},
            body: '{}',
            timing: { total_ms: 500 },
          };
        },
      };
    });
    await page.goto('/');

    await page.getByTestId('url-input').fill('https://httpbin.org/get');
    await page.getByTestId('send-button').click();

    // Button should be disabled during loading
    await expect(page.getByTestId('send-button')).toBeDisabled();
  });

  test('error state displays error message on failure', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__TAURI_INTERNALS__ = {
        invoke: async () => {
          throw new Error('Connection refused');
        },
      };
    });
    await page.goto('/');

    await page.getByTestId('url-input').fill('https://invalid.local');
    await page.getByTestId('send-button').click();

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('Connection refused');
  });

  test('Send button disabled when URL is empty', async ({ page }) => {
    const urlInput = page.getByTestId('url-input');
    const sendButton = page.getByTestId('send-button');

    await urlInput.clear();
    await expect(sendButton).toBeDisabled();
  });

  test('method selector keyboard navigation works', async ({ page }) => {
    const methodSelect = page.getByTestId('method-select');
    await methodSelect.focus();
    await methodSelect.press('ArrowDown');
    await methodSelect.press('Enter');

    // Should have changed from default GET
    const value = await methodSelect.inputValue();
    expect(['POST', 'PUT', 'PATCH', 'DELETE']).toContain(value);
  });
});
```

## Phase 4: Accessibility E2E Tests

**File:** `tests/e2e/accessibility.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { mockTauriInvoke, mockSuccessResponse } from '../fixtures/tauri-mock';

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockTauriInvoke(page, {
      execute_request: mockSuccessResponse,
    });
    await page.goto('/');
  });

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    // Tab through all elements
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('url-input')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('method-select')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('send-button')).toBeFocused();
  });

  test('focus indicators are visible', async ({ page }) => {
    const urlInput = page.getByTestId('url-input');
    await urlInput.focus();

    // Check for focus ring classes
    const classes = await urlInput.getAttribute('class');
    expect(classes).toMatch(/focus|ring|outline/);
  });

  test('ARIA labels present on form controls', async ({ page }) => {
    await expect(page.getByTestId('url-input')).toHaveAttribute('aria-label');
    await expect(page.getByTestId('method-select')).toHaveAttribute('aria-label');
    await expect(page.getByTestId('send-button')).toHaveAccessibleName();
  });

  test('error messages have role="alert"', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__TAURI_INTERNALS__ = {
        invoke: async () => {
          throw new Error('Test error');
        },
      };
    });
    await page.goto('/');

    await page.getByTestId('url-input').fill('https://test.com');
    await page.getByTestId('send-button').click();

    const errorMessage = page.getByTestId('error-message');
    await expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  test('response panel is announced to screen readers', async ({ page }) => {
    await page.getByTestId('url-input').fill('https://httpbin.org/get');
    await page.getByTestId('send-button').click();

    const responsePanel = page.getByTestId('response-panel');
    await expect(responsePanel).toBeVisible();

    // Should have aria-live or role for announcements
    const ariaLive = await responsePanel.getAttribute('aria-live');
    const role = await responsePanel.getAttribute('role');
    expect(ariaLive || role).toBeTruthy();
  });
});
```

## Phase 5: Add Test IDs to Components

**CRITICAL:** The E2E tests rely on `data-testid` attributes. Ensure these exist in `src/routes/+page.svelte`:

Required test IDs:
- `url-input` - URL input field
- `method-select` - HTTP method dropdown
- `send-button` - Send request button
- `response-panel` - Response container
- `status-badge` - Status code badge
- `response-body` - Response body display
- `response-timing` - Timing information
- `error-message` - Error message display

## Success Criteria (Machine-Verifiable)

### Infrastructure
- [ ] Playwright installed (`npx playwright --version` works)
- [ ] `playwright.config.ts` exists and is valid
- [ ] `tests/fixtures/tauri-mock.ts` exists
- [ ] npm scripts added: `test:e2e`, `test:e2e:ui`

### E2E Tests Pass
- [ ] `npm run test:e2e` passes ALL tests (0 failures)
- [ ] Core flow tests: page load, URL input, method select, send, response display
- [ ] Interaction tests: Enter key, loading, error, disabled, keyboard nav
- [ ] Accessibility tests: keyboard access, focus, ARIA, alerts

### Component Test IDs
- [ ] All required `data-testid` attributes present in `+page.svelte`
- [ ] Test IDs match what E2E tests expect

### Code Quality
- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes (existing unit tests)
- [ ] `npm run build` succeeds

### Verification Commands

```bash
# 1. Install Playwright browsers (first time only)
npx playwright install

# 2. Run E2E tests
npm run test:e2e

# 3. Run E2E tests with UI (for debugging)
npm run test:e2e:ui

# 4. Verify unit tests still pass
npm run test -- --run

# 5. Full CI check
just ci
```

## Files to Create

```
playwright.config.ts              # Playwright configuration
tests/
├── e2e/
│   ├── http-flow.spec.ts         # Core HTTP request/response tests
│   ├── interactions.spec.ts      # User interaction tests
│   └── accessibility.spec.ts     # Accessibility validation tests
└── fixtures/
    └── tauri-mock.ts             # Tauri invoke mock
```

## Files to Modify

- `package.json` - Add Playwright deps and scripts
- `src/routes/+page.svelte` - Add missing `data-testid` attributes

## Strict Rules

1. **TDD for E2E tests** - Write test, see it fail, add test ID, see it pass
2. **No test skipping** - All tests must pass, no `.skip()` or `.todo()`
3. **Mock Tauri completely** - E2E tests run in browser, not Tauri
4. **Preserve existing tests** - Unit tests must continue passing
5. **Accessibility first** - Every interactive element needs keyboard access and ARIA
6. **NO premature completion signals** - Do NOT say "done", "complete", "finished", or output the `<promise>` tag until ALL tests pass (unit, E2E, lint, type check). If more work is needed, say "CONTINUING - more work needed" at the end of your response.

## Completion Signal

When ALL success criteria are met (all tests passing, all quality checks green), output:

```text
<promise>E2E_VALIDATION_COMPLETE</promise>
```

Then update `@fix_plan.md` to mark completed items with `[x]`.

---

**Reference:** This prompt replaces the original tech stack alignment focus. The SvelteKit implementation is already correct; this run validates it works end-to-end.
