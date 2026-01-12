# Ralph Prompts for runi Phase 1

This directory contains focused prompts for Ralph loop runs using [frankbria/ralph-claude-code](https://github.com/frankbria/ralph-claude-code).

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
# Run 1: HTTP Core
ralph -p prompts/PROMPT-1-http-core.md --monitor

# Run 2: Layout UI (after Run 1)
ralph -p prompts/PROMPT-2-layout-ui.md --monitor

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

| Run | Prompt                        | Focus                                 |
| --- | ----------------------------- | ------------------------------------- |
| 1   | `PROMPT-1-http-core.md`       | HTTP execution backend + basic UI     |
| 2   | `PROMPT-2-layout-ui.md`       | Three-panel layout + response viewer  |
| 3   | `PROMPT-3-request-builder.md` | Tabs, headers, body, auth             |
| 4   | `PROMPT-4-intelligence.md`    | Suggestions & warnings infrastructure |

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

## Best Practices (per frankbria/ralph-claude-code)

1. **Be specific** - Clear requirements produce better outcomes
2. **Use @fix_plan.md** - Ralph monitors this for completion
3. **Set clear boundaries** - Define in-scope and out-of-scope
4. **Provide examples** - Demonstrate expected patterns
5. **Document decisions** - Record in CLAUDE.md Decision Log
