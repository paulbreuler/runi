# Ralph Run 2C: Response Viewer & Polish

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**Prerequisites:**

- Run 1 (HTTP Core) must be complete
- Run 2A (Layout Foundation) must be complete
- Run 2B (Request Header & Response Basics) must be complete

**This Run's Focus:** Enhance the response viewer with JSON syntax highlighting, collapsible headers table, raw/pretty toggle, and complete all remaining Storybook stories. This completes the response viewing experience.

## Design Rationale

**Why This Third:** Users need to understand responses deeply. This run enables:

- Beautiful code display (syntax highlighting)
- Structured data viewing (headers table)
- Multiple view modes (raw vs pretty)
- Complete component library (all stories)

**User Value:** "I can read and understand API responses easily."

**Design Principles:**

- **Clean Sketchy Aesthetic:** Most of the interface is monochrome (using semantic grays like `bg-background`, `bg-card`, `text-foreground`, `bg-muted`). Color is reserved for meaningful, functional elements. Response viewer should be mostly grayscale.
- **Clean Code Display:** High contrast syntax highlighting, monospaced fonts. Use grayscale backgrounds with semantic tokens.
- **Readable Format:** Properly indented, easy to scan
- **Contextual Details:** Hover to see full header values, tooltips for guidance. Use grayscale hover states (`hover:bg-muted/50`).
- **Performance:** Fast rendering even for large responses (virtual scrolling)
- **Subtle Interactions:** Collapsible sections use smooth animations, not jarring transitions. Only use `cursor-pointer` on actual buttons/links.
- **Visual Hierarchy:** Tabs clearly indicate active state, headers are scannable. Use semantic tokens for most UI elements.

## High-Level Wireframe

```
+---------------+-----------------------------------+
|               | [Request Header Bar]              |
| [Sidebar]     |                                   |
|               | [Response Panel]                  |
|               | ┌─────────────────────────────┐  |
|               | │ Body │ Headers │ Stats      │  |
|               | ├─────────────────────────────┤  |
|               | │ {                            │  |
|               | │   "json": "highlighted"     │  |
|               | │ }                            │  |
|               | └─────────────────────────────┘  |
+---------------+-----------------------------------+
```

## Success Criteria (Machine-Verifiable)

All boxes must be checked AND tests must pass:

### JSON Syntax Highlighting

- [ ] Choose syntax highlighting library (Shiki recommended for Svelte 5 compatibility)
- [ ] Install syntax highlighting library (`npm install shiki` or similar)
- [ ] Create `BodyViewer.svelte` in `Response/` directory
- [ ] JSON syntax highlighting works for response bodies
- [ ] Code is properly formatted (indented, readable)
- [ ] Monospaced font for code display
- [ ] High contrast syntax highlighting (readable colors, clear backgrounds)
- [ ] Handles large responses efficiently (virtual scrolling or pagination)
- [ ] Handles non-JSON responses gracefully (fallback to plain text with monospaced font)
- [ ] Smooth rendering (no lag or freezing during syntax highlighting)
- [ ] Line numbers optional (for very large responses, nice-to-have)

### Response Headers Viewer

- [ ] Create `HeadersViewer.svelte` in `Response/` directory
- [ ] Uses shadcn Table component for headers display
- [ ] Headers displayed as key-value pairs
- [ ] Table is collapsible (can expand/collapse section)
- [ ] Headers are sortable (optional, nice-to-have)
- [ ] Long header values are truncated with ellipsis (hover to see full in tooltip)
- [ ] Sensitive headers (Authorization, Cookie) are masked in display
- [ ] Headers table is scannable (clear visual separation, alternating row colors optional)
- [ ] Hover effects are subtle (`hover:bg-muted/50`) not intrusive
- [ ] High contrast for header names and values (readable text)

### Response Panel Tabs

- [ ] Update `ResponsePanel.svelte` to use shadcn Tabs
- [ ] Three tabs: "Body", "Headers", "Stats"
- [ ] Active tab indicator works correctly
- [ ] Tab switching is smooth (no layout shift, subtle transition)
- [ ] Keyboard navigation between tabs (Arrow keys)
- [ ] Active tab is clearly indicated (high contrast, bold styling)
- [ ] Tabs use subtle hover effects (`hover:bg-muted/50`)

### Body Viewer Features

- [ ] Raw/Pretty toggle (or separate tabs: "Pretty" and "Raw")
- [ ] Pretty view: Syntax-highlighted, formatted JSON
- [ ] Raw view: Unformatted response body (as received)
- [ ] Copy to clipboard button (optional, nice-to-have) - subtle icon, clear feedback
- [ ] Word wrap toggle (optional, nice-to-have) - smooth transition when toggling
- [ ] High contrast for code display (readable on both light and dark themes)
- [ ] Smooth animations for view mode changes (200ms transitions)

### Stats Tab

- [ ] Create stats display in ResponsePanel
- [ ] Shows timing information (from TimingDisplay component)
- [ ] Shows response size
- [ ] Shows request method and URL
- [ ] Shows status code and status text
- [ ] Formatted nicely (key-value pairs or table)

