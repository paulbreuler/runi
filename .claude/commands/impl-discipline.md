# Implementation Discipline

Pre-flight checklist for every implementation task. Invoke before writing code.

## Instructions for Claude

**When this command is invoked, acknowledge all 6 disciplines below and follow them
throughout the implementation. Reference this checklist before each file change.**

---

### 1. TDD Discipline (MANDATORY)

Every implementation follows RED → GREEN → REFACTOR:

1. **RED**: Write a failing test FIRST. Use `data-test-id` selectors exclusively:

   ```tsx
   screen.getByTestId('my-element'); // ✅ CORRECT
   screen.getByText('Submit'); // ❌ NEVER for identification
   screen.getByRole('button'); // ❌ NEVER for identification (only for a11y testing)
   ```

2. **Verify the test fails** before writing implementation code
3. **GREEN**: Write minimum code to pass the test
4. **REFACTOR**: Clean up while tests stay green
5. Check existing tests in the same directory for patterns and conventions
6. Components MUST include `data-test-id` on all interactive elements and key test targets

---

### 2. Component Reuse (CRITICAL)

**Decision tree — follow in order, stop at the first match:**

1. **Use as-is** — Does a component already exist that does this? Use it.
2. **Extend with props** — Can an existing component handle this with a new prop?
3. **Refactor existing** — Can an existing component be generalized?
4. **Create new** — LAST RESORT. Justify why none of the above work.

**Before creating ANY component, search:**

```text
src/components/ui/     — Base UI components
src/components/        — Feature components
```

**Canonical components** (use these, do not recreate):
`Button`, `Input`, `Select`, `Checkbox`, `Switch`, `Label`, `Separator`,
`Card`, `Tooltip`, `Popover`, `SplitButton`, `EmptyState`, `DataPanel`,
`BaseTabsList`, `NotificationTray`, `SegmentedControl`, `Toast`,
`VirtualDataGrid`, `CodeEditor`

**Reference**: `CLAUDE_CODE_COMPONENT_DISCIPLINE` (external planning doc; access via runi Planning MCP)

---

### 3. Semantic Tokens (MANDATORY)

**READ these files for current tokens** (source of truth — not docs):

- **`src/app.css`** lines 28–130 — `@theme` block with ALL Tailwind semantic tokens
- **`src/styles/theme-tokens.css`** — CSS custom properties, interactive states, dark/light themes

**Token categories:**

| Category    | Prefix                        | Examples                                                       |
| ----------- | ----------------------------- | -------------------------------------------------------------- |
| Background  | `bg-bg-`                      | `bg-bg-app`, `bg-bg-surface`, `bg-bg-raised`, `bg-bg-elevated` |
| Text        | `text-text-`                  | `text-text-primary`, `text-text-secondary`, `text-text-muted`  |
| Border      | `border-border-`              | `border-border-subtle`, `border-border-default`                |
| Signal      | `text-signal-` / `bg-signal-` | `text-signal-success`, `bg-signal-error`, `text-signal-ai`     |
| Method      | `text-method-` / `bg-method-` | `text-method-get`, `bg-method-post`                            |
| Accent      | `bg-accent-` / `text-accent-` | `bg-accent-blue`, `text-accent-purple`                         |
| Interactive | CSS vars                      | `var(--hover-bg)`, `var(--pressed-bg)`, `var(--selected-bg)`   |

**Elevation layering** (bottom → top):
`bg-bg-app` → `bg-bg-surface` → `bg-bg-raised` → `bg-bg-elevated` → `bg-bg-overlay`

**NEVER:**

- Use raw hex/rgb/oklch values (`#3b82f6`, `rgb(59, 130, 246)`)
- Use Tailwind defaults (`bg-blue-500`, `text-gray-300`, `border-zinc-700`)
- Invent color values not in the token system

---

### 4. Accessibility (MANDATORY)

**Focus rings — import from `@/utils/accessibility`:**

