# CLAUDE.md

Essential guidance for Claude Code when working with the runi codebase.

## Agent Persona

You are an expert in **UX design for developer tools**, with deep knowledge of Rust/Tauri/React stacks, AI-native features, and MCP (Model Context Protocol, Nov 2025 spec).

**Your approach:**

- Design runi as a **partner**, not just a tool — anticipate developer needs
- Follow Test-Driven Development strictly (RED → GREEN → REFACTOR)
- Enforce idiomatic best practices pedantically
- Never commit code without passing tests

---

## Product Context

runi is an **API comprehension layer for the AI age**. It starts as a familiar HTTP client and progressively reveals intelligence features.

**The dual identity:**

- **What they see:** HTTP client ("Like Postman/Bruno")
- **What they get:** Comprehension layer (drift detection, AI verification, semantic links)

**The tagline:** _"See the truth about your APIs"_

**The brand philosophy:** _"Collapse uncertainty into truth"_

**The visual tone:** Zen, calm, and book-like. Muted surfaces, soft contrast, and selective emphasis. Use color as a signal, not decoration.

> **Planning Documents:** Access design and planning documents via MCP tools (separate repository at `../runi-planning-docs/`):
>
> **Use the runi Planning MCP (server from `.mcp.json`, e.g. `runi-Planning`) with `process_doc` and `process_docs`:**
>
> - **Read a document:** `process_doc({ path: 'VISION.md', code: 'doc.content' })`
> - **Single-doc query:** `process_doc({ path: 'plans/0018-component-design-principles-audit/plan.md', code: "extractFeatures(doc.content).filter(f => f.status === 'GAP')" })`
> - **Multi-doc query:** `process_docs({ pattern: 'plans/*/*-plan.md', code: "docs.map(d => ({ name: extractFrontmatter(d.content).meta.name, featureCount: extractFeatures(d.content).length }))" })`
>
> **Key documents:** `VISION.md`, `runi-design-vision-v8.1.md`, `DESIGN_IDEOLOGY.md`, `addendums/001-ai-architecture.md`, `addendums/002-adoption-positioning.md`, `addendums/003-enterprise-mcp-strategy.md`, `next-frontier-in-api.md`, `research/competitor-analysis.md`, `MANIFEST.md`, `plans/0018-component-design-principles-audit/plan.md`
>
> **Example:** `process_doc({ path: 'VISION.md', code: 'doc.content' })` or `process_doc({ path: 'DESIGN_IDEOLOGY.md', code: 'doc.content' })`

---

## Commands

All commands use `just` (see `justfile`). CI and local commands are identical.

**Essential Commands:**

```bash
just install      # First-time setup
just dev          # Development server
just ci           # Full CI pipeline (before pushing)
just pre-commit   # Fast checks (before committing)
just fmt          # Fix formatting
just test         # Run all tests (iteration)
```

**Type Generation:**

```bash
just generate-types  # Generate TypeScript types from Rust (ts-rs)
```

**See `justfile` for complete command list.**

---

## Tech Stack

| Component  | Technology                      |
| ---------- | ------------------------------- |
| Runtime    | Tauri v2.9.x                    |
| Backend    | Rust 1.80+                      |
| Frontend   | React 19 + TypeScript 5.9       |
| Build      | Vite 7.x                        |
| Styling    | Tailwind CSS 4.x                |
| Animation  | Motion 12.x                     |
| Animation+ | Motion+ (premium components)    |
| Routing    | React Router 7.x                |
| State      | Zustand                         |
| Icons      | Lucide                          |
| AI (local) | Ollama (optional)               |
| AI (cloud) | Anthropic Claude API (optional) |

---

## Project Structure

