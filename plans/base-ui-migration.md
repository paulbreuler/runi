# Base UI Migration Plan: Radix → Base UI

**Status:** Planning  
**Created:** 2026-01-29  
**Goal:** Full hard pivot from [Radix UI](https://www.radix-ui.com/) to [Base UI](https://base-ui.com) across runi. Base UI has superseded Radix (same creators: Radix, Floating UI, MUI). It is a single, tree-shakable, unstyled React component library with stronger composability and a future-proof foundation.

---

## 1. Why Base UI?

- **Same lineage:** From the creators of Radix, Floating UI, and Material UI. Base UI is the evolution of the Radix primitives approach.
- **Single package:** `@base-ui/react` with subpath imports (e.g. `@base-ui/react/button`). Tree-shakable; only used components are bundled.
- **Unstyled & flexible:** No visual opinions; works with Tailwind, CSS Modules, or any styling. Aligns with runi’s design tokens and zen aesthetic.
- **Composability:** `Component.Root`, `Component.Trigger`, etc. Similar mental model to Radix; uses `render` prop instead of `asChild` for polymorphism.
- **Accessibility:** WCAG-oriented, keyboard and screen reader friendly.
- **LLM-friendly docs:** “View as Markdown” and [llms.txt](https://base-ui.com/llms.txt) for AI-assisted migration and usage.

---

## 2. Current Radix Usage (Audit)

Run the full audit anytime:

```bash
npx tsx scripts/audit/run-audit.ts
```

**Component inventory:** 102 components (see `scripts/audit/output/component-inventory.json`).

### 2.1 Files That Import Radix

| File                                             | Radix import                                                                                         | Base UI equivalent                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/components/ui/button.tsx`                   | `Slot`                                                                                               | `Button` (use `render` instead of `Slot`/asChild)                               |
| `src/components/ui/select.tsx`                   | `Select` (Root, Group, Value, Trigger, Icon, Content, Viewport, Item, ItemText, ScrollUp/DownButton) | `Select` (`@base-ui/react/select`)                                              |
| `src/components/ui/Popover.tsx`                  | `Popover` (Root, Trigger, Anchor, Close, Portal, Content)                                            | `Popover` (Root, Trigger, Portal, Positioner, Popup, Close, Title, Description) |
| `src/components/ui/checkbox.tsx`                 | `Checkbox` (Root, Indicator)                                                                         | `Checkbox` (Root, Indicator)                                                    |
| `src/components/ui/Label.tsx`                    | `Label` (Root)                                                                                       | `Field.Label` (or standalone Label if present)                                  |
| `src/components/ui/separator.tsx`                | `Separator` (Root)                                                                                   | `Separator`                                                                     |
| `src/components/ui/Tooltip.tsx`                  | `Tooltip` (Provider, Root, Trigger, Content)                                                         | `Tooltip` (Provider, Root, Trigger, Portal, Positioner, Popup)                  |
| `src/components/ui/Toast/ToastProvider.tsx`      | `Toast`                                                                                              | `Toast` (Provider, Viewport, etc.)                                              |
| `src/components/ui/Toast/Toast.tsx`              | `Toast`                                                                                              | `Toast` (Root, Content, Title, Description, Close, Action)                      |
| `src/components/ui/Switch.tsx`                   | `Switch` (Root, Thumb)                                                                               | `Switch` (Root, Thumb)                                                          |
| `src/components/ui/SplitButton.tsx`              | `DropdownMenu`                                                                                       | `Menu` (Root, Trigger, Portal, Positioner, Popup, Item, etc.)                   |
| `src/components/PanelTabs.tsx`                   | `Tabs`                                                                                               | `Tabs` (Root, List, Tab, Panel, Indicator)                                      |
| `src/components/Layout/DockablePanel.tsx`        | `ScrollArea`                                                                                         | `Scroll Area` (Root, Viewport, Scrollbar, Content, Thumb, Corner)               |
| `src/components/DataGrid/tabs/ExpandedPanel.tsx` | `Tabs`                                                                                               | `Tabs`                                                                          |
| `src/components/DataGrid/tabs/TabNavigation.tsx` | `Tabs`                                                                                               | `Tabs`                                                                          |

### 2.2 Radix-Dependent Styles & Theme

| File                               | Usage                                                                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app.css`                      | `@import './styles/radix-colors.css'`; `[data-radix-scroll-area-viewport]`, `[data-radix-scroll-area-scrollbar]`, `[data-radix-scroll-area-thumb]` |
| `src/styles/theme-tokens.css`      | Comment reference to Radix theme color                                                                                                             |
| `src/styles/radix-colors.css`      | Radix theme color variables                                                                                                                        |
| `src/components/ThemeProvider.tsx` | References radix-ui/themes (or similar); may need replacement with Base UI–agnostic theme                                                          |

### 2.3 Tests That Mock Radix

- `src/components/PanelTabs.test.tsx` – `vi.mock('radix-ui', ...)`
- `src/components/DataGrid/tabs/ExpandedPanel.test.tsx` – `vi.mock('radix-ui', ...)`

These mocks must be updated to `@base-ui/react/*` (or removed if we only mock at a higher level).

---

## 3. API Differences (Radix vs Base UI)

| Concept               | Radix                                              | Base UI                                                                               |
| --------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Polymorphism          | `asChild` + `<Slot>`                               | `render` prop (e.g. `render={<div />}`) or `render={(props) => <div {...props} />`    |
| State data attributes | `data-state="open"` etc.                           | `data-open`, `data-disabled`, etc. (component-specific)                               |
| Portal content        | `Component.Portal` + `Component.Content`           | `Component.Portal` + `Component.Positioner` + `Component.Popup` (Popover, Menu, etc.) |
| Naming                | e.g. `Content`, `Trigger`                          | Same idea; some names differ (e.g. `Popup` vs `Content` where applicable)             |
| CSS variables         | Radix exposes e.g. `--radix-select-trigger-height` | Base UI uses e.g. `--anchor-height`, `--popup-height` (see each component’s docs)     |

**Select (runi):** We use `h-[var(--radix-select-trigger-height)]` in `select.tsx`. Base UI Select uses different positioning; we will need to switch to Base UI’s trigger/layout or their CSS variables.

---

## 4. Migration Order (Top to Bottom)

Order by dependency and risk: foundational UI first, then overlays, then layout and features.

### Phase 1 – Foundation (no overlay/portal logic)

1. **Button** – Replace Radix `Slot` with Base UI `Button`; use `render` for custom root (e.g. when rendering as link or div).
   - **Risk:** Low.
   - **Files:** `button.tsx`; all consumers keep same API if we preserve props.

2. **Separator** – Swap `SeparatorPrimitive.Root` for Base UI `Separator`.
   - **Risk:** Low.
   - **Note:** Base UI may not have `decorative`; use `role="separator"` and `aria-orientation` if needed for a11y.

3. **Label** – Replace Radix `Label.Root` with Base UI `Field.Label` (or equivalent).
   - **Risk:** Low.
   - **Files:** `Label.tsx`; ensure association with controls (id/htmlFor) is preserved.

4. **Input** – If it only uses native `<input>` and no Radix, skip. Otherwise align with Base UI `Input` and `Field` if we adopt Field.

### Phase 2 – Form controls

5. **Checkbox** – Radix `Checkbox.Root` + `Checkbox.Indicator` → Base UI `Checkbox.Root` + `Checkbox.Indicator`.
   - **Risk:** Low–medium.
   - **Files:** `checkbox.tsx`.
   - **Note:** Map `data-state="checked"` / `unchecked` / `indeterminate` to Base UI’s data attributes (e.g. `data-checked`, `data-indeterminate`).

6. **Switch** – Radix `Switch.Root` + `Switch.Thumb` (with `asChild`) → Base UI `Switch.Root` + `Switch.Thumb`.
   - **Risk:** Low.
   - **Files:** `Switch.tsx`. Use `render` instead of `asChild` for custom thumb/root.

7. **Select** – Full swap to Base UI Select (Root, Trigger, Value, Portal, Positioner, Popup, List, Item, ItemIndicator, etc.).
   - **Risk:** Medium.
   - **Files:** `select.tsx`.
   - **Actions:** Remove `--radix-select-trigger-height` usage; use Base UI layout/CSS vars; keep `SelectGroup`, `SelectValue` semantics via Base UI’s API.

### Phase 3 – Overlays (popovers, menus, tooltips, toasts)

8. **Popover** – Radix Popover → Base UI Popover (Root, Trigger, Portal, Positioner, Popup, Title, Description, Close).
   - **Risk:** Medium.
   - **Files:** `Popover.tsx`; all usages (e.g. StatusBar, filters).

9. **Tooltip** – Radix Tooltip (Provider, Root, Trigger, Content) → Base UI Tooltip (Provider, Root, Trigger, Portal, Positioner, Popup).
   - **Risk:** Low–medium.
   - **Files:** `Tooltip.tsx`; consumers (StatusBar, MetricsPanel, etc.).

10. **Toast** – Radix Toast → Base UI Toast (Provider, Viewport, Root, Content, Title, Description, Close, Action, Positioner, etc.).
    - **Risk:** Medium.
    - **Files:** `ToastProvider.tsx`, `Toast.tsx`; integrate with Base UI’s toast manager if we use it.

11. **SplitButton (dropdown)** – Radix `DropdownMenu` → Base UI `Menu` (Root, Trigger, Portal, Positioner, Popup, Item, etc.).
    - **Risk:** Medium.
    - **Files:** `SplitButton.tsx`.

### Phase 4 – Tabs and scroll

12. **Tabs** – Radix `Tabs` → Base UI `Tabs` (Root, List, Tab, Panel, Indicator).
    - **Risk:** Medium.
    - **Files:** `PanelTabs.tsx`, `DataGrid/tabs/TabNavigation.tsx`, `DataGrid/tabs/ExpandedPanel.tsx`.
    - **Tests:** Update `PanelTabs.test.tsx` and `ExpandedPanel.test.tsx` mocks.

13. **ScrollArea** – Radix `ScrollArea` → Base UI `Scroll Area` (Root, Viewport, Scrollbar, Content, Thumb, Corner).
    - **Risk:** Medium.
    - **Files:** `DockablePanel.tsx`; `app.css` (replace `[data-radix-scroll-area-*]` with Base UI scroll area selectors or our own classes).

### Phase 5 – Theme and global styles

14. **Theme and CSS**
    - Remove or replace `radix-colors.css` and Radix-specific variables with design tokens (e.g. from `theme-tokens.css`).
    - Replace `[data-radix-scroll-area-*]` in `app.css` with Base UI scroll area data attributes or local classes.
    - **ThemeProvider:** If it wraps Radix Themes, replace with a Base UI–agnostic theme provider (tokens only or Base UI’s theming if we adopt it).

15. **Cleanup**
    - Remove `radix-ui` from `package.json`.
    - Remove `.limps-radix/` if the Radix audit tooling is no longer needed (or repurpose for Base UI).
    - Update any remaining Radix references in comments and docs.

---

## 5. Implementation Checklist (Per Component)

For each component in the order above:

- [ ] Add `@base-ui/react` to dependencies; install.
- [ ] Replace Radix imports with Base UI subpath imports (e.g. `@base-ui/react/select`).
- [ ] Map `asChild`/`Slot` usage to `render` (and `nativeButton` where relevant).
- [ ] Update data attributes and CSS selectors (e.g. `data-state` → `data-open`, `data-checked`).
- [ ] Replace Radix CSS variables with Base UI or our own tokens.
- [ ] Preserve or improve a11y (focus, ARIA, keyboard).
- [ ] Keep existing public props where possible; extend or adapt only as needed.
- [ ] Update unit tests and mocks (replace `vi.mock('radix-ui', ...)` with Base UI or higher-level mocks).
- [ ] Run `just ci` (format, lint, typecheck, tests, E2E) and fix any regressions.
- [ ] Manually test in app (and Storybook if applicable).

---

## 6. Package and Scripts

- **Install:** `npm i @base-ui/react` (or pnpm/yarn).
- **Remove:** `radix-ui` after all migrations and theme/CSS cleanup.
- **Audit:** Keep using `scripts/audit/run-audit.ts` for component inventory; optionally add a small script or checklist to track “Base UI migrated” per file.

---

## 7. References

- [Base UI](https://base-ui.com)
- [Base UI React Components](https://base-ui.com/react/components)
- [Base UI Quick Start](https://base-ui.com/react/overview/quick-start)
- [Base UI llms.txt](https://base-ui.com/llms.txt) (for LLM-assisted migration)
- Runi audit output: `scripts/audit/output/` (component-inventory.json, library-usage.json, AUDIT_REPORT.md)

---

## 8. Summary

| Phase | Components                                  | Risk       |
| ----- | ------------------------------------------- | ---------- |
| 1     | Button, Separator, Label, Input (if needed) | Low        |
| 2     | Checkbox, Switch, Select                    | Low–Medium |
| 3     | Popover, Tooltip, Toast, SplitButton (Menu) | Medium     |
| 4     | Tabs, ScrollArea                            | Medium     |
| 5     | Theme/CSS, remove Radix                     | Low        |

**Total files with Radix imports:** 14 (+ 2 test mocks, 3 style/theme files).  
**Estimated effort:** ~2–4 days for a methodical top-to-bottom pass, plus CI and manual QA.

This plan is the single source of truth for the Base UI migration; update it as phases are completed or as Base UI APIs are refined.
