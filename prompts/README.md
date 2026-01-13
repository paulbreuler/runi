# Ralph Prompts for runi

This directory contains focused prompts for Ralph loop runs using [frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code) **v0.9.8**.

## How Ralph Detects Completion

Ralph automatically exits when it detects:

1. **All tasks in `@fix_plan.md` marked `[x]`**
2. Multiple consecutive "done" signals from Claude
3. Too many test-focused loops (feature completeness)
4. Circuit breaker activation (repeated errors)

## Two Approaches

### Option A: Single Run with Master PROMPT.md (Recommended)

Use the root `PROMPT.md` + `@fix_plan.md` for automatic exit detection:

```bash
# From project root
ralph --monitor --verbose
```

Ralph will work through `@fix_plan.md` tasks and auto-exit when Phase 1 is complete.

### Option B: Split Runs by Phase

For more control, use phase-specific prompts:

```bash
# Run 1.5: Tech Stack Alignment (run first)
ralph -p prompts/PROMPT-1.5-tech-stack-alignment.md --monitor

# Run 1: HTTP Core
ralph -p prompts/PROMPT-1-http-core.md --monitor

# Run 2A: Layout Foundation (after Run 1)
ralph -p prompts/PROMPT-2A-layout-foundation.md --monitor

# Run 2B: Request/Response Basics (after Run 2A)
ralph -p prompts/PROMPT-2B-request-response-basics.md --monitor

# Run 2C: Response Viewer Polish (after Run 2B)
ralph -p prompts/PROMPT-2C-response-viewer-polish.md --monitor

# Run 3: Request Builder (after Run 2)
ralph -p prompts/PROMPT-3-request-builder.md --monitor

# Run 4: Intelligence (after Run 3)
ralph -p prompts/PROMPT-4-intelligence.md --monitor
```

**Note:** When using `-p`, Ralph may not auto-detect completion from `@fix_plan.md`. Each prompt has its own completion checklist.

## Ralph CLI Reference

| Option              | Description                                    |
| ------------------- | ---------------------------------------------- |
| `-p, --prompt FILE` | Set prompt file (default: PROMPT.md)           |
| `-c, --calls NUM`   | Max calls per hour (default: 100)              |
| `-t, --timeout MIN` | Timeout per execution in minutes (default: 15) |
| `-m, --monitor`     | Start with tmux monitoring                     |
| `-v, --verbose`     | Show detailed progress                         |
| `--reset-circuit`   | Reset circuit breaker if stuck                 |
| `--reset-session`   | Clear session context                          |
| `-s, --status`      | Show current status                            |

## Run Order (if using split prompts)

| Run | Prompt                               | Focus                                             |
| --- | ------------------------------------ | ------------------------------------------------- |
| 1.5 | `PROMPT-1.5-tech-stack-alignment.md` | Tech stack alignment, Storybook + Tailwind v4 fix |
| 1   | `PROMPT-1-http-core.md`              | HTTP execution backend + basic UI                 |
| 2A  | `PROMPT-2A-layout-foundation.md`     | VS Code-style layout foundation                   |
| 2B  | `PROMPT-2B-request-response-basics.md` | Request header + response basics |
| 2C  | `PROMPT-2C-response-viewer-polish.md` | Response viewer polish (syntax highlighting)      |
| 3   | `PROMPT-3-request-builder.md`        | Tabs, headers, body, auth (shadcn-svelte)         |
| 4   | `PROMPT-4-intelligence.md`           | Suggestions & warnings infrastructure             |

**Note:** Run 1.5 should be executed first to ensure tech stack alignment before building features.

## Verification Between Runs

```bash
# Check all tests pass
cd src-tauri && cargo test && cd ..
npm test

# Check lint clean
cd src-tauri && cargo clippy -- -D warnings && cd ..
npm run lint

# Type checks
npm run check

# App builds
npm run build
```

## Troubleshooting

```bash
# Check current status
ralph --status

# Reset if stuck in error loop
ralph --reset-circuit

# Start fresh session
ralph --reset-session

# View logs
tail -f logs/ralph.log
```

### Ralph Exits Immediately with "Strong completion indicators"

**Symptom:** Ralph exits on loop 1 with message:

```
Exit condition: Strong completion indicators (2)
project_complete
```

**Cause:** The `.exit_signals` file contains stale `completion_indicators` from a previous successful run. Ralph's `--reset-session` and `--reset-circuit` do NOT clear this file (this is a [known issue](https://github.com/frankbria/ralph-claude-code/issues)).

**Fix:** Manually clear the exit signals file:

```bash
# Option 1: Delete the file (Ralph recreates it)
rm .exit_signals

# Option 2: Reset to empty state
echo '{"test_only_loops":[],"done_signals":[],"completion_indicators":[]}' > .exit_signals
```

Then restart Ralph.

### Ralph Keeps Looping Without Progress

**Symptom:** Ralph runs many loops but tasks aren't getting completed.

**Fix:**

1. Check `@fix_plan.md` - are tasks clearly defined?
2. Check if Claude is hitting errors: `tail -100 logs/ralph.log`
3. Reset circuit breaker: `ralph --reset-circuit`
4. Consider splitting into smaller prompts (see Option B above)

### Ralph Exits After 2-3 Loops (Premature Completion)

