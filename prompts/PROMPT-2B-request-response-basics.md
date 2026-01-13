# Ralph Run 2B: Request Header & Response Basics

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**Prerequisites:** 
- Run 1 (HTTP Core) must be complete
- Run 2A (Layout Foundation) must be complete

**This Run's Focus:** Build the request header bar with colorful method selector and send button, plus basic response display with status badge and timing. This enables the core request/response flow.

## Design Rationale

**Why This Second:** Users need to send requests and see responses. This run enables:
- Visual request building (method selection, URL input)
- Request execution (send button with loading state)
- Response feedback (status, timing, basic body display)

**User Value:** "I can send HTTP requests and see the results."

**HTTPie-Inspired Design Principles:**
- **Color-Coded Methods:** Distinct, bold colors for each HTTP method (GET=green, POST=blue, etc.)
- **Clean Request Bar:** Minimal chrome, focus on URL and method
- **Immediate Feedback:** Status badges and timing visible immediately
- **High Contrast:** Code/data areas use monospaced fonts with clear backgrounds
- **Subtle Interactions:** Hover states are subtle (background color changes), not intrusive
- **Performance:** Fast response display, smooth loading states

## High-Level Wireframe

```
+---------------+-----------------------------------+
|               | [Request Header Bar]              |
| [Sidebar]     | [GET▼] [URL Input...] [Send →]   |
|               |                                   |
|               | [Response Area]                   |
|               | Status: 200 OK | 45ms             |
|               | ─────────────────────────────     |
|               | { "json": "response" }            |
+---------------+-----------------------------------+
```

## Success Criteria (Machine-Verifiable)

All boxes must be checked AND tests must pass:

### Request Header Component
- [ ] Create `RequestHeader.svelte` in `Request/` directory
- [ ] URL input with placeholder "Enter URL or paste cURL"
- [ ] Method selector dropdown with color-coded options:
  - GET: `bg-green-600 hover:bg-green-700 text-white`
  - POST: `bg-blue-600 hover:bg-blue-700 text-white`
  - PUT: `bg-yellow-600 hover:bg-yellow-700 text-white`
  - DELETE: `bg-red-600 hover:bg-red-700 text-white`
  - PATCH: `bg-purple-600 hover:bg-purple-700 text-white`
- [ ] Method colors apply dynamically based on selected method
- [ ] Method selector has bold, confident styling (method name is prominent)
- [ ] Send button with loading state (spinner icon from lucide-svelte, smooth animation)
- [ ] Send button disabled when URL is empty
- [ ] Send button disabled during request (loading state)
- [ ] Send icon from lucide-svelte (`Send` component)
- [ ] Enter key in URL input triggers send (when not loading)
- [ ] Subtle hover effects on interactive elements (`hover:bg-muted/50 transition-colors duration-200`)
- [ ] Tooltip on method selector explaining HTTP methods (optional, nice-to-have)
- [ ] High contrast for URL input (clear background, readable text)

### Request Integration
- [ ] RequestHeader integrates with existing `executeRequest` function
- [ ] RequestHeader replaces placeholder in MainLayout request pane
- [ ] Request state managed with Svelte 5 runes (`$state`)
- [ ] Loading state properly managed (prevents double-sends)

### Response Status Badge
- [ ] Create `StatusBadge.svelte` in `Response/` directory
- [ ] Color coding based on status code:
  - 2xx (200-299): Green (`bg-green-600` or `text-green-600`)
  - 3xx (300-399): Blue (`bg-blue-600` or `text-blue-600`)
  - 4xx (400-499): Yellow/Orange (`bg-yellow-600` or `text-yellow-600`)
  - 5xx (500-599): Red (`bg-red-600` or `text-red-600`)
- [ ] Displays status code and status text (e.g., "200 OK")
- [ ] Bold, confident styling (status is prominent and readable)
- [ ] Accessible (proper ARIA labels)
- [ ] Tooltip on hover showing status code meaning (optional, nice-to-have)
- [ ] High contrast colors (text is clearly readable on colored backgrounds)

