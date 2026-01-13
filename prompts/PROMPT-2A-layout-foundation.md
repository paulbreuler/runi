# Ralph Run 2A: Layout Foundation

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**Prerequisites:** Run 1 (HTTP Core) must be complete.

**This Run's Focus:** Establish the three-panel layout foundation with resizable panes, sidebar navigation, and status bar. This creates the structural foundation that all other components will live within.

## Design Rationale

**Why This First:** Users need to see the app structure before they can effectively use it. This run establishes:
- The spatial organization (sidebar, request area, response area)
- Navigation patterns (sidebar toggle, keyboard shortcuts)
- Visual hierarchy (what's primary, what's secondary)
- Familiar VS Code/Cursor-style layout for developer comfort

**User Value:** "I can see where everything lives and navigate the app. The layout feels familiar like VS Code/Cursor."

**Layout Philosophy:** 
- **Left Sidebar:** Navigation and collections (like VS Code's file explorer)
- **Center Split:** Request builder (left) and Response viewer (right) side-by-side (like VS Code's editor split view)
- **Bottom Status Bar:** Context and hints (like VS Code's status bar)
- This matches developer mental models from VS Code/Cursor, reducing cognitive load

**HTTPie-Inspired Design Principles:**
- **Clean & Focused:** Minimal chrome, high contrast for readability
- **Subtle Interactions:** Hover effects use background color changes, not cursor changes (only pointer for actual links/buttons)
- **Visual Hierarchy:** Clear distinction between primary actions and secondary information
- **Performance:** Smooth animations (200ms transitions, 60fps), optimized rendering
- **Contextual Guidance:** Tooltips and hints where helpful, but not intrusive

## High-Level Wireframe (VS Code/Cursor Style)

```
[Native Tauri Titlebar: Window controls, app menu]

+--------+--------------------------+------------------+
|        | [Request Builder]        | [Response Viewer]|
| [Left] | (Will be filled in 2B)  | (Will be filled |
| Sidebar|                          |  in Run 2C)     |
|        |                          |                  |
| - Coll |                          |                  |
| - Hist |                          |                  |
+--------+--------------------------+------------------+

[Status Bar: Environment indicator, AI hint (⌘I)]
```

**Layout Structure (VS Code/Cursor Style):**
- **Left Sidebar:** Collections, History (collapsible with ⌘B)
- **Center Area:** Horizontal split pane (paneforge)
  - **Left Pane:** Request Builder (50% default, min 30%)
  - **Right Pane:** Response Viewer (50% default, min 30%)
- **Status Bar:** Fixed at bottom (environment, AI hint)

## Success Criteria (Machine-Verifiable)

All boxes must be checked AND tests must pass:

### Dependencies & Setup
- [ ] Install `paneforge` package (`npm install paneforge`)
- [ ] Install `lucide-svelte` package (`npm install lucide-svelte`)
- [ ] Add shadcn-svelte components: `tabs`, `card` (for future use)
- [ ] Verify all dependencies install without errors

### Layout Structure
- [ ] Create `src/lib/components/Layout/` directory structure
- [ ] Create `MainLayout.svelte` with VS Code/Cursor-style three-panel structure:
  - Left sidebar (collapsible with ⌘B)
  - Center area with horizontal split pane (paneforge)
    - Left pane: Request Builder placeholder (50% default, min 30%)
    - Right pane: Response Viewer placeholder (50% default, min 30%)
  - Status bar fixed at bottom
- [ ] Horizontal resizable divider works smoothly (drag to resize left/right panes)
- [ ] Layout fills entire viewport (`h-screen`)
- [ ] Layout matches VS Code/Cursor visual style (side-by-side panels)

### Sidebar Component
- [ ] Create `Sidebar.svelte` in `Layout/` directory
- [ ] Sidebar is collapsible (toggles visibility)
- [ ] `⌘B` keyboard shortcut toggles sidebar (macOS: `metaKey`, Windows/Linux: `ctrlKey`)
- [ ] Sidebar sections: Collections, History (placeholder content OK)
- [ ] Sidebar has proper width (suggested: `w-64` when visible)
- [ ] Sidebar collapses to 0 width when hidden (smooth transition: `transition-all duration-200`)
- [ ] Sidebar uses shadcn Card component for visual structure
- [ ] Sidebar uses subtle hover effects (`hover:bg-muted/50`) instead of pointer cursor on non-clickable areas
- [ ] High contrast for readability (clear text on muted backgrounds)

### Status Bar Component
- [ ] Create `StatusBar.svelte` in `Layout/` directory
- [ ] Status bar fixed at bottom of viewport
- [ ] Environment indicator (placeholder: "Environment: default")
- [ ] AI prompt hint: "Press ⌘I for AI assistance" (placeholder, not functional yet)
- [ ] Status bar uses subtle styling (border-top, muted background)
- [ ] Status bar has high contrast for readability (text is clearly visible)
- [ ] Status bar uses monospaced font for technical values (environment names, etc.)

### Integration
- [ ] Update `src/routes/+page.svelte` to use `MainLayout`
- [ ] Remove old single-page layout code
- [ ] App renders with new three-panel layout
- [ ] No console errors or warnings

### Storybook Stories
- [ ] `MainLayout.stories.svelte` - Shows full layout with mock placeholders
  - Story: "Default Layout" - All panels visible (sidebar, request, response)
  - Story: "Sidebar Collapsed" - Sidebar hidden, request/response side-by-side
  - Story: "Narrow Panes" - Request/response panes resized to minimum width
  - Story: "Wide Request" - Request pane expanded (70%), response narrow (30%)
  - Story: "Wide Response" - Response pane expanded (70%), request narrow (30%)
- [ ] `Sidebar.stories.svelte` - Sidebar states
  - Story: "Expanded" - Full sidebar with sections
  - Story: "Collapsed" - Sidebar hidden (0 width)
- [ ] `StatusBar.stories.svelte` - Status bar display
  - Story: "Default" - Standard status bar
  - Story: "With Environment" - Environment indicator visible

### Quality Gates
- [ ] `npm run check` passes (no TypeScript errors)
- [ ] `npm run lint` passes (no linting errors)
- [ ] `just storybook` runs without errors
- [ ] All components use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- [ ] `data-testid` attributes on ALL interactive elements:
  - `data-testid="sidebar"`
  - `data-testid="sidebar-toggle"`
  - `data-testid="main-layout"`
  - `data-testid="request-pane"` (left pane in center area)
  - `data-testid="response-pane"` (right pane in center area)
  - `data-testid="pane-resizer"` (horizontal divider between request/response)
  - `data-testid="status-bar"`
- [ ] Keyboard navigation works (Tab order is logical)
- [ ] Focus indicators visible on interactive elements

## Sample Code Reference

### MainLayout.svelte Structure (VS Code/Cursor Style)

```svelte
<script lang="ts">
  import { PaneGroup, Pane, PaneResizer } from 'paneforge';
  import Sidebar from './Sidebar.svelte';
  import StatusBar from './StatusBar.svelte';

  let sidebarVisible = $state(true);

  function toggleSidebar(): void {
    sidebarVisible = !sidebarVisible;
  }

  // Handle ⌘B (macOS) or Ctrl+B (Windows/Linux)
  $effect(() => {
    function handleKeyDown(e: KeyboardEvent): void {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;
      
      if (modifier && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<div class="flex h-screen flex-col" data-testid="main-layout">
  <div class="flex flex-1 overflow-hidden">
    {#if sidebarVisible}
      <Sidebar />
    {/if}
    <!-- Horizontal split: Request (left) | Response (right) -->
    <PaneGroup direction="horizontal" class="flex-1">
      <Pane defaultSize={50} minSize={30} data-testid="request-pane">
        <div class="h-full p-4 text-muted-foreground flex items-center justify-center">
          Request Builder (placeholder - will be built in Run 2B)
        </div>
      </Pane>
      <PaneResizer
        class="w-2 bg-border hover:bg-primary/20 cursor-col-resize transition-colors"
        data-testid="pane-resizer"
      />
      <Pane minSize={30} data-testid="response-pane">
        <div class="h-full p-4 text-muted-foreground flex items-center justify-center">
          Response Viewer (placeholder - will be built in Run 2C)
        </div>
      </Pane>
    </PaneGroup>
  </div>
  <StatusBar />
</div>
```

**Key Changes:**
- `direction="horizontal"` instead of `"vertical"` (side-by-side instead of top/bottom)
- `defaultSize={50}` for equal 50/50 split
- `minSize={30}` to prevent panes from becoming too narrow
- Resizer uses `cursor-col-resize` and `w-2` (vertical divider, not horizontal)
- Panes are side-by-side like VS Code's editor split view

### Sidebar.svelte Structure (HTTPie-Inspired)

```svelte
<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { Folder, History } from 'lucide-svelte';
</script>

<aside
  class="w-64 border-r border-border bg-muted/30 flex flex-col transition-all duration-200"
  data-testid="sidebar"
>
  <Card class="flex-1 rounded-none border-0 border-r">
    <CardHeader>
      <CardTitle class="text-sm font-semibold text-foreground">Collections</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <Folder size={16} />
        <span>No collections yet</span>
      </div>
    </CardContent>
  </Card>
  
  <Card class="flex-1 rounded-none border-0 border-r border-t">
    <CardHeader>
      <CardTitle class="text-sm font-semibold text-foreground">History</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <History size={16} />
        <span>No history yet</span>
      </div>
    </CardContent>
  </Card>
</aside>
```

**HTTPie-Inspired Notes:**
- High contrast: `text-foreground` for titles, `text-muted-foreground` for secondary text
- Subtle backgrounds: `bg-muted/30` for sidebar, not heavy borders
- Smooth transitions: `transition-all duration-200` for state changes
- No pointer cursor on non-interactive elements (only on actual clickable items)

### StatusBar.svelte Structure

```svelte
<script lang="ts">
  // Placeholder - will be enhanced in future runs
</script>

<div
  class="h-8 border-t border-border bg-muted/50 flex items-center justify-between px-4 text-xs text-muted-foreground"
  data-testid="status-bar"
>
  <div class="flex items-center gap-4">
    <span>Environment: <strong class="text-foreground">default</strong></span>
  </div>
  <div class="flex items-center gap-4">
    <span>Press <kbd class="px-1.5 py-0.5 bg-background border border-border rounded text-xs">⌘I</kbd> for AI assistance</span>
  </div>
</div>
```

## Files to Create/Modify

### Dependencies
```bash
npm install paneforge lucide-svelte
npx shadcn-svelte@latest add card
```

### Components to Create
- `src/lib/components/Layout/MainLayout.svelte`
- `src/lib/components/Layout/Sidebar.svelte`
- `src/lib/components/Layout/StatusBar.svelte`

### Stories to Create
- `src/lib/components/Layout/MainLayout.stories.svelte`
- `src/lib/components/Layout/Sidebar.stories.svelte`
- `src/lib/components/Layout/StatusBar.stories.svelte`

### Routes to Modify
- `src/routes/+page.svelte` - Replace with MainLayout integration

## Process

1. **Install dependencies** - paneforge, lucide-svelte, shadcn card
2. **Create directory structure** - `Layout/` directory in components
3. **Build MainLayout** - VS Code-style three-panel structure:
   - Left sidebar (collapsible)
   - Center: Horizontal split (Request | Response)
   - Bottom: Status bar
4. **Build Sidebar** - Collapsible with placeholder content (Collections, History)
5. **Build StatusBar** - Bottom status bar with placeholders
6. **Integrate** - Update `+page.svelte` to use MainLayout
7. **Create stories** - Storybook stories for all layout components
8. **Test** - Verify:
   - Side-by-side request/response panes resize horizontally
   - Sidebar toggles with ⌘B
   - Layout matches VS Code/Cursor visual style
9. **Quality gates** - Run check, lint, storybook

## Completion Signal

When ALL success criteria are met, output:

```text
<promise>RUN_2A_COMPLETE</promise>
```

Then update `@fix_plan.md` to mark completed items with [x].

## Out of Scope (Future Runs)

**DO NOT** work on:
- Request header bar (Run 2B)
- Response viewer components (Run 2C)
- Tab content editors (Run 3)
- Collections/History functionality (Phase 3)
- AI features (Phase 4)

**Focus:** Layout structure only. Placeholders are fine for content areas.