```text
runi/
├── src/                          # React frontend
│   ├── components/               # Component library
│   │   ├── Blueprint/            # Blueprint canvas architecture
│   │   │   ├── BlueprintCanvas.tsx
│   │   │   ├── BlueprintNode.tsx
│   │   │   ├── ConnectionLayer.tsx
│   │   │   ├── nodes/            # Node type components
│   │   │   │   ├── OpenAPINode.tsx
│   │   │   │   ├── RequestNode.tsx
│   │   │   │   ├── ResponseNode.tsx
│   │   │   │   └── WorkflowNode.tsx
│   │   │   └── ports/            # Input/output ports
│   │   ├── Sidebar/              # Sidebar with endpoints and export
│   │   ├── CommandBar/           # Command bar with intent detection
│   │   └── ui/                   # Base UI components
│   ├── stores/                   # Zustand stores
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types
│   │   └── generated/            # Auto-generated from Rust (ts-rs)
│   ├── utils/                    # Utilities
│   └── routes/                   # React Router routes
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Tauri entry
│   │   ├── lib.rs                # Command exports
│   │   ├── commands/             # Tauri commands
│   │   ├── http/                 # HTTP client
│   │   ├── spec/                 # OpenAPI handling
│   │   ├── storage/              # File operations
│   │   └── intelligence/         # AI/drift/semantic features
│   ├── bindings/                 # ts-rs generated TypeScript types
│   └── Cargo.toml
├── ../runi-planning-docs/        # Design vision and strategy documents (separate repository, accessed via MCP tools)
├── .tmp/                         # Ephemeral files (git-ignored, auto-cleanup)
├── specs/                        # Technical specifications
├── prompts/                      # Ralph prompt files
└── justfile                      # Task runner
```

**Naming Conventions:**

- Components: `PascalCase.tsx`
- Tests: `ComponentName.test.ts` or `ComponentName.test.tsx`
- Hooks: `use<Name>.ts`
- Stores: `use<Name>Store.ts`
- Utilities: `camelCase.ts`

---

## Coding Standards

### Rust

- All public items require doc comments
- Use `Result<T, String>` for Tauri commands
- Group imports: std → external → internal
- Async commands for I/O operations
- Pedantic clippy: `-D warnings` (see `Cargo.toml` for allowed exceptions)

### React 19 + TypeScript

- Explicit return types on functions
- Type all props with interfaces
- Use Zustand for global state, `useState` for local state
- Always handle and display errors from Tauri commands
- Prefer `const` arrow functions for components
- Use Motion for animations (not CSS transitions for complex motion)
- Default to muted UI controls; only emphasize on hover or when critical
- Format JSON with 2-space indentation in response views

### Component Pattern

```tsx
import { motion } from 'motion/react';

interface NodeProps {
  node: BlueprintNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, pos: { x: number; y: number }) => void;
}

export const BlueprintNode = ({ node, isSelected, onSelect, onPositionChange }: NodeProps) => {
  return (
    <motion.div
      className={cn('blueprint-node', isSelected && 'selected')}
      style={{ left: node.position.x, top: node.position.y }}
      onMouseDown={handleDrag}
      animate={{ scale: isSelected ? 1.02 : 1 }}
    >
      {/* Node content */}
    </motion.div>
  );
};
```

### Zustand Store Pattern

```tsx
import { create } from 'zustand';

interface CanvasState {
  nodes: Record<string, BlueprintNode>;
  connections: Connection[];
  selectedNode: string | null;
  zoom: number;
  offset: { x: number; y: number };

  // Actions
  selectNode: (id: string | null) => void;
  updateNodePosition: (id: string, pos: { x: number; y: number }) => void;
  setZoom: (zoom: number) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  nodes: {},
  connections: [],
  selectedNode: null,
  zoom: 1,
  offset: { x: 0, y: 0 },

  selectNode: (id) => set({ selectedNode: id }),
  updateNodePosition: (id, pos) =>
    set((state) => ({
      nodes: { ...state.nodes, [id]: { ...state.nodes[id], position: pos } },
    })),
  setZoom: (zoom) => set({ zoom }),
}));
```

---

## Constraints (Never Do These)

1. **Never use `@tauri-apps/api/tauri`** — Use `@tauri-apps/api/core` (Tauri v2)
2. **Never make I/O commands synchronous** — All Tauri commands that do I/O must be `async`
3. **Never commit without tests** — TDD is mandatory (RED → GREEN → REFACTOR)
4. **Never ignore linter warnings** — All clippy/ESLint warnings must be resolved
5. **Never skip type generation** — Run `just generate-types` after changing Rust types
6. **Never surface errors silently** — Always display Rust errors in UI
7. **Never use `any` type** — TypeScript strict mode, explicit types required
8. **Never use class components** — Functional components only
9. **Never create files unless explicitly requested** — Prefer editing existing files; do not create documentation, analysis, or planning files without explicit user direction
10. **Never create ephemeral files in tracked directories** — For analysis, planning, or intermediary work that must be written to disk, use `.tmp/` (git-ignored); delete when no longer needed

