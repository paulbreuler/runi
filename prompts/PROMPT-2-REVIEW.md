# PROMPT-2 Layout & UI Review

**Date:** 2026-01-12  
**Status:** Ready for execution, but consider breaking down

## Current State Assessment

### ✅ Already Complete

- Storybook is set up and working
- Basic shadcn-svelte components exist: `button`, `input`, `select`, `separator`
- HTTP core functionality is complete (Run 1)
- Basic page layout exists (`src/routes/+page.svelte`)

### ❌ Missing Dependencies

- `paneforge` - NOT installed (required for resizable panes)
- `lucide-svelte` - NOT installed (required for icons)
- Additional shadcn components: `tabs`, `textarea`, `card`, `table`

### 📋 Component Structure Needed

```
src/lib/components/
├── Layout/
│   ├── MainLayout.svelte
│   ├── Sidebar.svelte
│   └── StatusBar.svelte
├── Request/
│   └── RequestHeader.svelte
└── Response/
    ├── ResponsePanel.svelte
    ├── StatusBadge.svelte
    ├── BodyViewer.svelte
    ├── HeadersViewer.svelte
    └── TimingDisplay.svelte
```

## PROMPT-2 Scope Analysis

### Total Tasks Breakdown

- **Layout Structure:** 5 items
- **Request Header Bar:** 3 items
- **Response Viewer:** 6 items
- **Storybook Stories:** 9 stories
- **Quality Gates:** 7 items

**Total:** ~30 distinct deliverables

### Complexity Assessment

**High Complexity Items:**

1. MainLayout with paneforge integration (new dependency, new pattern)
2. JSON syntax highlighting (CodeMirror/Shiki integration)
3. Response viewer with multiple tabs and views
4. 9 Storybook stories (significant time investment)

**Medium Complexity:**

1. Sidebar with ⌘B keyboard shortcut
2. Color-coded method dropdown
3. StatusBadge with color coding
4. HeadersViewer with collapsible table

**Low Complexity:**

1. StatusBar (placeholder content)
2. TimingDisplay (simple metrics)
3. Basic component structure

## Recommendation: Break Down PROMPT-2

### Option A: Keep as Single Run (Current)

**Pros:**

- Single completion signal
- All layout work in one batch
- Easier to track in `@fix_plan.md`

**Cons:**

- Very large scope (~30 deliverables)
- High risk of incomplete work
- Difficult to test incrementally
- May hit token/iteration limits

### Option B: Split into 3 Sub-Runs (Recommended)

#### PROMPT-2A: Layout Foundation

**Focus:** Core layout structure, dependencies, basic components

**Tasks:**

- Install paneforge, lucide-svelte
- Add shadcn components: tabs, textarea, card, table
- Create MainLayout.svelte with paneforge vertical split
- Create Sidebar.svelte (collapsible, ⌘B shortcut)
- Create StatusBar.svelte (placeholder)
- Update `src/routes/+page.svelte` to use MainLayout
- Basic Storybook stories: MainLayout, Sidebar, StatusBar

**Success Criteria:**

- Layout renders with three panels
- Sidebar toggles with ⌘B
- Panes resize with paneforge
- All type checks pass

**Estimated Deliverables:** ~8-10 items

#### PROMPT-2B: Request Header & Response Basics

**Focus:** Request header bar and basic response display

**Tasks:**

- Create RequestHeader.svelte with colored method dropdown
- Integrate RequestHeader into MainLayout
- Create StatusBadge.svelte
- Create basic ResponsePanel.svelte (no syntax highlighting yet)
- Create TimingDisplay.svelte
- Storybook stories: RequestHeader, StatusBadge, TimingDisplay

**Success Criteria:**

- Method dropdown shows colors (GET=green, POST=blue, etc.)
- Send button works with loading state
- Response displays with status badge and timing
- All stories render correctly

**Estimated Deliverables:** ~8-10 items

#### PROMPT-2C: Response Viewer & Polish

**Focus:** Advanced response viewer, syntax highlighting, final stories

**Tasks:**

- Integrate JSON syntax highlighting (CodeMirror or Shiki)
- Create BodyViewer.svelte with raw/pretty toggle
- Create HeadersViewer.svelte with collapsible table
- Complete ResponsePanel.svelte with tabs (Body/Headers/Stats)
- Storybook stories: ResponsePanel, BodyViewer, HeadersViewer
- Final quality gates (WCAG, testids, etc.)

**Success Criteria:**

- JSON syntax highlighting works
- Response tabs switch correctly
- Headers table is collapsible
- All 9 stories complete
- All quality gates pass