**Symptom:** Ralph exits after only 2-3 loops with "Strong completion indicators (2)" even though work isn't done.

**Cause:** Ralph accumulates `completion_indicators` each loop by detecting completion-like signals in Claude's output. When it reaches 2 indicators, it triggers exit. This can happen even when Claude didn't explicitly output a completion signal - Ralph may detect phrases that look like completion.

**Fix:**

1. Clear the accumulated indicators:

   ```bash
   echo '{"test_only_loops":[],"done_signals":[],"completion_indicators":[]}' > .exit_signals
   ```

2. Add explicit anti-completion instruction to your prompt:

   ```markdown
   ## IMPORTANT: Do NOT signal completion prematurely

   - Do NOT output phrases like "task complete", "all done", "finished" until ALL checkboxes are marked [x]
   - Do NOT output the completion signal (<promise>...</promise>) until verification commands pass
   - If you need more loops to complete the work, explicitly state "CONTINUING - more work needed"
   ```

3. Restart Ralph after clearing `.exit_signals`

**Prevention:** Structure prompts with machine-verifiable success criteria and explicit completion signals that only trigger when ALL criteria are met.

### Clean Slate Reset

If Ralph is in a bad state, do a full reset:

```bash
rm .exit_signals status.json .ralph_session 2>/dev/null
ralph --reset-session --reset-circuit
```

## Best Practices (per frankbria/ralph-claude-code)

1. **Be specific** - Clear requirements produce better outcomes
2. **Use @fix_plan.md** - Ralph monitors this for completion
3. **Set clear boundaries** - Define in-scope and out-of-scope
4. **Provide examples** - Demonstrate expected patterns (code snippets)
5. **Document decisions** - Record in CLAUDE.md Decision Log

---

## Targeted Prompt Examples for Agentic Iteration

These are example prompts that can be used for focused, single-task Ralph runs. Each prompt targets a specific feature implementation.

### Layout & Resizing

```text
"Implement a resizable vertical split pane for request builder and response viewer
using shadcn-svelte's Resizable (via paneforge integration), wrapped in Card
components for subtle shadows, ensuring default 40/60 split and drag-and-drop
persistence. Add ⌘B keyboard shortcut to toggle sidebar visibility."
```

### Body Editor with Syntax Highlighting

```text
"Build the body editor tab in BodyTab.svelte with Textarea as base, integrate
CodeMirror for JSON/GraphQL syntax highlighting and prettify, add icons to
type selectors (lucide-svelte for JSON/Form), and support multi-body toggling
with intelligent content-type auto-detection."
```

### Response Headers Table

```text
"Create the response headers table in HeadersViewer.svelte using shadcn Table,
make it collapsible with chevron toggle, add hover details with Tooltip for
long values, and integrate timing/stats with subtle hover effects."
```

### Real-time Request Preview

```text
"Develop a real-time raw HTTP request preview pane as a toggleable Card in
RequestBuilder, displaying cURL-equivalent text with syntax highlighting,
and add export buttons for code snippets (cURL, fetch, Python requests)."
```

### Method Dropdown with Colors

```text
"Implement the method selector dropdown using shadcn-svelte Select with
color-coded triggers: GET (green-600), POST (blue-600), PUT (yellow-600),
DELETE (red-600), PATCH (purple-600). Include hover states and smooth
transitions."
```

### Key-Value Editor

```text
"Create a reusable KeyValueEditor component with shadcn Input and Checkbox.
Support add/remove rows with lucide-svelte Plus/Trash2 icons, enable/disable
toggle per row, auto-focus on new row, and keyboard delete (Backspace on
empty row)."
```

### Status Bar

```text
"Build a status bar component showing environment switcher dropdown, AI
prompt hint (⌘I), and variable count indicator. Use shadcn Select for
environment and Badge for counts. Position fixed at bottom of viewport."
```

---

## Component Library Quick Reference

All prompts should reference the established component library:

| Component                                | Package                                   | Use Case         |
| ---------------------------------------- | ----------------------------------------- | ---------------- |
| Input, Select, Tabs, Card, Table, Button | `shadcn-svelte`                           | Core UI          |
| Checkbox, Label, Textarea                | `shadcn-svelte`                           | Form elements    |
| Resizable (Pane, PaneGroup, PaneResizer) | `paneforge`                               | Split panels     |
| Icons (Send, Plus, Trash2, etc.)         | `lucide-svelte`                           | Action icons     |
| Code highlighting                        | `codemirror` + `svelte-codemirror-editor` | JSON/body editor |

Install commands:

```bash
npx shadcn-svelte@latest init
npx shadcn-svelte@latest add input select tabs textarea card table button checkbox label
npm install paneforge lucide-svelte
npm install @codemirror/lang-json @codemirror/theme-one-dark codemirror svelte-codemirror-editor
```

---

## Prompt Writing Guidelines

When writing new prompts for Ralph:

1. **Start with context** - Stack, prerequisites, current focus
2. **Include wireframe/mockup** - Visual reference helps alignment
3. **Reference components** - Link to shadcn-svelte docs
4. **Provide code snippets** - Show expected patterns
5. **Define success criteria** - Machine-verifiable checkboxes
6. **Set boundaries** - Explicitly state what NOT to do
7. **Include completion signal** - `<promise>RUN_X_COMPLETE</promise>`
