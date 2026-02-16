# What's Next

Planning-aware task recommender across LIMPS plans and GitHub issues.

## LLM Execution Rules

- Prefer LIMPS CLI with explicit config: `../runi-planning-docs/.limps/config.json`.
- Use `--json` outputs for `limps` and `gh`, then synthesize.
- Read-only operation: do not create/edit plans, issues, or code.
- If LIMPS fails, fall back to GitHub-only view. If GitHub fails, fall back to LIMPS-only view.

## Invocation

```text
/whats-next
/whats-next <plan-id | label | keyword>
```

## Instructions for Claude

When this command is invoked:

1. Gather LIMPS state:
   - `limps plan list --config ../runi-planning-docs/.limps/config.json --json`
   - For active plans (or the filtered plan):
     - `limps plan next <plan-id> --config ../runi-planning-docs/.limps/config.json --json`
     - `limps health check <plan-id> --config ../runi-planning-docs/.limps/config.json --json`
     - `limps proposals <plan-id> --config ../runi-planning-docs/.limps/config.json --json`
     - `limps plan agents <plan-id> --config ../runi-planning-docs/.limps/config.json --json`
2. Gather GitHub issue context:
   - `gh issue list --state open --limit 30 --json number,title,labels,createdAt,updatedAt,assignees,milestone`
3. For top LIMPS candidates, read agent files and extract:
   - feature ids, files touched, dependencies/blockers, current status
4. Produce prioritized recommendations with sections:
   - `Ready to Execute`
   - `Standalone Issues`
   - `Needs Triage`
   - `Parked`
   - `Health Summary`
5. Include estimated PR size per ready item:
   - Small `<200`, Medium `200-400`, Large `400-1000`, XL `>1000`

## Output Template

```markdown
## What's Next

### Ready to Execute

1. **Plan NNNN -> Agent NNN: <title>** (score: NN/100)
   - Features: F1-FN
   - Files: N | Est. PR size: ~NNN lines (Size)
   - GitHub: #NNN or "needs promotion"

### Standalone Issues (bugs, follow-ups)

N. **#NNN**: <title> — ~NNN lines (Size)

### Needs Triage

- **Plan NNNN / Agent NNN**: <warning>

### Parked (blocked or future)

- **Plan NNNN**: <reason>

### Health Summary

- Staleness warnings: N
- Pending proposals: N
- Unhealthy agents: N
```

## Notes

- Keep output grounded to concrete references (plan id, agent id/path, issue number).
- If filtering argument is provided, apply it first and state what was filtered.