**Estimated Deliverables:** ~10-12 items

### Option C: Split into 2 Runs (Balanced)

#### PROMPT-2A: Layout & Request Header

- Layout structure + Sidebar + StatusBar
- RequestHeader with colored dropdown
- Basic response display (no syntax highlighting)
- Stories for layout and request components

#### PROMPT-2B: Response Viewer & Polish

- Advanced response viewer with syntax highlighting
- All response components (BodyViewer, HeadersViewer, etc.)
- Remaining Storybook stories
- Quality gates

## Recommended Approach: Option B (3 Sub-Runs)

**Rationale:**

1. **Incremental Testing:** Each run produces testable, working code
2. **Manageable Scope:** ~8-12 deliverables per run vs 30 in one
3. **Clear Boundaries:** Each run has distinct focus
4. **Better Error Recovery:** If one run fails, others can proceed
5. **Easier Review:** Smaller PRs are easier to review

**File Structure:**

```
prompts/
├── PROMPT-2A-layout-foundation.md
├── PROMPT-2B-request-response-basics.md
├── PROMPT-2C-response-viewer-polish.md
└── PROMPT-2-layout-ui.md (keep as reference)
```

## CLAUDE.md Updates Needed

### Missing Information

1. **paneforge Usage Pattern:** Document how to use paneforge for resizable panes
2. **Component Organization:** Document Layout/, Request/, Response/ structure
3. **Storybook Patterns:** Document story file naming and structure conventions
4. **Dependency Management:** Clarify when to install new npm packages

### Suggested Additions

````markdown
## Component Organization

### Directory Structure

- `Layout/` - App-level layout components (MainLayout, Sidebar, StatusBar)
- `Request/` - Request building components (RequestHeader, TabPanel, etc.)
- `Response/` - Response viewing components (ResponsePanel, StatusBadge, etc.)
- `ui/` - shadcn-svelte base components (button, input, select, etc.)

### Storybook Story Patterns

- Stories live adjacent to components: `Component.stories.svelte`
- Use `@storybook/addon-svelte-csf` for Svelte 5 compatibility
- Story titles follow: `Category/ComponentName` (e.g., `Response/StatusBadge`)

## Resizable Panes with paneforge

```svelte
<script lang="ts">
  import { PaneGroup, Pane, PaneResizer } from 'paneforge';
</script>

<PaneGroup direction="vertical" class="flex-1">
  <Pane defaultSize={40} minSize={20}>
    <!-- Top content -->
  </Pane>
  <PaneResizer class="h-2 bg-border hover:bg-primary/20 cursor-row-resize" />
  <Pane minSize={20}>
    <!-- Bottom content -->
  </Pane>
</PaneGroup>
```
````

```

## Action Items

### Before Starting PROMPT-2
1. [ ] Update CLAUDE.md with component organization patterns
2. [ ] Update CLAUDE.md with paneforge usage examples
3. [ ] Decide: Single run (PROMPT-2) or split (2A/2B/2C)
4. [ ] If splitting, create PROMPT-2A, PROMPT-2B, PROMPT-2C files

### During PROMPT-2 Execution
1. [ ] Install paneforge and lucide-svelte first
2. [ ] Add missing shadcn components (tabs, textarea, card, table)
3. [ ] Create component directory structure (Layout/, Request/, Response/)
4. [ ] Build incrementally: layout → request → response
5. [ ] Write stories as components are created (don't defer)

### After PROMPT-2
1. [ ] Verify all 9 Storybook stories render correctly
2. [ ] Run `just ci` to ensure all quality gates pass
3. [ ] Test keyboard shortcuts (⌘B for sidebar)
4. [ ] Test resizable panes work smoothly
5. [ ] Update `@fix_plan.md` with completed items

## Risk Assessment

### High Risk Items
- **paneforge Integration:** New dependency, may have Svelte 5 compatibility issues
- **JSON Syntax Highlighting:** CodeMirror/Shiki integration complexity
- **Scope Creep:** 30 deliverables may lead to incomplete work

### Mitigation Strategies
1. **Test paneforge early:** Install and test basic resizing before building full layout
2. **Start with simple highlighting:** Use basic `<pre>` with classes first, upgrade later
3. **Break down if needed:** Don't hesitate to split mid-run if scope is too large

## References

- [paneforge Documentation](https://paneforge.dev/)
- [lucide-svelte Icons](https://lucide.dev/)
- [shadcn-svelte Components](https://www.shadcn-svelte.com/)
- [Storybook Svelte 5 Guide](https://storybook.js.org/docs/get-started/frameworks/sveltekit)
```
