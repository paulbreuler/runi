---
name: whats-next
description: Planning-aware task recommender (LIMPS + GitHub). Synthesizes plan state, agent health, and open issues into prioritized "what to work on next" recommendations.
argument-hint: '[plan-id | label | keyword]'
---

# What's Next — Planning-Aware Task Recommender (runi)

## Purpose

Read-only skill that synthesizes LIMPS plan state + GitHub Issues into prioritized recommendations. Answers "what should I work on next?" with grounded, cross-referenced context.

Use `$ARGUMENTS` as an optional filter (plan ID, label, or keyword). If no arguments, recommend across all plans and issues.

## Workflow

### Step 1: Gather LIMPS State

Use runi planning config:

```bash
limps plan list --config ../runi-planning-docs/.limps/config.json --json
```

For each plan that still has active work (not all agents complete):

```bash
limps plan next <plan-id> --config ../runi-planning-docs/.limps/config.json --json
limps health check <plan-id> --config ../runi-planning-docs/.limps/config.json --json
limps proposals <plan-id> --config ../runi-planning-docs/.limps/config.json --json
limps plan agents <plan-id> --config ../runi-planning-docs/.limps/config.json --json
```

### Step 2: Gather GitHub Issues

```bash
gh issue list --state open --limit 30 --json number,title,labels,createdAt,updatedAt,assignees,milestone
```

### Step 3: Read Agent Files for Context

For top-scored LIMPS task(s) from `plan next`:

- Read the agent `.md` file path from LIMPS output
- Extract: features list, `files[]`, `depends_on`, status per feature
- Note phase and blockers

### Step 4: Cross-Reference

Categorize everything:

| Category              | Criteria                                                      |
| --------------------- | ------------------------------------------------------------- |
| **Ready to execute**  | LIMPS agent with score > 0, no unresolved blockers            |
| **Needs promotion**   | Agent file references work not yet tracked in GitHub Issues   |
| **Standalone issues** | GitHub Issues not linked to any LIMPS plan (bugs, follow-ups) |
| **Needs triage**      | Stale or unhealthy LIMPS items flagged by health check        |
| **Parked**            | Plans where all agents are blocked or GAP status              |

Cross-referencing rules:

- Agent files mentioning `#NNN` or issue numbers are "linked"
- Agent files with no corresponding GitHub Issue are "needs promotion"
- GitHub Issues with no plan reference are "standalone"

### Step 5: Estimate PR Scope

For each ready-to-execute item:

- Count `files[]` in the agent file
- Heuristic: ~20-30 lines per file touched (new files higher, modifications lower)
- Classify size and recommend splitting strategy if needed

| Size   | Lines    | Recommendation                  |
| ------ | -------- | ------------------------------- |
| Small  | <200     | Ship as single PR               |
| Medium | 200-400  | Optimal — ship as-is            |
| Large  | 400-1000 | Consider splitting by feature   |
| XL     | >1000    | Must split into per-feature PRs |

### Step 6: Output Recommendation

Format output as:

```markdown
## What's Next

### Ready to Execute

1. **Plan NNNN -> Agent NNN: <title>** (score: NN/100)
   - Features: F1-FN (N TDD cycles)
   - Files: N | Est. PR size: ~NNN lines (Size)
   - Phase: X (<phase name>)
   - GitHub: #NNN (linked) | No issue yet -> run `/create-issue` to promote

### Standalone Issues (bugs, follow-ups)

N. **#NNN**: <title> — ~NNN lines (Size)

### Needs Triage

- **Plan NNNN / Agent NNN**: <staleness or health warning>

### Parked (blocked or future)

- **Plan NNNN: <title>** — <reason parked>

### Health Summary

- Staleness warnings: N
- Pending proposals: N
- Unhealthy agents: N

## PR Size Guide

Small (<200 LOC) | Medium (200-400) | Large (400-1000, split recommended) | XL (>1000, must split)
```

## Rules

- **Read-only**: Never modify plans, issues, or code
- **GitHub Issues only**: No external trackers
- **CLI direct**: Call `limps` and `gh` directly
- **No auto-creation**: Recommend actions; user decides
- **Grounded**: Every recommendation cites a plan ID, agent file, or issue number
- If LIMPS commands fail (not installed, config missing), fall back to GitHub Issues only and note limitation
- If `gh` fails (not authenticated/network blocked), fall back to LIMPS only and note limitation

## Notes

- Use `Bash` for CLI commands, `Read` for agent files
- Prefer `--json` output from both `limps` and `gh` for parsing
- When `$ARGUMENTS` specifies a plan ID, focus recommendations on that plan
- Sort ready-to-execute items by LIMPS score (highest first)
- For standalone issues, sort by recency (newest first)