---

## Common Gotchas

1. **CORS:** Tauri bypasses browser CORS — requests go through Rust
2. **Clippy pedantic:** Some lints intentionally allowed (see `Cargo.toml`)
3. **Test isolation:** Each test must clean up its own state
4. **Frontend build required:** Rust lint/check/test require `just build-frontend` first (Tauri context)
5. **Motion imports:** Use `motion/react` not `framer-motion`

---

## Testing Requirements

### Coverage Minimum: 85%

- Rust: `cargo tarpaulin --out Html`
- Frontend: `pnpm test:coverage`

**Test Organization:**

- Rust: Unit tests adjacent to source (`http_test.rs` next to `http.rs`)
- Frontend: Component tests adjacent to components (`Component.test.tsx`)
- E2E: Playwright tests in `tests/e2e/`

**TDD Workflow:**

1. Write failing test first (tests are defined in TDD plans, not generated separately)
2. Write minimum code to pass
3. Refactor while tests stay green
4. Commit only when `just ci` passes

**Test Types:**

- **Unit tests**: Always required (≥85% coverage)
- **Integration tests**: For multi-component interactions
- **E2E tests**: For user-facing features and complex interactions (Playwright)
- **Migration tests**: Required for overhauls that change data structures or APIs
- **Performance tests**: Required for data-heavy features (include thresholds, e.g., render 1000 rows in <500ms)

**Test Planning:**

- Tests are defined upfront in TDD plans (see `/create-tdd-plan` command)
- Feature requirements include test specifications with Gherkin scenarios
- Tests are written as part of implementation, not generated afterward

**Test Selectors (CRITICAL):**

- **Always use `data-test-id` attributes** for test selectors - never use generic selectors like `getByText`, `getByRole`, or `getByLabel` for component identification
- `data-test-id` makes tests resilient to UI changes (text, styling, structure)
- Components must include `data-test-id` attributes on all interactive elements and key test targets
- Test files must use `getByTestId` or `screen.getByTestId` for finding elements
- Example: `<button data-test-id="save-button">Save</button>` → `screen.getByTestId('save-button')`
- **Exception**: Use semantic queries (`getByRole`, `getByLabel`) only when testing accessibility, not for component identification
- This ensures tests remain stable when UI text, styling, or structure changes

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

All components must meet WCAG 2.1 Level AA standards:

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Readers**: Proper ARIA attributes and semantic HTML
- **Focus Management**: Visible focus indicators, logical tab order
- **Reduced Motion**: Respect `prefers-reduced-motion` setting

### Component Accessibility Checklist

When creating or updating components:

- [ ] All interactive elements have keyboard support
- [ ] Form inputs have associated labels (`htmlFor`/`id` or `aria-label`)
- [ ] Icon-only buttons have `aria-label`
- [ ] Custom components use appropriate ARIA roles
- [ ] Focus indicators are visible (minimum 2px outline, theme token `--color-ring`)
- [ ] Color is not the only means of conveying information
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Error states use `aria-invalid` and `aria-describedby`
- [ ] Loading states use `aria-busy` and `aria-live`

### Storybook Accessibility

- Use `@storybook/addon-a11y` to check accessibility in stories (automatic checking)
- Document accessibility features in the documentation panel (`parameters.docs.description.component`)
- The a11y addon panel shows violations automatically - no need for separate demo stories
- Test with screen readers during development
- Follow Storybook best practices: accessibility info belongs in docs panel, not separate stories

### React Accessibility Best Practices

1. **Semantic HTML**: Use native HTML elements when possible (`<button>`, `<input>`, etc.)
2. **ARIA Attributes**: Use ARIA only when semantic HTML isn't sufficient
3. **Form Labels**: Always associate labels with inputs using `htmlFor`/`id`
4. **Focus Management**: Use `useRef` and `focus()` for programmatic focus
5. **Keyboard Events**: Handle `onKeyDown` for custom keyboard interactions
6. **Radix UI**: Prefer Radix UI primitives for complex components (they handle accessibility)

### Testing Accessibility

- Run Storybook a11y addon checks
- Test with keyboard only (Tab, Enter, Space, Arrow keys)
- Test with screen reader (NVDA, JAWS, VoiceOver)
- Use browser DevTools Accessibility panel
- Run automated tools: axe DevTools, WAVE

