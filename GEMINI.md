# runi — Project Instructions

Essential guidance for working with the runi codebase.

## Product Context

runi is an **API comprehension layer for the AI age**. It starts as a familiar HTTP client and progressively reveals intelligence features.

**The dual identity:**

- **What they see:** HTTP client ("Like Postman/Bruno")
- **What they get:** Comprehension layer (drift detection, AI verification, semantic links)

**The tagline:** _"See the truth about your APIs"_

**The brand philosophy:** _"Collapse uncertainty into truth"_

**The visual tone:** Zen, calm, and book-like. Muted surfaces, soft contrast, and selective emphasis. Use color as a signal, not decoration.

## Build & Test Commands

All commands use `just` (see `justfile`). CI and local commands are identical.

**Essential Commands:**

```bash
just install      # First-time setup
just dev          # Development server
just ci           # Full CI pipeline (before pushing)
just pre-commit   # Fast checks (before committing)
just fmt          # Fix formatting
just test         # Run all tests (iteration)
just generate-types  # Generate TypeScript types from Rust (ts-rs)
```

## Tech Stack

| Component  | Technology                      |
| ---------- | ------------------------------- |
| Runtime    | Tauri v2.9.x                    |
| Backend    | Rust 1.80+                      |
| Frontend   | React 19 + TypeScript 5.9       |
| Build      | Vite 7.x                        |
| Styling    | Tailwind CSS 4.x                |
| Animation  | Motion 12.x                     |
| Routing    | React Router 7.x                |
| State      | Zustand                         |
| Icons      | Lucide                          |
| AI (local) | Ollama (optional)               |
| AI (cloud) | Anthropic Claude API (optional) |

## Architecture & Patterns

For comprehensive architectural patterns (event-driven architecture, loose coupling, MCP integration, component separation, and visual layering), see:

@.claude/skills/runi-architecture/SKILL.md

## Coding Standards

### Rust

- All public items require doc comments
- Use `Result<T, String>` for Tauri commands
- Group imports: std → external → internal
- Async commands for I/O operations
- Pedantic clippy: `-D warnings` (see `Cargo.toml` for allowed exceptions)
- 3-layer architecture: `domain/` → `application/` → `infrastructure/`

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

## Testing Requirements

### Coverage Minimum: 85%

- Rust: `cargo tarpaulin --out Html`
- Frontend: `pnpm test:coverage`

**TDD Workflow (Mandatory):**

1. Write failing test first (RED)
2. Write minimum code to pass (GREEN)
3. Refactor while tests stay green (REFACTOR)
4. Commit only when `just ci` passes

**Test Types:**

- **Unit tests**: Always required (≥85% coverage)
- **Integration tests**: For multi-component interactions
- **E2E tests**: For user-facing features and complex interactions (Playwright)
- **Migration tests**: Required for overhauls that change data structures or APIs
- **Performance tests**: Required for data-heavy features (include thresholds, e.g., render 1000 rows in <500ms)

**Test Selectors (CRITICAL):**

- **Always use `data-test-id` attributes** for test selectors
- Never use generic selectors like `getByText`, `getByRole`, or `getByLabel` for component identification
- `data-test-id` makes tests resilient to UI changes (text, styling, structure)
- Components must include `data-test-id` attributes on all interactive elements and key test targets
- Test files must use `getByTestId` or `screen.getByTestId` for finding elements
- Example: `<button data-test-id="save-button">Save</button>` → `screen.getByTestId('save-button')`
- **Exception**: Use semantic queries (`getByRole`, `getByLabel`) only when testing accessibility, not for component identification

## Accessibility

### WCAG 2.1 AA Compliance

All components must meet WCAG 2.1 Level AA standards:

- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Readers**: Proper ARIA attributes and semantic HTML
- **Focus Management**: Visible focus indicators, logical tab order
- **Reduced Motion**: Respect `prefers-reduced-motion` setting

### Component Accessibility Checklist

- [ ] All interactive elements have keyboard support
- [ ] Form inputs have associated labels (`htmlFor`/`id` or `aria-label`)
- [ ] Icon-only buttons have `aria-label`
- [ ] Custom components use appropriate ARIA roles
- [ ] Focus indicators are visible (minimum 2px outline, theme token `--color-ring`)
- [ ] Color is not the only means of conveying information
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Error states use `aria-invalid` and `aria-describedby`
- [ ] Loading states use `aria-busy` and `aria-live`

### Focus Ring Standard

All interactive elements must use consistent focus ring styling. Use `focusRingClasses` from `@/utils/accessibility` for all interactive focus indicators:

- **Color**: theme token `--color-ring`
- **Width**: `2px` (`ring-2`)
- **Offset**: `2px` (`ring-offset-2`)
- **Offset Color**: `bg-app` (`ring-offset-bg-app`)
- **Pseudo-class**: `:focus-visible` (only shows on keyboard focus, not mouse clicks)

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

## Type Generation (ts-rs)

**Critical:** When changing Rust types that are used in TypeScript:

1. Update Rust struct/enum
2. Run `just generate-types`
3. Types are copied to `src/types/generated/`
4. Import from `@/types/generated/` in frontend

**Never manually edit files in `src/types/generated/`** — they are auto-generated.

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
