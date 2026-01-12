# Ralph Prompts for runi Phase 1

This directory contains focused prompts for Ralph loop runs, following best practices from [Geoffrey Huntley's Ralph technique](https://ghuntley.com/ralph/) and [Ralph Orchestrator](https://github.com/mikeyobrien/ralph-orchestrator).

## Why Split Prompts?

Based on Ralph best practices:

- **5-10 iterations** for small tasks, **30-50** for larger ones
- **Fix ONE issue per iteration** - focused work converges faster
- **Machine-verifiable success criteria** - checkboxes + test commands
- **Smaller batches** are easier to review and debug

Phase 1 has ~27 items. Running all at once would need 80+ iterations with higher failure risk. Splitting into 4 focused runs (15-20 iterations each) is more reliable.

## Run Order (Sequential)

Each run builds on the previous:

| Run | Prompt | Focus | Est. Iterations | Est. Cost |
|-----|--------|-------|-----------------|-----------|
| 1 | `PROMPT-1-http-core.md` | HTTP execution backend + basic UI | 15-20 | ~$6-8 |
| 2 | `PROMPT-2-layout-ui.md` | Three-panel layout + response viewer | 15-20 | ~$6-8 |
| 3 | `PROMPT-3-request-builder.md` | Tabs, headers, body, auth | 20-25 | ~$8-10 |
| 4 | `PROMPT-4-intelligence.md` | Suggestions & warnings infrastructure | 15-20 | ~$6-8 |

**Total Phase 1:** ~65-85 iterations, ~$26-34

## How to Run

### Using Ralph Orchestrator CLI

```bash
# Install
pip install ralph-orchestrator

# Run 1: HTTP Core
ralph-orchestrator --prompt prompts/PROMPT-1-http-core.md \
  --max-iterations 20 \
  --max-cost 10.0 \
  --completion-promise "RUN_1_COMPLETE" \
  --verbose

# Run 2: Layout UI (after Run 1 complete)
ralph-orchestrator --prompt prompts/PROMPT-2-layout-ui.md \
  --max-iterations 20 \
  --max-cost 10.0 \
  --completion-promise "RUN_2_COMPLETE" \
  --verbose

# Run 3: Request Builder (after Run 2 complete)
ralph-orchestrator --prompt prompts/PROMPT-3-request-builder.md \
  --max-iterations 25 \
  --max-cost 12.0 \
  --completion-promise "RUN_3_COMPLETE" \
  --verbose

# Run 4: Intelligence (after Run 3 complete)
ralph-orchestrator --prompt prompts/PROMPT-4-intelligence.md \
  --max-iterations 20 \
  --max-cost 10.0 \
  --completion-promise "RUN_4_COMPLETE" \
  --verbose
```

### Using Claude Code Ralph Plugin

```bash
# Run 1
/ralph-loop "Complete PROMPT-1-http-core.md" --max-iterations 20 --completion-promise "RUN_1_COMPLETE"

# Run 2 (after Run 1)
/ralph-loop "Complete PROMPT-2-layout-ui.md" --max-iterations 20 --completion-promise "RUN_2_COMPLETE"

# etc.
```

## Completion Signals

Each prompt uses a unique completion promise:

- Run 1: `<promise>RUN_1_COMPLETE</promise>`
- Run 2: `<promise>RUN_2_COMPLETE</promise>`
- Run 3: `<promise>RUN_3_COMPLETE</promise>`
- Run 4: `<promise>RUN_4_COMPLETE</promise>`

## Verification Between Runs

Before starting the next run, verify:

```bash
# All tests pass
cd src-tauri && cargo test && cd ..
npm test

# Lint clean
cd src-tauri && cargo clippy -- -D warnings && cd ..
npm run lint

# Type checks pass
npm run check

# App builds
npm run build
```

## Rollback Strategy

Each run should commit its work. If a run fails badly:

```bash
# See what Ralph did
git log --oneline -10

# Rollback to before the failed run
git reset --hard <commit-before-run>

# Try again with adjusted prompt or lower iteration count
```

## Monitoring Costs

Ralph Orchestrator tracks costs in `.agent/metrics/`. Watch for:

- Token usage per iteration
- Cost accumulation
- Iteration count vs progress

If stuck in a loop (same error repeating), the `--max-iterations` limit will stop it.

## After Phase 1

Once all 4 runs complete successfully:

1. Verify full integration works (`npm run dev`)
2. Run E2E tests (`VITE_PLAYWRIGHT=true npx playwright test`)
3. Update `@fix_plan.md` to mark Phase 1 complete
4. Create prompts for Phase 2 if needed