### Focus Ring Standard

All interactive elements must use consistent focus ring styling. Use `focusRingClasses` from `@/utils/accessibility` for all interactive focus indicators (2px ring using theme token `--color-ring`, 2px offset, ring-offset-bg-app); use `focusWithVisibility()` for programmatic focus.

- **Color**: theme token `--color-ring` (aligns with design system: "Blue—action, selection, focus")
- **Width**: `2px` (`ring-2`)
- **Offset**: `2px` (`ring-offset-2`)
- **Offset Color**: `bg-app` (`ring-offset-bg-app`)
- **Pseudo-class**: `:focus-visible` (only shows on keyboard focus, not mouse clicks)

**Reusable Utility**: Use `focusRingClasses` from `@/utils/accessibility` for consistency.

**Hover-Only Elements**: Use `useFocusVisible` hook from `@/utils/accessibility` for elements that are hidden by default and shown on hover, but must be visible when focused.

### Common Patterns

**Form Input with Label:**

```tsx
<label htmlFor="email-input">Email</label>
<Input id="email-input" type="email" />
```

**Icon Button:**

```tsx
<Button aria-label="Close dialog">
  <X />
</Button>
```

**Error State:**

```tsx
<Input
  id="email-input"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error" role="alert">Invalid email address</span>
```

**Loading State:**

```tsx
<div aria-busy="true" aria-live="polite">
  Loading...
</div>
```

---

## Storybook Best Practices

Stories are **visual documentation** and **interactive test cases**. All 62+ story files include play functions that test component interactions, accessibility, and visual states.

**Status**: ✅ **Complete** - All stories have play functions, testing utilities are in place, and templates are available.

**Do:**

- **Use controls for state variations** instead of separate stories - One Playground story per component with controls covers most cases
- Create stories that showcase component states and variations (via controls, not separate stories)
- Use `play` functions for interaction testing (keyboard navigation, user flows, state changes)
- Keep stories minimal and focused (1 concept per story)
- Add brief JSDoc comments explaining each story's purpose
- Use `storybook/test` utilities (`expect`, `userEvent`, `within`) for assertions
- Leverage Storybook's built-in testing (play functions, Vitest addon, accessibility addon)
- Use `data-test-id` attributes for test selectors (makes tests resilient to UI changes)
- Use testing utilities from `@/utils/storybook-test-helpers` for common patterns

**Don't:**

- **Create separate stories for every prop combination** - Use controls instead (we consolidated from 500+ stories to 50-75 by using controls)
- Put performance tests in stories (use `*.test.tsx` files instead)
- Create stories with complex automated test logic (loops, timing, etc.)
- Duplicate unit test coverage in stories
- Add more than 1-3 stories per component (use controls for variations)
- Use `getByText()` or `getByRole()` for component identification (use `getByTestId()` instead)

**Story Naming:**

- `Default` - basic component with default props
- `WithContent` - component with realistic content
- `[StateName]` - specific state (e.g., `SidebarCollapsed`, `Loading`, `Error`)
- `FullIntegration` - component with real child components
- `[Feature]Test` - stories with `play` functions for automated testing

**Example with Controls and Play Function:**

```tsx
import { expect, userEvent, within } from 'storybook/test';
import { tabToElement } from '@/utils/storybook-test-helpers';

// Use controls for state variations, not separate stories
export const Playground: Story = {
  args: { variant: 'default', size: 'default', disabled: false },
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive', 'outline'] },
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
    disabled: { control: 'boolean' },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByTestId('submit-button');

    await step('Tab to button and activate', async () => {
      const focused = await tabToElement(button, 5);
      expect(focused).toBe(true);
      await expect(button).toHaveFocus();
      await userEvent.keyboard('{Enter}');
    });
  },
};
```

**Testing Approaches:**

1. **Play Functions** - For component interactions (recommended for most cases) - ✅ All 62+ stories have play functions
2. **Playwright E2E** - For complex multi-component flows and cross-browser testing (keyboard navigation specifically)
3. **Vitest Addon** - Convert stories to test cases automatically (run via `npm run test-storybook`) - ✅ Configured
4. **Accessibility Addon** - Automatic a11y checks on all stories - ✅ Configured

**Testing Utilities:**

Use utilities from `@/utils/storybook-test-helpers`:

- `tabToElement(target, maxTabs?)` - Tab to a specific element
- `waitForFocus(element, timeout?)` - Wait for focus
- `waitForRemount(selector, timeout?)` - Wait for remount
- `waitForState(getState, expected, timeout?)` - Wait for state change

**Story Templates:**

Templates are available in `.storybook/templates/`:

- `interaction-story.template.tsx` - For user interactions
- `accessibility-story.template.tsx` - For a11y testing
- `visual-story.template.tsx` - For visual states

**Coverage:**

- ✅ **UI Components** (15 files) - All have play functions
- ✅ **Layout Components** (5 files) - All have play functions
- ✅ **Request Components** (5 files) - All have play functions
- ✅ **Response Components** (2 files) - All have play functions
- ✅ **History Components** (6 files) - All have play functions
- ✅ **Console Components** (2 files) - All have play functions
- ✅ **DataGrid Components** (10+ files) - All have play functions

**Related Documentation:**

- `docs/STORYBOOK_TESTING.md` - Complete testing guide
- `docs/STORYBOOK_TEMPLATES.md` - Template usage guide
- `docs/STORYBOOK_10_FEATURES.md` - Storybook 10 features
- `.cursor/skills/storybook-testing/SKILL.md` - Complete testing guide

---

## Type Generation (ts-rs)

**Critical:** When changing Rust types that are used in TypeScript:

1. Update Rust struct/enum
2. Run `just generate-types`
3. Types are copied to `src/types/generated/`
4. Import from `@/types/generated/` in frontend

**Never manually edit files in `src/types/generated/`** — they are auto-generated.

---

## Commit Convention

```text
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `test`, `refactor`, `docs`, `style`, `chore`

**Examples:**

```text
feat(http): add request timeout configuration
fix(ui): resolve header tab overflow on small screens
test(auth): add bearer token validation tests
```

---

## PR Workflow

### Creating Pull Requests

Use `/pr` command to create pull requests with comprehensive descriptions. See `.claude/commands/pr.md` for full details including PR description template, title format, and agent detection.

### Fixing PR Check Failures

Use `/pr-check-fixes` to systematically fix failing CI checks. See `.claude/commands/pr-check-fixes.md` for full details.

**Process:**

1. **Identify PR and repo context:**
   - Get current branch name (`git branch --show-current`)
   - Resolve PR via `gh pr view --json number,title,state,headRefName,baseRefName,url`
   - If no PR exists: inform user and suggest `/pr` first

2. **Pull latest check state:**
   - Fetch PR checks via `gh pr view <PR> --json statusCheckRollup,mergeStateStatus,reviewDecision`
   - Wait for latest run if in progress (poll with 10-20s backoff, max 5-7 min)
   - Prioritize run associated with current head SHA

3. **Summarize status:**
   - List each check with name, status, conclusion, and URL
   - Call out failures and skipped checks
   - Provide merge status

4. **Triage failures:**
   - Open logs via `detailsUrl` and extract failing step + error output
   - Group by category: **format**, **lint**, **typecheck**, **tests**, **migration**, **performance**, **coverage**, **build**
   - **Note:** Pre-push hook automatically skips tests for documentation-only changes

5. **Fix with strict TDD:**
   - Follow **RED → GREEN → REFACTOR** for each failure
   - Ensure coverage remains ≥85%
   - Run minimal local command to reproduce failure before changes
   - Apply formatting/lint fixes (`just fmt`, `just pre-commit`) when relevant
   - Avoid unrelated refactors

6. **Validate fixes locally:**
   - **ALWAYS run `just ci` as final validation** (not just `just test`)
   - Re-run exact failing check command
   - Confirm specific failure is gone
   - Verify all checks pass locally

7. **Report and update:**
   - Summarize what was fixed and what remains
   - If new commits made, push and re-check CI status
   - Continue loop until clean or blocked

**Quality Gates (must all pass):**

1. ✅ Formatting: `just fmt-check` or `just fmt`
2. ✅ Linting: `just lint` (Rust clippy + ESLint)
3. ✅ Type checking: `just check` (cargo check + TypeScript)
4. ✅ Unit tests: Rust tests + frontend tests
5. ✅ E2E tests: Playwright tests
6. ✅ Migration tests: For overhauls with data structure changes
7. ✅ Performance tests: For data-heavy features (with thresholds)
8. ✅ Coverage: ≥85% (verify with coverage reports)
9. ✅ Browser validation: Open Chrome tools, validate functionality, page source, console errors

**Commands Cheat Sheet:**

- Check PR + CI: `gh pr view --json statusCheckRollup,mergeStateStatus,reviewDecision`
- Logs: Use `detailsUrl` from `statusCheckRollup` or `gh run view <run-id> --log`
- Local verification:
  - `just pre-commit` - Fast checks before committing
  - `just test` - Run all tests (iteration)
  - `just ci` - **Full CI gate (required final run)**
  - `just fmt` - Fix formatting

### Managing PR Comments

Use `/pr-comments` to fetch, review, address, and resolve PR comments. See `.claude/commands/pr-comments.md` for full details including process, reply formats, and acceptance criteria.

---

## Key Architectural Principles

1. **HTTP client is the Trojan horse** — Comprehension layer is the payload
2. **Local-first:** All data stored locally, no cloud sync, no telemetry
3. **Git-friendly:** YAML/JSON storage, collections are code
4. **AI verification over generation:** Validate AI output against specs, don't just generate
5. **Progressive disclosure:** Features reveal based on user behavior, not menus
6. **MCP-powered:** Support MCP 2025-11-25 spec (async ops, elicitation)

**Core Architectural Patterns:** See `.cursorrules` for detailed patterns including event-driven architecture, loose coupling, MCP integration, and layer-specific patterns (React/TypeScript frontend, Rust/Tauri backend).

---

## The Adoption Ladder

Features are designed for progressive discovery:

| Rung | Trigger                  | Features Revealed               |
| ---- | ------------------------ | ------------------------------- |
| 1    | First request            | Response viewer, history        |
| 2    | Spec imported            | Canvas view, endpoint nodes     |
| 3    | Request bound to spec    | Drift detection                 |
| 4    | AI generates request     | Verification panel, ghost nodes |
| 5    | Second spec loaded       | Semantic link suggestions       |
| 6    | Spec has version history | Temporal awareness              |

---

## Signal System

Intelligence communicates through consistent visual signals:

| Signal | Color     | Meaning                               |
| ------ | --------- | ------------------------------------- |
| Green  | `#22c55e` | Verified, safe, all clear             |
| Amber  | `#f59e0b` | Drift detected, needs investigation   |
| Red    | `#ef4444` | Breaking change, critical issue       |
| Purple | `#a855f7` | AI-generated (suspect until verified) |
| Blue   | `#3b82f6` | Suggestion available                  |

