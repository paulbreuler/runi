# Ralph Run 2: Layout & Response UI

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**Prerequisites:** Run 1 (HTTP Core) must be complete.

**This Run's Focus:** Build the three-panel layout and response viewer with JSON highlighting.

## Success Criteria (Machine-Verifiable)

All boxes must be checked AND tests must pass:

- [ ] Three-panel layout component (sidebar, request panel, response panel)
- [ ] Responsive panel resizing with drag handles
- [ ] Sidebar placeholder (collections/history sections)
- [ ] URL input with method selector dropdown (GET, POST, PUT, PATCH, DELETE)
- [ ] Send button with loading state (spinner while request in flight)
- [ ] Response status badge with color coding (2xx green, 4xx yellow, 5xx red)
- [ ] JSON syntax highlighting in response body (use Shiki or Prism)
- [ ] Response headers display (collapsible)
- [ ] Response timing metrics display
- [ ] Raw/Pretty toggle for body view
- [ ] Error handling UI for failed requests
- [ ] `npm run check` passes
- [ ] `npm run lint` passes

## Test Command

```bash
npm run check && npm run lint && npm test
```

## Constraints

- All components use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Add `data-testid` attributes to ALL interactive elements
- Follow WCAG 2.1 AA: focus indicators, keyboard navigation
- Use CSS custom properties for theming (prepare for dark mode)
- No external UI component libraries (build from scratch)

## Files to Create/Modify

### Components (src/lib/components/)
- `Layout/ThreePanel.svelte` - Main layout with resizable panels
- `Layout/Sidebar.svelte` - Sidebar navigation
- `Request/UrlBar.svelte` - URL input + method selector + send button
- `Response/ResponsePanel.svelte` - Response container
- `Response/StatusBadge.svelte` - Color-coded status display
- `Response/BodyViewer.svelte` - JSON highlighting + raw/pretty toggle
- `Response/HeadersViewer.svelte` - Collapsible headers
- `Response/TimingDisplay.svelte` - Timing metrics

### Routes
- `routes/+page.svelte` - Integrate layout and components

## Process

1. Read existing code from Run 1
2. Create layout component with resizable panels
3. Build response viewer components
4. Integrate with existing HTTP execution
5. Add loading states and error handling
6. Verify lint and type checks pass
7. Mark checkboxes as complete

## Completion Signal

When ALL success criteria are met, output:

```text
<promise>RUN_2_COMPLETE</promise>
```

Then update @fix_plan.md to mark completed items with [x].

---

**DO NOT** work on tabs, auth, or intelligence features. Stay focused on layout and response UI.
