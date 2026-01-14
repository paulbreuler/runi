# Ralph Run 2A: Layout Foundation

## ⚠️ CRITICAL: TDD + STORYBOOK ARE MANDATORY

**YOU MUST FOLLOW TEST-DRIVEN DEVELOPMENT (TDD) AND CREATE STORYBOOK STORIES FOR EVERY COMPONENT.**

**Workflow:** RED → GREEN → REFACTOR → STORYBOOK

1. **RED:** Write failing tests FIRST (before any component code)
2. **GREEN:** Write minimum code to pass tests
3. **REFACTOR:** Clean up while tests stay green
4. **STORYBOOK:** Create stories for visual documentation (REQUIRED for completion)

**Violation = Failure:**
- If you write component code before tests, you have failed this run.
- If you skip Storybook stories, you have failed this run.

See "TDD Workflow (MANDATORY)" section below for detailed requirements.

---

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**Prerequisites:** Run 1 (HTTP Core) must be complete.

**This Run's Focus:** Establish the three-panel layout foundation with resizable panes, sidebar navigation, and status bar. This creates the structural foundation that all other components will live within.

## TDD Workflow (MANDATORY)

**⚠️ CRITICAL: Test-Driven Development is REQUIRED. No exceptions.**

### TDD Cycle (Red → Green → Refactor → Storybook)

For **EVERY** component you build, you MUST follow this exact sequence:

1. **RED:** Write failing tests FIRST
   - Create `ComponentName.test.ts` BEFORE writing `ComponentName.svelte`
   - Tests must fail (component doesn't exist or doesn't implement the feature)
   - Run `npm run test` to verify tests fail
   - **DO NOT** write any component code until tests exist

2. **GREEN:** Write minimum code to pass tests
   - Implement ONLY what's needed to make tests pass
   - Run `npm run test` to verify tests pass
   - **DO NOT** add extra features or polish yet

3. **REFACTOR:** Clean up while tests stay green
   - Improve code quality, extract helpers, optimize
   - Run `npm run test` after each refactor to ensure tests still pass
   - **DO NOT** break tests during refactoring

4. **STORYBOOK:** Create stories for visual documentation
   - Create `ComponentName.stories.svelte` AFTER component and tests are complete
   - Stories must render correctly in Storybook (`just storybook`)
   - Stories are REQUIRED for completion (not optional)

### Test Requirements Per Component

**MainLayout.svelte:**

- [ ] `MainLayout.test.ts` - Tests for:
  - Renders with all three panels (sidebar, request pane, response pane, status bar)
  - Sidebar visibility toggle (initial state: visible)
  - Keyboard shortcut ⌘B (macOS) / Ctrl+B (Windows/Linux) toggles sidebar
  - Request/response panes are side-by-side (horizontal split)
  - Layout fills viewport (`h-screen`)
  - All `data-testid` attributes are present

**Sidebar.svelte:**

- [ ] `Sidebar.test.ts` - Tests for:
  - Renders Collections and History sections
  - Has correct width when visible (`w-64`)
  - Uses shadcn Card components
  - Has proper `data-testid="sidebar"` attribute
  - Displays placeholder content correctly

**StatusBar.svelte:**

- [ ] `StatusBar.test.ts` - Tests for:
  - Renders at bottom of viewport
  - Displays environment indicator
  - Displays AI hint text
  - Has proper `data-testid="status-bar"` attribute
  - Uses monospaced font for technical values

### Test Execution Commands

```bash
# Run tests (must pass before moving to next component)
npm run test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage (must be ≥85% for component)
npm run test:coverage
```

### TDD Enforcement Checklist

Before writing ANY component code:

- [ ] Test file exists (`ComponentName.test.ts`)
- [ ] Tests are written for all success criteria
- [ ] Tests fail when run (`npm run test` shows failures)
- [ ] Only THEN write component code

After writing component code:

- [ ] All tests pass (`npm run test` shows all green)
- [ ] Coverage is ≥85% for the component
- [ ] Refactor if needed (tests must stay green)

### Violation Detection

If you find yourself:

- Writing component code before tests → **STOP. Write tests first.**
- Writing tests after implementation → **STOP. Delete component, write tests first.**
- Skipping tests because "it's just UI" → **STOP. UI components need tests too.**
- Skipping Storybook stories → **STOP. Stories are required for completion.**
- Creating stories before tests → **STOP. Follow TDD first, then create stories.**

**Remember:**
- TDD is not optional. It's a requirement. Every component must have tests written FIRST.
- Storybook stories are not optional. They're required for completion. Every component must have stories.

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

### Test Requirements (TDD MANDATORY)

- [ ] `MainLayout.test.ts` exists and tests pass (written BEFORE MainLayout.svelte)
- [ ] `Sidebar.test.ts` exists and tests pass (written BEFORE Sidebar.svelte)
- [ ] `StatusBar.test.ts` exists and tests pass (written BEFORE StatusBar.svelte)
- [ ] All tests pass (`npm run test` shows all green)
- [ ] Test coverage ≥85% for all Layout components (`npm run test:coverage`)
- [ ] Tests verify keyboard shortcuts (⌘B / Ctrl+B)
- [ ] Tests verify component structure and `data-testid` attributes
- [ ] Tests verify responsive behavior (sidebar collapse, pane resizing)

### Storybook Stories (MANDATORY - Completion Requirement)

**⚠️ Storybook stories are REQUIRED for completion. Every component must have stories.**

- [ ] `MainLayout.stories.svelte` exists and renders correctly in Storybook
  - Story: "Default Layout" - All panels visible (sidebar, request, response)
  - Story: "Sidebar Collapsed" - Sidebar hidden, request/response side-by-side
  - Story: "Narrow Panes" - Request/response panes resized to minimum width
  - Story: "Wide Request" - Request pane expanded (70%), response narrow (30%)
  - Story: "Wide Response" - Response pane expanded (70%), request narrow (30%)