### Response Timing Display
- [ ] Create `TimingDisplay.svelte` in `Response/` directory
- [ ] Displays total request time in milliseconds
- [ ] Displays response size (if available from HttpResponse)
- [ ] Compact format (e.g., "45ms • 1.2KB")
- [ ] Monospaced font for numbers (consistent with HTTPie's approach)
- [ ] High contrast for readability (clear text on muted background)
- [ ] Hover shows timing breakdown (optional, nice-to-have: DNS, connect, transfer times)

### Basic Response Panel
- [ ] Create `ResponsePanel.svelte` in `Response/` directory
- [ ] Displays status badge and timing in header area
- [ ] Displays response body in scrollable area
- [ ] High contrast for code/data (monospaced font, clear background)
- [ ] Basic error handling (shows error message if request fails)
- [ ] Error messages are clear and actionable (HTTPie-style guidance)
- [ ] Empty state when no response yet (helpful placeholder text)
- [ ] ResponsePanel replaces placeholder in MainLayout response pane
- [ ] Smooth transitions when response updates (fade-in or subtle animation)

### Storybook Stories
- [ ] `RequestHeader.stories.svelte` - Request header states
  - Story: "Default State" - Empty URL, GET method
  - Story: "With URL" - URL filled, ready to send
  - Story: "Loading State" - Request in progress
  - Story: "All Methods" - Show each method's color (GET, POST, PUT, DELETE, PATCH)
- [ ] `StatusBadge.stories.svelte` - Status badge variants
  - Story: "Success (200)" - Green badge
  - Story: "Created (201)" - Green badge
  - Story: "Redirect (301)" - Blue badge
  - Story: "Not Found (404)" - Yellow badge
  - Story: "Server Error (500)" - Red badge
- [ ] `TimingDisplay.stories.svelte` - Timing display
  - Story: "Fast Request" - 45ms, 1.2KB
  - Story: "Slow Request" - 2.3s, 15.8KB
  - Story: "Large Response" - 125ms, 2.4MB

### Quality Gates
- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] `just storybook` runs without errors
- [ ] All components use Svelte 5 runes
- [ ] `data-testid` attributes on ALL interactive elements:
  - `data-testid="request-header"`
  - `data-testid="method-select"`
  - `data-testid="url-input"`
  - `data-testid="send-button"`
  - `data-testid="response-panel"`
  - `data-testid="status-badge"`
  - `data-testid="timing-display"`
- [ ] Keyboard navigation works (Tab order: Method → URL → Send)
- [ ] Enter key triggers send when URL has focus
- [ ] Loading state prevents multiple simultaneous requests

## Sample Code Reference

### RequestHeader.svelte

```svelte
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import * as Select from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Send, Loader2 } from 'lucide-svelte';
  import { executeRequest } from '$lib/api/http';
  import { createRequestParams, type HttpMethod, type HttpResponse } from '$lib/types/http';

  // State
  let url = $state('https://httpbin.org/get');
  let method = $state<HttpMethod>('GET');
  let loading = $state(false);
  let response = $state<HttpResponse | null>(null);
  let error = $state<string | null>(null);

  // Method colors
  const methodColors: Record<string, string> = {
    GET: 'bg-green-600 hover:bg-green-700 text-white',
    POST: 'bg-blue-600 hover:bg-blue-700 text-white',
    PUT: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    DELETE: 'bg-red-600 hover:bg-red-700 text-white',
    PATCH: 'bg-purple-600 hover:bg-purple-700 text-white',
  };

  // Derived
  let isValidUrl = $derived(url.length > 0);
  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  // Handlers
  async function handleSend(): Promise<void> {
    if (!isValidUrl || loading) return;

    loading = true;
    error = null;
    response = null;

    try {
      const params = createRequestParams(url, method);
      response = await executeRequest(params);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !loading && isValidUrl) {
      handleSend();
    }
  }

  function handleMethodChange(value: string | undefined): void {
    if (value) {
      method = value as HttpMethod;
    }
  }

  // Expose response to parent (for ResponsePanel)
  export { response, error };
</script>

<div class="flex items-center gap-2 p-4 border-b border-border bg-background" data-testid="request-header">
  <Select.Root
    type="single"
    value={method}
    onValueChange={handleMethodChange}
    disabled={loading}
  >
    <Select.Trigger
      class="w-28 font-semibold {methodColors[method] ?? 'bg-gray-600 text-white'}"
      data-testid="method-select"
      aria-label="HTTP Method"
    >
      {method}
    </Select.Trigger>
    <Select.Content>
      {#each httpMethods as httpMethod (httpMethod)}
        <Select.Item value={httpMethod}>{httpMethod}</Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>

  <Input
    type="text"
    bind:value={url}
    onkeydown={handleKeyDown}
    placeholder="Enter URL or paste cURL"
    data-testid="url-input"
    disabled={loading}
    aria-label="Request URL"
    class="flex-1"
  />

  <Button
    onclick={handleSend}
    disabled={!isValidUrl || loading}
    data-testid="send-button"
    aria-label="Send Request"
    class="transition-colors duration-200"
  >
    {#if loading}
      <Loader2 size={16} class="animate-spin" />
      <span>Sending...</span>
    {:else}
      <Send size={16} />
      <span>Send</span>
    {/if}
  </Button>
</div>
```

