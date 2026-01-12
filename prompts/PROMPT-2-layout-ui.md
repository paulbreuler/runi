# Ralph Run 2: Layout & Response UI

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**Prerequisites:** Run 1 (HTTP Core) must be complete.

**This Run's Focus:** Build the three-panel layout with resizable panes and response viewer.

## High-Level Wireframe

runi uses a distraction-free, developer-focused layout: a collapsible left sidebar for navigation (collections, history), a central vertical split-pane dividing the top request builder from the bottom response viewer, and subtle accents for interactivity.

```
[Native Tauri Titlebar: Window controls, app menu]

+---------------+-----------------------------------+
|               | [Request Builder]                 |
| [Sidebar]     | - Method Dropdown (colored) + URL |
| (Collapsible) |   Input + Send Button             |
| - Spaces      | - Tabs: Params | Headers | Body   |
| - Collections |         | Auth | Preview        |
| - History     | - Body Editor (syntax-highlighted)|
| (Drag-drop)   |                                   |
+---------------+-----------------------------------+
|               | [Resizable Divider]               |
+---------------+-----------------------------------+
|               | [Response Viewer]                 |
|               | - Tabs: Body | Headers | Stats    |
|               | - Body: Rendered/Source/JSONPath  |
|               | - Headers: Collapsible Table      |
|               | - Stats: Timing/Size (hover)      |
+---------------+-----------------------------------+

[Status Bar: Environment switcher, AI prompt (⌘I), variables]
```

**Design Principles:**

- Request builder occupies top ~40% by default (resizable vertically)
- Response viewer below, expanding to fill remaining space
- Real-time preview as a toggleable right panel within request builder or bottom tab
- Native Tauri window controls handle titlebar functions (no custom bars)
- Dark mode default with system auto-switch for themes
- Minimal, intuitive flow: build requests top, view responses bottom, manage library left

## Component Library: shadcn-svelte