### Error Handling

- [ ] Error responses display error message clearly
- [ ] Network errors show user-friendly messages with actionable guidance
- [ ] Timeout errors are distinguishable (clear messaging, not just "error")
- [ ] Error state is visually distinct (red border, error icon, high contrast)
- [ ] Error messages are actionable (suggest fixes when possible)
- [ ] Smooth error state transitions (subtle animation, not jarring)

### Storybook Stories

- [ ] `ResponsePanel.stories.svelte` - Response panel states
  - Story: "Success Response" - 200 OK with JSON body
  - Story: "Error Response" - 404 Not Found
  - Story: "Large Response" - Large JSON payload
  - Story: "Empty Response" - No body
- [ ] `BodyViewer.stories.svelte` - Body viewer states
  - Story: "JSON Pretty" - Formatted JSON with highlighting
  - Story: "JSON Raw" - Unformatted JSON
  - Story: "Plain Text" - Non-JSON response
  - Story: "Large Content" - Scrollable large response
- [ ] `HeadersViewer.stories.svelte` - Headers viewer
  - Story: "Expanded" - Headers table visible
  - Story: "Collapsed" - Headers table hidden
  - Story: "Many Headers" - Scrollable headers list
  - Story: "Sensitive Headers" - Masked Authorization header

### Quality Gates

- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] `just storybook` runs without errors
- [ ] All components use Svelte 5 runes
- [ ] `data-testid` attributes on ALL interactive elements:
  - `data-testid="body-viewer"`
  - `data-testid="headers-viewer"`
  - `data-testid="response-tabs"`
  - `data-testid="body-tab"`
  - `data-testid="headers-tab"`
  - `data-testid="stats-tab"`
- [ ] Keyboard navigation works (Tab order is logical)
- [ ] Syntax highlighting doesn't break on malformed JSON
- [ ] Large responses don't freeze the UI

## Syntax Highlighting Options

### Option 1: Shiki (Recommended)

**Pros:** Svelte 5 compatible, fast, good JSON support  
**Cons:** Larger bundle size

```bash
npm install shiki
```

### Option 2: CodeMirror

**Pros:** Feature-rich, extensible  
**Cons:** More complex integration, may need Svelte wrapper

```bash
npm install codemirror @codemirror/lang-json
```

### Option 3: Prism.js

**Pros:** Lightweight, simple  
**Cons:** Less modern, may need Svelte wrapper

```bash
npm install prismjs
```

**Recommendation:** Start with Shiki for best Svelte 5 compatibility.

**Syntax Highlighting:**

- Use high contrast themes (readable on both light and dark backgrounds)
- Monospaced fonts for all code
- Proper indentation and formatting (easy to scan)
- Fast rendering (optimize for large responses)

## Sample Code Reference

### BodyViewer.svelte (with Shiki)

```svelte
<script lang="ts">
  import { codeToHtml } from 'shiki';
  import { onMount } from 'svelte';
  import * as Tabs from '$lib/components/ui/tabs';

  interface Props {
    body: string;
    contentType?: string;
  }
  let { body, contentType = 'application/json' }: Props = $props();

  let viewMode = $state<'pretty' | 'raw'>('pretty');
  let highlightedHtml = $state<string>('');
  let isJson = $derived(contentType.includes('json'));

  onMount(async () => {
    if (isJson && viewMode === 'pretty') {
      try {
        highlightedHtml = await codeToHtml(body, {
          lang: 'json',
          theme: 'github-dark', // Match your theme
        });
      } catch {
        highlightedHtml = '';
      }
    }
  });

  $effect(() => {
    if (isJson && viewMode === 'pretty') {
      codeToHtml(body, { lang: 'json', theme: 'github-dark' })
        .then((html) => {
          highlightedHtml = html;
        })
        .catch(() => {
          highlightedHtml = '';
        });
    }
  });
</script>

<Tabs.Root
  value={viewMode}
  onValueChange={(v) => {
    if (v) viewMode = v as 'pretty' | 'raw';
  }}
>
  <Tabs.List>
    <Tabs.Trigger value="pretty" data-testid="body-tab-pretty">Pretty</Tabs.Trigger>
    <Tabs.Trigger value="raw" data-testid="body-tab-raw">Raw</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="pretty" data-testid="body-viewer-pretty">
    {#if isJson && highlightedHtml}
      {@html highlightedHtml}
    {:else}
      <pre class="font-mono text-sm whitespace-pre-wrap">{body}</pre>
    {/if}
  </Tabs.Content>
  <Tabs.Content value="raw" data-testid="body-viewer-raw">
    <pre class="font-mono text-sm whitespace-pre-wrap">{body}</pre>
  </Tabs.Content>
</Tabs.Root>
```

### HeadersViewer.svelte