**HTTP Method Colors (Industry Standard):**

| Method  | Color     | Meaning          |
| ------- | --------- | ---------------- |
| GET     | `#3b82f6` | Read, safe       |
| POST    | `#22c55e` | Create, positive |
| PUT     | `#f59e0b` | Update, caution  |
| PATCH   | `#f59e0b` | Update, caution  |
| DELETE  | `#ef4444` | Destructive      |
| HEAD    | `#6b7280` | Meta/secondary   |
| OPTIONS | `#6b7280` | Meta/secondary   |

---

## Motion+ Integration

**Motion+ Access**: The project has access to Motion+ premium components and patterns.

**Location**: Motion+ repository at `/Users/paul/Documents/GitHub/plus`

**Available Components**:

- `Carousel` - Horizontal scrolling with touch/swipe gestures
- `Ticker` - Continuous scrolling animations
- `Cursor` - Custom cursor interactions
- `AnimateNumber` - Number animations
- `AnimateText` - Text animations
- `Typewriter` - Typewriter effect

**Usage**:

- Import from `motion-plus/react` for React components
- Follow patterns from `/Users/paul/Documents/GitHub/plus/dev/react-env/src/app/tests/[slug]/components`
- See [Motion+ documentation](https://plus.motion.dev/)

**Current Implementation**:

- Filter bar uses native CSS scroll with Motion animations for gradient cues
- Can be upgraded to Motion+ Carousel for smoother scrolling if needed
- Motion+ patterns available for future enhancements

## References

- [Tauri v2 Docs](https://v2.tauri.app/)
- [React 19](https://react.dev/)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [Motion](https://motion.dev/)
- [Motion+](https://plus.motion.dev/)
- [MCP Spec](https://modelcontextprotocol.io/)
- [ts-rs](https://github.com/Aleph-Alpha/ts-rs)

**Internal Docs:**

- `docs/DECISIONS.md` — Historical architectural decisions