Use [shadcn-svelte](https://www.shadcn-svelte.com/) components as the foundation. These are accessible, theme-aware, and Tailwind-based.

### Key Components & Rationale

| Component                                                          | Use Case                                                                         | Why                                                                                                                |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [Input](https://www.shadcn-svelte.com/docs/components/input)       | URL bar                                                                          | Supports placeholders, validation, cURL paste/auto-complete; customizable for inline query/path param highlighting |
| [Select](https://www.shadcn-svelte.com/docs/components/select)     | Method dropdown (GET, POST, etc.)                                                | Colorful custom triggers (e.g., `bg-green-600` for GET), popover content for vibrant method-specific styling       |
| [Tabs](https://www.shadcn-svelte.com/docs/components/tabs)         | Request builder (Params/Headers/Body/Auth), Response viewer (Body/Headers/Stats) | Accessible, theme-aware tab switching with minimal overhead                                                        |
| [Textarea](https://www.shadcn-svelte.com/docs/components/textarea) | Body editor base                                                                 | Multi-line input with auto-resizing; extend with CodeMirror for syntax highlighting                                |
| [Card](https://www.shadcn-svelte.com/docs/components/card)         | Request/response panels, preview                                                 | Subtle shadows/rounded corners for premium feel; built-in header/content/footer slots                              |
| [Table](https://www.shadcn-svelte.com/docs/components/table)       | Response headers (collapsible)                                                   | Clean, sortable key-value display with hover effects                                                               |
| [Resizable](https://paneforge.dev/)                                | Vertical split pane                                                              | Drag-and-drop resizing via paneforge for Svelte compatibility                                                      |

### Theme Integration

Use shadcn-svelte's built-in Tailwind config for dark/light modes with cyan/blue accents:

- Automatic system theme switching
- High contrast in light mode
- Monospaced fonts for code/data
- See: https://www.shadcn-svelte.com/docs/theming

## Success Criteria (Machine-Verifiable)

All boxes must be checked AND tests must pass:

### Layout Structure

- [ ] Three-panel layout component (sidebar, request panel, response panel)
- [ ] Responsive panel resizing with paneforge drag handles
- [ ] Sidebar collapsible with `⌘B` keyboard shortcut
- [ ] Sidebar sections: Collections, History (placeholder content OK)
- [ ] Status bar with environment indicator

### Request Header Bar

- [ ] URL input with placeholder "Enter URL or paste cURL"
- [ ] Method selector dropdown with color-coded options:
  - GET: `bg-green-600`
  - POST: `bg-blue-600`
  - PUT: `bg-yellow-600`
  - DELETE: `bg-red-600`
  - PATCH: `bg-purple-600`
- [ ] Send button with loading state (spinner while request in flight)
- [ ] Icons from lucide-svelte (Send icon on button)

### Response Viewer

- [ ] Response status badge with color coding (2xx green, 4xx yellow, 5xx red)
- [ ] JSON syntax highlighting in response body (use Shiki or CodeMirror)
- [ ] Response headers display in collapsible Table component
- [ ] Response timing metrics display (total time, size)
- [ ] Raw/Pretty toggle for body view using Tabs
- [ ] Error handling UI for failed requests

### Storybook Stories (Required)

- [ ] `MainLayout.stories.svelte` - Shows layout with mock content
- [ ] `Sidebar.stories.svelte` - Collapsed/expanded states
- [ ] `StatusBar.stories.svelte` - Environment switcher states
- [ ] `RequestHeader.stories.svelte` - All HTTP methods, loading state
- [ ] `ResponsePanel.stories.svelte` - Success/error responses
- [ ] `StatusBadge.stories.svelte` - 2xx/3xx/4xx/5xx variants
- [ ] `BodyViewer.stories.svelte` - JSON/raw toggle, large content
- [ ] `HeadersViewer.stories.svelte` - Collapsed/expanded table
- [ ] `TimingDisplay.stories.svelte` - Various timing values

### Quality Gates

- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] `just storybook` runs without errors
- [ ] All components use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- [ ] `data-testid` attributes on ALL interactive elements
- [ ] WCAG 2.1 AA: focus indicators, keyboard navigation

## Sample Code Reference

### RequestHeader.svelte (Method Dropdown + URL Bar + Send)

```svelte
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '$lib/components/ui/select';
  import { Button } from '$lib/components/ui/button';
  import { Send } from 'lucide-svelte';

  let method = $state('GET');
  let url = $state('');
  let loading = $state(false);

  const methodColors: Record<string, string> = {
    GET: 'bg-green-600 hover:bg-green-700',
    POST: 'bg-blue-600 hover:bg-blue-700',
    PUT: 'bg-yellow-600 hover:bg-yellow-700',
    DELETE: 'bg-red-600 hover:bg-red-700',
    PATCH: 'bg-purple-600 hover:bg-purple-700',
  };

  async function handleSend(): Promise<void> {
    loading = true;
    // invoke execute_request...
    loading = false;
  }
</script>

<div class="flex items-center space-x-2 p-4 bg-background border-b">
  <Select bind:value={method}>
    <SelectTrigger
      class="w-[100px] {methodColors[method] ?? 'bg-gray-600'} text-white font-bold"
      data-testid="method-select"
    >
      <SelectValue placeholder="Method" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="GET">GET</SelectItem>
      <SelectItem value="POST">POST</SelectItem>
      <SelectItem value="PUT">PUT</SelectItem>
      <SelectItem value="DELETE">DELETE</SelectItem>
      <SelectItem value="PATCH">PATCH</SelectItem>
    </SelectContent>
  </Select>
  <Input
    bind:value={url}
    placeholder="Enter URL or paste cURL"
    class="flex-1"
    data-testid="url-input"
  />
  <Button
    variant="default"
    class="flex items-center gap-1"
    onclick={handleSend}
    disabled={loading}
    data-testid="send-button"
  >
    <Send size={16} />
    {loading ? 'Sending...' : 'Send'}
  </Button>
</div>
```

### MainLayout.svelte (Request/Response Split)

```svelte
<script lang="ts">
  import { PaneGroup, Pane, PaneResizer } from 'paneforge';
  import RequestBuilder from './RequestBuilder.svelte';
  import ResponseViewer from './ResponseViewer.svelte';
  import Sidebar from './Sidebar.svelte';

  let sidebarVisible = $state(true);

  function toggleSidebar(): void {
    sidebarVisible = !sidebarVisible;
  }
</script>

<svelte:window
  on:keydown={(e) => {
    if (e.metaKey && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
  }}
/>

<div class="flex h-screen">
  {#if sidebarVisible}
    <Sidebar />
  {/if}
  <PaneGroup direction="vertical" class="flex-1">
    <Pane defaultSize={40} minSize={20}>
      <RequestBuilder />
    </Pane>
    <PaneResizer class="h-2 bg-border hover:bg-primary/20 cursor-row-resize" />
    <Pane minSize={20}>
      <ResponseViewer />
    </Pane>
  </PaneGroup>
</div>
```

### Sample Story: StatusBadge.stories.svelte

```svelte
<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import StatusBadge from './StatusBadge.svelte';

  const { Story } = defineMeta({
    title: 'Response/StatusBadge',
    component: StatusBadge,
    tags: ['autodocs'],
  });
</script>

<Story name="Success (200)" args={{ status: 200, statusText: 'OK' }} />
<Story name="Created (201)" args={{ status: 201, statusText: 'Created' }} />
<Story name="Not Found (404)" args={{ status: 404, statusText: 'Not Found' }} />
<Story name="Server Error (500)" args={{ status: 500, statusText: 'Internal Server Error' }} />
```

## Test Command

```bash
npm run check && npm run lint && just storybook-build
```

## Files to Create/Modify

### shadcn-svelte Setup (one-time)

```bash
npx shadcn-svelte@latest init
npx shadcn-svelte@latest add input select tabs textarea card table button
npm install paneforge lucide-svelte
```

### Components (src/lib/components/)

- `Layout/MainLayout.svelte` - Main layout with resizable panels
- `Layout/Sidebar.svelte` - Collapsible sidebar navigation
- `Layout/StatusBar.svelte` - Environment switcher, AI prompt hint
- `Request/RequestHeader.svelte` - URL input + method selector + send button
- `Response/ResponsePanel.svelte` - Response container with tabs
- `Response/StatusBadge.svelte` - Color-coded status display
- `Response/BodyViewer.svelte` - JSON highlighting + raw/pretty toggle
- `Response/HeadersViewer.svelte` - Collapsible headers table
- `Response/TimingDisplay.svelte` - Timing metrics

### Routes

- `routes/+page.svelte` - Integrate MainLayout

## Process

1. Install shadcn-svelte and paneforge dependencies
2. Initialize shadcn-svelte with dark theme default
3. Add required components (input, select, tabs, card, table, button)
4. Create MainLayout with resizable vertical split
5. Build RequestHeader with colorful method dropdown
6. Build ResponseViewer with tabs and syntax highlighting
7. Add sidebar with collapsible toggle (⌘B)
8. Verify lint, type checks, and tests pass
9. Mark checkboxes as complete

## Completion Signal

When ALL success criteria are met, output:

```text
<promise>RUN_2_COMPLETE</promise>
```

Then update @fix_plan.md to mark completed items with [x].

---

**DO NOT** work on tabs content (Headers/Params/Body/Auth editors), auth helpers, or intelligence features. Stay focused on layout structure, request header bar, and response viewer.