```svelte
<script lang="ts">
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from '$lib/components/ui/table';
  import { ChevronDown, ChevronRight } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';

  interface Props {
    headers: Record<string, string>;
  }
  let { headers }: Props = $props();

  let expanded = $state(true);
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

  function maskValue(key: string, value: string): string {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      return '••••••••';
    }
    return value;
  }
</script>

<div class="border rounded-lg" data-testid="headers-viewer">
  <Button
    variant="ghost"
    class="w-full justify-between"
    onclick={() => {
      expanded = !expanded;
    }}
    data-testid="headers-toggle"
  >
    <span>Response Headers ({Object.keys(headers).length})</span>
    {#if expanded}
      <ChevronDown size={16} />
    {:else}
      <ChevronRight size={16} />
    {/if}
  </Button>
  {#if expanded}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {#each Object.entries(headers) as [key, value]}
          <TableRow>
            <TableCell class="font-mono text-sm">{key}</TableCell>
            <TableCell class="font-mono text-sm max-w-md truncate" title={value}>
              {maskValue(key, value)}
            </TableCell>
          </TableRow>
        {/each}
      </TableBody>
    </Table>
  {/if}
</div>
```

### ResponsePanel.svelte (Updated with Tabs)

```svelte
<script lang="ts">
  import * as Tabs from '$lib/components/ui/tabs';
  import StatusBadge from './StatusBadge.svelte';
  import TimingDisplay from './TimingDisplay.svelte';
  import BodyViewer from './BodyViewer.svelte';
  import HeadersViewer from './HeadersViewer.svelte';
  import type { HttpResponse } from '$lib/types/http';

  interface Props {
    response: HttpResponse | null;
    error: string | null;
  }
  let { response, error }: Props = $props();
</script>

<div class="flex flex-col h-full" data-testid="response-panel">
  {#if error}
    <div
      class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive"
      role="alert"
    >
      <strong>Error:</strong>
      {error}
    </div>
  {:else if response}
    <div class="flex items-center justify-between p-4 border-b border-border">
      <StatusBadge status={response.status} statusText={response.status_text} />
      <TimingDisplay timingMs={response.timing.total_ms} />
    </div>

    <Tabs.Root value="body" class="flex-1 flex flex-col" data-testid="response-tabs">
      <Tabs.List class="border-b">
        <Tabs.Trigger value="body" data-testid="body-tab">Body</Tabs.Trigger>
        <Tabs.Trigger value="headers" data-testid="headers-tab">Headers</Tabs.Trigger>
        <Tabs.Trigger value="stats" data-testid="stats-tab">Stats</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="body" class="flex-1 overflow-auto p-4">
        <BodyViewer body={response.body} contentType={response.headers['content-type']} />
      </Tabs.Content>
      <Tabs.Content value="headers" class="flex-1 overflow-auto p-4">
        <HeadersViewer headers={response.headers} />
      </Tabs.Content>
      <Tabs.Content value="stats" class="flex-1 overflow-auto p-4">
        <div class="space-y-2">
          <div><strong>Method:</strong> {response.method || 'N/A'}</div>
          <div><strong>URL:</strong> {response.url || 'N/A'}</div>
          <div><strong>Status:</strong> {response.status} {response.status_text}</div>
          <div><strong>Time:</strong> {response.timing.total_ms}ms</div>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  {:else}
    <div class="flex-1 flex items-center justify-center text-muted-foreground">
      No response yet. Send a request to see results.
    </div>
  {/if}
</div>
```

## Files to Create/Modify

### Dependencies

```bash
npm install shiki
npx shadcn-svelte@latest add tabs table
```

### Components to Create/Update

- `src/lib/components/Response/BodyViewer.svelte` (new)
- `src/lib/components/Response/HeadersViewer.svelte` (new)
- `src/lib/components/Response/ResponsePanel.svelte` (update with tabs)

### Stories to Create

- `src/lib/components/Response/ResponsePanel.stories.svelte`
- `src/lib/components/Response/BodyViewer.stories.svelte`
- `src/lib/components/Response/HeadersViewer.stories.svelte`

## Process

1. **Install dependencies** - shiki, shadcn tabs and table
2. **Build BodyViewer** - JSON syntax highlighting, raw/pretty toggle
3. **Build HeadersViewer** - Collapsible headers table
4. **Update ResponsePanel** - Add tabs (Body, Headers, Stats)
5. **Integrate** - Wire everything together
6. **Create stories** - Complete all remaining Storybook stories
7. **Test** - Verify syntax highlighting, tabs, headers all work
8. **Quality gates** - Run check, lint, storybook
9. **Polish** - Ensure smooth interactions, proper error handling

## Completion Signal

When ALL success criteria are met, output:

```text
<promise>RUN_2C_COMPLETE</promise>
```

Then update `@fix_plan.md` to mark completed items with [x].

**Note:** This completes PROMPT-2. All layout and response viewing features should now be complete.

## Out of Scope (Future Runs)

**DO NOT** work on:

- Tab content editors (Params/Headers/Body/Auth) - Run 3
- Collections/History functionality - Phase 3
- AI features - Phase 4
- MCP features - Phase 5

**Focus:** Response viewing experience only. Request building (tabs content) comes in Run 3.