```tsx
import { focusRingClasses } from '@/utils/accessibility';
// Standard: ring-2 with --color-ring, offset-2, offset-bg-app

import { containedFocusRingClasses } from '@/utils/accessibility';
// For overflow:hidden containers: inset ring, zero offset

import { compositeFocusContainerClasses, compositeFocusItemClasses } from '@/utils/accessibility';
// For grouped controls: muted on container, primary on active item
```

**Programmatic focus — import from `@/utils/focusVisibility`:**

```tsx
import { focusWithVisibility } from '@/utils/focusVisibility';
// Sets data-focus-visible-added attribute for visible ring on .focus()
```

**Checklist:**

- [ ] All interactive elements have `focusRingClasses` (or appropriate variant)
- [ ] Keyboard accessible: Tab, Enter, Space, Arrow keys where appropriate
- [ ] Semantic HTML first (`<button>`, `<input>`, `<nav>`), ARIA only when needed
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated `<label>` with `htmlFor`
- [ ] Error states use `aria-invalid` + `aria-describedby`
- [ ] Loading states use `aria-busy` + `aria-live="polite"`
- [ ] Color is not the only means of conveying information

---

### 5. Motion Standards

**Imports:**

```tsx
import { motion, useReducedMotion } from 'motion/react'; // ✅ CORRECT
// import { motion } from 'framer-motion';                 // ❌ NEVER
```

**Standard spring:** `{ type: 'spring', stiffness: 400, damping: 25 }`

**Interaction feedback:**

- Hover: `scale: 1.02`
- Tap/press: `scale: 0.98`
- Use `noScale` prop for compact UI where scale is too much

**Rules:**

- All animations MUST respect `useReducedMotion()` — skip or reduce when true
- Transitions ≤ 250ms
- No bounces, no wiggles, no decorative animation
- Use `variants` for orchestrated multi-element animations

---

### 6. Fix Contraventions

**When touching code with existing violations:**

- **Fix if scope is reasonable** (same file, small change)
- **Flag to user if too large** — describe the violation and suggested refactor
- **NEVER replicate wrong patterns** just because surrounding code does it

**Common contraventions to watch for:**

- [ ] Hardcoded hex/rgb colors → replace with semantic tokens
- [ ] Missing `data-test-id` on interactive elements → add them
- [ ] Missing focus rings on interactive elements → add `focusRingClasses`
- [ ] `getByText`/`getByRole` in tests for identification → change to `getByTestId`
- [ ] `framer-motion` imports → change to `motion/react`
- [ ] Raw Tailwind colors (`bg-blue-500`) → replace with semantic tokens
- [ ] Missing `aria-label` on icon buttons → add them

---

## Quick Reference

**Commands:**

```bash
just test         # Run tests (iteration)
just pre-commit   # Fast checks before committing
just ci           # Full CI pipeline (before pushing)
just fmt          # Fix formatting
```

**Correct implementation example (all 6 disciplines):**

```tsx
// 1. TDD: test written first with data-test-id
// 2. Reuse: uses existing Button from ui/
// 3. Tokens: bg-bg-surface, text-text-primary, border-border-subtle
// 4. A11y: focusRingClasses, aria-label, keyboard support
// 5. Motion: motion/react, spring, respects reduced motion
// 6. Contraventions: fixed nearby hardcoded color

import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { focusRingClasses } from '@/utils/accessibility';

interface ActionCardProps {
  title: string;
  onAction: () => void;
}

export const ActionCard = ({ title, onAction }: ActionCardProps): JSX.Element => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      data-test-id="action-card"
      className={`bg-bg-surface border border-border-subtle rounded-lg p-4 ${focusRingClasses}`}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      tabIndex={0}
      role="group"
      aria-label={title}
    >
      <h3 className="text-text-primary text-sm font-medium">{title}</h3>
      <Button data-test-id="action-card-button" onClick={onAction} aria-label={`Execute ${title}`}>
        Run
      </Button>
    </motion.div>
  );
};
```

## Related Commands

- `/code-review` — Post-implementation review
- `/pr-create` — Create pull request
- `/pr-check-fixes` — Fix failing CI checks
