# Ralph Run 3: Request Builder Tabs

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**Prerequisites:** Run 1 (HTTP Core) and Run 2 (Layout UI) must be complete.

**This Run's Focus:** Build the tabbed request builder with headers, body, params, and auth.

## Success Criteria (Machine-Verifiable)

All boxes must be checked AND tests must pass:

- [ ] Tabbed interface component (Params, Headers, Body, Auth tabs)
- [ ] Key-value editor component (reusable)
- [ ] Key-value pairs with add/remove buttons
- [ ] Checkbox to enable/disable individual pairs
- [ ] Headers tab using key-value editor
- [ ] Query Params tab using key-value editor
- [ ] Body tab with content-type selector (none, JSON, form-data, form-urlencoded, raw)
- [ ] JSON body editor with syntax highlighting
- [ ] Auth tab with type selector (None, API Key, Bearer, Basic)
- [ ] API Key auth (header or query param placement option)
- [ ] Bearer Token auth input
- [ ] Basic Auth (username/password with Base64 encoding)
- [ ] Request params integrated with `execute_request`
- [ ] `npm run check` passes
- [ ] `npm run lint` passes
- [ ] Component tests pass (`npm test`)

## Test Command

```bash
npm run check && npm run lint && npm test
```

## Constraints

- All components use Svelte 5 runes
- Key-value editor must be reusable across tabs
- Auth credentials encoded client-side before sending
- Add `data-testid` attributes to ALL interactive elements
- Keyboard accessible (Tab, Enter, Delete keys)

## Files to Create/Modify

### Components (src/lib/components/)
- `Request/TabPanel.svelte` - Tab container
- `Request/Tab.svelte` - Individual tab
- `Request/KeyValueEditor.svelte` - Reusable key-value pairs
- `Request/HeadersTab.svelte` - Headers configuration
- `Request/ParamsTab.svelte` - Query parameters
- `Request/BodyTab.svelte` - Body editor with type selector
- `Request/AuthTab.svelte` - Authentication configuration
- `Request/JsonEditor.svelte` - JSON body with highlighting

### Utils (src/lib/utils/)
- `auth.ts` - Base64 encoding, auth header formatting

### Types (src/lib/types/)
- `request.ts` - Tab state types, auth config types

## Process

1. Read existing layout and HTTP code
2. Create reusable key-value editor
3. Build tab components
4. Implement each tab (Headers, Params, Body, Auth)
5. Wire tabs to request execution
6. Write component tests
7. Mark checkboxes as complete

## Completion Signal

When ALL success criteria are met, output:

```text
<promise>RUN_3_COMPLETE</promise>
```

Then update @fix_plan.md to mark completed items with [x].

---

**DO NOT** work on intelligence features, persistence, or suggestions. Stay focused on request builder tabs.
