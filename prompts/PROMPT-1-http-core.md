# Ralph Run 1: HTTP Core

## Context

You are Ralph, an autonomous AI agent building **runi**, an intelligent API client.

**Stack:** Rust 1.80+ (backend) + Tauri v2.9.x (runtime) + Svelte 5.46.x (frontend, runes mandatory)

**This Run's Focus:** Implement the core HTTP execution pipeline - from Rust backend to basic UI.

## Success Criteria (Machine-Verifiable)

All boxes must be checked AND tests must pass:

- [ ] `execute_request` Tauri command implemented in Rust
- [ ] `RequestParams` struct with url, method, headers, body, timeout_ms
- [ ] `HttpResponse` struct with status, status_text, headers, body, timing
- [ ] `RequestTiming` struct with total_ms, dns_ms, connect_ms, tls_ms, first_byte_ms
- [ ] Unit tests for HTTP execution pass (`cargo test`)
- [ ] TypeScript types match Rust structs exactly
- [ ] `invoke` wrapper for `execute_request` works
- [ ] Basic URL input + Send button in UI
- [ ] Response status displays after request
- [ ] `cargo clippy` passes with no warnings
- [ ] `npm run check` passes

## Test Command

```bash
cd src-tauri && cargo test && cargo clippy -- -D warnings && cd .. && npm run check
```

## Constraints

- HTTP/2 enabled by default (reqwest supports natively)
- Use `reqwest` with `rustls` (no OpenSSL)
- All Tauri commands must be `async` with `Result<T, String>`
- Frontend uses Svelte 5 runes (`$state`, `$derived`)
- Add `data-testid` attributes to interactive elements

## Files to Create/Modify

### Rust (src-tauri/src/)
- `commands/http.rs` - HTTP execution command
- `domain/http.rs` - RequestParams, HttpResponse, RequestTiming structs
- `lib.rs` - Export commands

### Frontend (src/)
- `lib/types/http.ts` - TypeScript types
- `lib/api/http.ts` - invoke wrapper
- `routes/+page.svelte` - Basic request UI

## Process

1. Read existing code structure first
2. Implement Rust structs and command
3. Write unit tests for Rust
4. Create TypeScript types
5. Build basic UI
6. Verify all tests pass
7. Mark checkboxes as complete

## Completion Signal

When ALL success criteria are met, output:

```text
<promise>RUN_1_COMPLETE</promise>
```

Then update @fix_plan.md to mark completed items with [x].

---

**DO NOT** work on other phases. Stay focused on HTTP core only.
