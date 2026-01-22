# Storybook Configuration

Storybook serves as both a **documentation tool** and a **comprehensive testing platform** for runi components. All 62+ story files include play functions that test component interactions, accessibility, and visual states.

## Features

### ✅ Vitest Addon

Automatically converts stories with play functions into test cases that run in CI/CD.

**Run tests**: `npm run test-storybook`

### ✅ Accessibility Addon

Automatically checks all stories for WCAG 2.1 AA compliance violations.

**View results**: Open the "Accessibility" panel in Storybook to see violations.

### ✅ Visual Testing

Visual regression testing via Playwright in `tests/visual/storybook-visual.spec.ts`.

**Run tests**: `npm run test:visual`

### ✅ Testing Utilities

Reusable utilities in `@/utils/storybook-test-helpers`:

- `tabToElement()` - Tab to a specific element
- `waitForFocus()` - Wait for focus
- `waitForRemount()` - Wait for remount
- `waitForState()` - Wait for state change

### ✅ Story Templates

Templates in `.storybook/templates/`:

- `interaction-story.template.tsx` - For user interactions
- `accessibility-story.template.tsx` - For a11y testing
- `visual-story.template.tsx` - For visual states

## Viewing Interaction Tests

Interaction tests run automatically when viewing stories, but you need to:

1. **Switch to Canvas view** (not Docs view)
   - Click the "Canvas" tab at the top of the story view
   - Docs view shows documentation but doesn't run interactions

2. **Open the Interactions panel**
   - Look for the "Interactions" tab in the bottom panel
   - This shows the test steps as they execute
   - You can see each step pass/fail in real-time

3. **All stories have play functions**
   - Tests run automatically when you load any story
   - Each story tests specific interactions, accessibility, or visual states

## Story Organization

- **Layout/** - MainLayout, Sidebar, DockablePanel, StatusBar, TitleBar (5 files)
- **Request/** - AuthEditor, BodyEditor, HeaderEditor, ParamsEditor, RequestHeader (5 files)
- **Response/** - ResponseViewer, StatusBadge (2 files)
- **History/** - NetworkHistoryPanel, FilterBar, CopyButton, LanguageTabs, etc. (6 files)
- **Console/** - ConsolePanel, ConsoleToolbar (2 files)
- **DataGrid/** - VirtualDataGrid, columns, tabs, accessibility stories (10+ files)
- **ui/** - Button, Input, Select, Checkbox, Card, Toast, etc. (15 files)

## Running Tests

### Development

```bash
# Start Storybook (tests run automatically when viewing stories)
npm run storybook

# View interaction tests:
# 1. Select a story from sidebar
# 2. Switch to "Canvas" tab (not "Docs")
# 3. Open "Interactions" panel at bottom
# 4. Tests run automatically
```

### CI/CD

```bash
# Run all Storybook tests via Vitest
npm run test-storybook

# Run visual regression tests
npm run test:visual

# Run E2E tests (includes Storybook tests)
npm run test:e2e
```

## Test Selectors

**CRITICAL**: Always use `data-test-id` attributes for test selectors.

- Components must include `data-test-id` attributes on all interactive elements
- Test files must use `getByTestId()` or `screen.getByTestId()` for finding elements
- Exception: Use semantic queries (`getByRole`, `getByLabel`) only when testing accessibility

**Example**:

```tsx
// Component
<button data-test-id="save-button">Save</button>;

// Test
const button = canvas.getByTestId('save-button');
```

## Coverage

All 62+ story files include play functions that test:

- ✅ **UI Components** (15 files) - Button, Input, Select, Checkbox, Card, Toast, etc.
- ✅ **Layout Components** (5 files) - MainLayout, Sidebar, DockablePanel, StatusBar, TitleBar
- ✅ **Request Components** (5 files) - AuthEditor, BodyEditor, HeaderEditor, ParamsEditor, RequestHeader
- ✅ **Response Components** (2 files) - ResponseViewer, StatusBadge
- ✅ **History Components** (6 files) - NetworkHistoryPanel, FilterBar, CopyButton, LanguageTabs, etc.
- ✅ **Console Components** (2 files) - ConsolePanel, ConsoleToolbar
- ✅ **DataGrid Components** (10+ files) - VirtualDataGrid, columns, tabs, accessibility stories

## Related Documentation

- `docs/STORYBOOK_TESTING.md` - Complete testing guide
- `docs/STORYBOOK_TEMPLATES.md` - Template usage guide
- `docs/STORYBOOK_10_FEATURES.md` - Storybook 10 features
- `CLAUDE.md` - Storybook best practices section
- `.cursor/skills/storybook-testing/SKILL.md` - Complete testing guide