**HTTPie-Inspired Notes:**
- Method selector: Bold, confident colors (GET=green-600, POST=blue-600, etc.)
- URL input: High contrast, clear placeholder, smooth focus states
- Send button: Smooth loading animation, clear disabled state
- Subtle transitions: `transition-colors duration-200` for all interactive elements
- No pointer cursor on non-clickable areas (only on actual buttons/links)

### StatusBadge.svelte

```svelte
<script lang="ts">
  interface Props {
    status: number;
    statusText: string;
  }
  let { status, statusText }: Props = $props();

  // Determine color based on status code
  let colorClass = $derived(() => {
    if (status >= 200 && status < 300) return 'bg-green-600 text-white';
    if (status >= 300 && status < 400) return 'bg-blue-600 text-white';
    if (status >= 400 && status < 500) return 'bg-yellow-600 text-white';
    if (status >= 500) return 'bg-red-600 text-white';
    return 'bg-gray-600 text-white';
  });
</script>

<span
  class="px-2 py-1 rounded text-sm font-semibold {colorClass()}"
  data-testid="status-badge"
  aria-label="HTTP Status {status} {statusText}"
>
  {status} {statusText}
</span>
```

### TimingDisplay.svelte

```svelte
<script lang="ts">
  interface Props {
    timingMs: number;
    sizeBytes?: number;
  }
  let { timingMs, sizeBytes }: Props = $props();

  let formattedSize = $derived(() => {
    if (!sizeBytes) return '';
    if (sizeBytes < 1024) return `${sizeBytes}B`;
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)}KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`;
  });
</script>

<span class="text-xs text-muted-foreground font-mono" data-testid="timing-display">
  {timingMs}ms{#if formattedSize()} • {formattedSize()}{/if}
</span>
```

## Files to Create/Modify

### Components to Create
- `src/lib/components/Request/RequestHeader.svelte`
- `src/lib/components/Response/ResponsePanel.svelte`
- `src/lib/components/Response/StatusBadge.svelte`
- `src/lib/components/Response/TimingDisplay.svelte`

### Stories to Create
- `src/lib/components/Request/RequestHeader.stories.svelte`
- `src/lib/components/Response/StatusBadge.stories.svelte`
- `src/lib/components/Response/TimingDisplay.stories.svelte`

### Components to Modify
- `src/lib/components/Layout/MainLayout.svelte` - Replace placeholders with RequestHeader and ResponsePanel

## Process

1. **Create Request directory** - `Request/` in components
2. **Create Response directory** - `Response/` in components
3. **Build RequestHeader** - Method selector, URL input, send button
4. **Build StatusBadge** - Color-coded status display
5. **Build TimingDisplay** - Timing and size metrics
6. **Build ResponsePanel** - Container for status, timing, body
7. **Integrate** - Wire RequestHeader to executeRequest, display response in ResponsePanel
8. **Create stories** - Storybook stories for all new components
9. **Test** - Verify request/response flow works end-to-end
10. **Quality gates** - Run check, lint, storybook

## Completion Signal

When ALL success criteria are met, output:

```text
<promise>RUN_2B_COMPLETE</promise>
```

Then update `@fix_plan.md` to mark completed items with [x].

## Out of Scope (Future Runs)

**DO NOT** work on:
- JSON syntax highlighting (Run 2C)
- Response headers table (Run 2C)
- Raw/Pretty toggle (Run 2C)
- Tab content editors (Run 3)
- Advanced response views (Run 2C)

**Focus:** Basic request/response flow. Simple body display is fine (no syntax highlighting yet).
