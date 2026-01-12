# Ralph Run 4: Intelligence Infrastructure

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**Prerequisites:** Runs 1-3 must be complete.

**This Run's Focus:** Build the intelligence infrastructure - types, commands, and UI for suggestions and security warnings.

## Success Criteria (Machine-Verifiable)

All boxes must be checked AND tests must pass:

### Rust Backend
- [ ] `Suggestion` struct (id, suggestion_type, severity, message, action)
- [ ] `SuggestionAction` enum (AddHeader, SetAuth, ModifyBody, Custom)
- [ ] `SecurityWarning` struct (code, severity, message, details, remediation)
- [ ] `SecurityReport` struct (warnings, passed)
- [ ] `RequestContext` struct (request, collection_id, environment_id)
- [ ] `get_suggestions` Tauri command (returns empty vec for now)
- [ ] `validate_security` Tauri command (returns empty report for now)
- [ ] Unit tests for intelligence structs
- [ ] `cargo test` passes
- [ ] `cargo clippy` passes

### Frontend
- [ ] TypeScript types matching Rust structs
- [ ] `invoke` wrappers for intelligence commands
- [ ] SuggestionCard component (inline, dismissable, "Apply" button)
- [ ] WarningBanner component (color-coded by severity)
- [ ] Suggestion display area in request panel
- [ ] Warning display area above send button
- [ ] `npm run check` passes
- [ ] `npm run lint` passes

## Test Command

```bash
cd src-tauri && cargo test && cargo clippy -- -D warnings && cd .. && npm run check && npm run lint
```

## Constraints

- Intelligence commands return empty/placeholder data for now
- UI must be ready to display suggestions when populated
- Warnings color-coded: info (blue), warning (yellow), error (red)
- Suggestions dismissable with X button
- "Apply" button on suggestions (wires to action handler)
- Use `aria-live` regions for screen reader announcements

## Files to Create/Modify

### Rust (src-tauri/src/)
- `domain/intelligence.rs` - Suggestion, SecurityWarning, etc.
- `commands/intelligence.rs` - get_suggestions, validate_security
- `lib.rs` - Export new commands

### Frontend Types (src/lib/types/)
- `intelligence.ts` - Suggestion, SecurityWarning, etc.

### Frontend API (src/lib/api/)
- `intelligence.ts` - invoke wrappers

### Components (src/lib/components/)
- `Intelligence/SuggestionCard.svelte` - Individual suggestion
- `Intelligence/SuggestionList.svelte` - List of suggestions
- `Intelligence/WarningBanner.svelte` - Security warning
- `Intelligence/WarningList.svelte` - List of warnings

### Integration
- Update `Request/` components to show suggestions
- Update `routes/+page.svelte` to display warnings

## Process

1. Read existing code structure
2. Implement Rust structs and placeholder commands
3. Write Rust unit tests
4. Create TypeScript types
5. Build suggestion and warning components
6. Integrate into existing UI
7. Verify all tests pass
8. Mark checkboxes as complete

## Completion Signal

When ALL success criteria are met, output:

```text
<promise>RUN_4_COMPLETE</promise>
```

Then update @fix_plan.md to mark completed items with [x].

---

**DO NOT** implement actual suggestion logic or security rules yet. This run builds the infrastructure only.