- [ ] `Sidebar.stories.svelte` exists and renders correctly in Storybook
  - Story: "Expanded" - Full sidebar with sections
  - Story: "Collapsed" - Sidebar hidden (0 width)
- [ ] `StatusBar.stories.svelte` exists and renders correctly in Storybook
  - Story: "Default" - Standard status bar
  - Story: "With Environment" - Environment indicator visible
- [ ] All stories render without errors in Storybook (`just storybook` runs successfully)
- [ ] Stories use proper Storybook Svelte 5 patterns (`@storybook/addon-svelte-csf`)
- [ ] Stories have `tags: ['autodocs']` for auto-generated documentation

### Quality Gates

- [ ] `npm run test` passes (all tests green)
- [ ] `npm run test:coverage` shows ≥85% coverage for Layout components
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
    <span
      >Press <kbd class="px-1.5 py-0.5 bg-background border border-border rounded text-xs">⌘I</kbd> for
      AI assistance</span
    >
  </div>
</div>
```

## Files to Create/Modify

### Dependencies

```bash
npm install paneforge lucide-svelte
npx shadcn-svelte@latest add card
```

### Test Files to Create FIRST (TDD: Write Tests Before Components)

- `src/lib/components/Layout/MainLayout.test.ts` ⚠️ **MUST BE CREATED FIRST**
- `src/lib/components/Layout/Sidebar.test.ts` ⚠️ **MUST BE CREATED FIRST**
- `src/lib/components/Layout/StatusBar.test.ts` ⚠️ **MUST BE CREATED FIRST**

### Components to Create (After Tests)

- `src/lib/components/Layout/MainLayout.svelte` (write after MainLayout.test.ts)
- `src/lib/components/Layout/Sidebar.svelte` (write after Sidebar.test.ts)
- `src/lib/components/Layout/StatusBar.svelte` (write after StatusBar.test.ts)

### Stories to Create (MANDATORY - After Components and Tests)

**⚠️ Storybook stories are REQUIRED for completion, not optional.**

- `src/lib/components/Layout/MainLayout.stories.svelte` ⚠️ **REQUIRED**
- `src/lib/components/Layout/Sidebar.stories.svelte` ⚠️ **REQUIRED**
- `src/lib/components/Layout/StatusBar.stories.svelte` ⚠️ **REQUIRED**

### Routes to Modify

- `src/routes/+page.svelte` - Replace with MainLayout integration

## Process (TDD + Storybook Workflow)

**⚠️ MANDATORY: Follow TDD cycle (Red → Green → Refactor → Storybook) for EVERY component.**

1. **Install dependencies** - paneforge, lucide-svelte, shadcn card
2. **Create directory structure** - `Layout/` directory in components

3. **MainLayout Component (TDD + Storybook):**
   - **RED:** Write `MainLayout.test.ts` FIRST (tests must fail)
   - **GREEN:** Write `MainLayout.svelte` to pass tests
   - **REFACTOR:** Clean up code while tests stay green
   - **STORYBOOK:** Create `MainLayout.stories.svelte` (REQUIRED for completion)
   - Verify: Side-by-side request/response panes, sidebar toggle, ⌘B shortcut

4. **Sidebar Component (TDD + Storybook):**
   - **RED:** Write `Sidebar.test.ts` FIRST (tests must fail)
   - **GREEN:** Write `Sidebar.svelte` to pass tests
   - **REFACTOR:** Clean up code while tests stay green
   - **STORYBOOK:** Create `Sidebar.stories.svelte` (REQUIRED for completion)
   - Verify: Collapsible, Collections/History sections, proper styling

5. **StatusBar Component (TDD + Storybook):**
   - **RED:** Write `StatusBar.test.ts` FIRST (tests must fail)
   - **GREEN:** Write `StatusBar.svelte` to pass tests
   - **REFACTOR:** Clean up code while tests stay green
   - **STORYBOOK:** Create `StatusBar.stories.svelte` (REQUIRED for completion)
   - Verify: Fixed at bottom, environment indicator, AI hint

6. **Integration (TDD):**
   - **RED:** Write integration test for `+page.svelte` using MainLayout
   - **GREEN:** Update `+page.svelte` to use MainLayout
   - **REFACTOR:** Clean up while tests stay green

7. **Quality gates (ALL must pass for completion):**
   - `npm run test` - All tests must pass
   - `npm run test:coverage` - Coverage must be ≥85%
   - `just storybook` - Storybook runs without errors (stories render correctly)
   - `npm run check` - No TypeScript errors
   - `npm run lint` - No linting errors

## Completion Signal

**⚠️ Completion requires BOTH TDD and Storybook for ALL components.**

When ALL success criteria are met (including TDD tests and Storybook stories), output:

```text
<promise>RUN_2A_COMPLETE</promise>
```

**Completion Checklist:**
- ✅ All test files written FIRST (before components)
- ✅ All tests pass (`npm run test`)
- ✅ Test coverage ≥85% (`npm run test:coverage`)
- ✅ All Storybook stories created and render correctly (`just storybook`)
- ✅ All quality gates pass (check, lint, storybook)
- ✅ All success criteria checkboxes marked

Then update `@fix_plan.md` to mark completed items with [x].

## Out of Scope (Future Runs)

**DO NOT** work on:

- Request header bar (Run 2B)
- Response viewer components (Run 2C)
- Tab content editors (Run 3)
- Collections/History functionality (Phase 3)
- AI features (Phase 4)

**Focus:** Layout structure only. Placeholders are fine for content areas.
