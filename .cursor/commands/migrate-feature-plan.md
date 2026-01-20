# Migrate Feature Plan v2.0.0

Convert existing v1.x TDD plans to v2.0.0 agent-per-file architecture.

## Invocation

```
/migrate-feature-plan [plan-name-or-path]
```

## What This Command Does

Converts old format:

```
[plan]/
├── plan.md              # YAML front matter per feature
├── parallelization.md   # Agent assignments, dependencies
├── speed_prompts.md     # Context summaries
└── README.md
```

To new format:

```
[plan]/
├── plan.md              # Verbose specs (cleaned up)
├── interfaces.md        # Extracted from YAML front matter
├── gotchas.md           # Extracted from features + new template
├── README.md            # Updated with new structure
└── agents/
    └── *.agent.md       # Distilled from plan + parallelization
```

## Migration Steps

### 1. Analyze Existing Plan

Read and parse:

- `plan.md` - Extract features, YAML front matter, Gherkin, TDD todos
- `parallelization.md` - Extract agent assignments, dependencies
- `files)`
- `README.md` - Note structure for update

Identify:

- Total features
- Agent assignments (from parallelization.md)
- Interface contracts (from YAML `exports`, `interfaces` fields)
- Known gotchas (from YAML `gotchas` fields)
- Dependencies (from YAML `dependencies`, `blocks` fields)

### 2. Create interfaces.md

Extract from each feature's YAML front matter:

````markdown
# Interface Contracts

## #1: [Feature Name]

**Agent**: [from parallelization] | **Status**: [from YAML] | **Used by**: [from blocks]

```typescript
// From YAML interfaces.exports
export function [name]([params]): [type];
```
````

---

## #2: [Feature Name]

...

````

### 3. Create gotchas.md

Extract from YAML `gotchas` fields + any inline gotchas:

```markdown
# Discovered Gotchas

---

## [Gotcha Name]

**Found**: [Date if known] | **Feature**: #[N]
**Affects**: [Feature list]

Issue: [Description]

Workaround:
```[code]```

---
````

### 4. Create agents/ Directory

For each agent identified in `parallelization.md`:

1. **Identify features** assigned to this agent
2. **Extract from plan.md**:
   - Feature TL;DR (from first line of Gherkin or create from scenario)
   - Interface contracts (exports + receives)
   - Files to create/modify
   - Test IDs
   - TDD todos (compress to one-liners)
   - Relevant gotchas
3. **Distill** into `agents/[name].agent.md`

**Target**: ~200-400 lines per agent file

### 5. Clean Up plan.md

Remove YAML front matter discovery patterns:

- Remove `feature_id:` search instructions
- Remove "search for feature_id" references
- Keep verbose Gherkin, detailed TDD, component design

The plan.md becomes pure planning reference, not agent discovery mechanism.

### 6. Update README.md

Replace old structure references:

```diff
- - [parallelization.md](./parallelization.md)
- - [speed_prompts.md](./speed_prompts.md)
+ - [interfaces.md](./interfaces.md)
+ - [gotchas.md](./gotchas.md)
+ - [agents/](./agents/)
```

Update status matrix if present.

### 7. Archive Old Files

Move to archive (don't delete immediately):

```bash
mkdir -p [plan]/archive_v1
mv [plan]/parallelization.md [plan]/archive_v1/
mv [plan]/speed_prompts.md [plan]/archive_v1/
```

Or delete if confident:

```bash
rm [plan]/parallelization.md
rm [plan]/speed_prompts.md
```

## Output

````markdown
## Migration Report: [plan-name]

### Files Created

| File                    | Lines | Source                                      |
| ----------------------- | ----- | ------------------------------------------- |
| interfaces.md           | ~150  | Extracted from plan.md YAML                 |
| gotchas.md              | ~50   | Extracted from plan.md YAML                 |
| agents/core.agent.md    | ~180  | Distilled from plan.md + parallelization.md |
| agents/columns.agent.md | ~220  | Distilled from plan.md + parallelization.md |

### Files Updated

| File      | Changes                             |
| --------- | ----------------------------------- |
| plan.md   | Removed YAML discovery instructions |
| README.md | Updated file references             |

### Files Archived

| File               | Location    |
| ------------------ | ----------- |
| parallelization.md | archive_v1/ |
| speed_prompts.md   | archive_v1/ |

### Verification

- [ ] interfaces.md has all exports from YAML
- [ ] gotchas.md has all known issues
- [ ] Each agent file < 400 lines
- [ ] All features assigned to an agent
- [ ] README.md references correct files

### Ready to Commit

```bash
git add [plan]/
git commit -m "migrate(plans): [plan-name] to v2.0.0 agent-per-file architecture"
```
````

````

## Distillation Rules

When creating agent files from verbose plan.md:

| plan.md (verbose) | agent.md (distilled) |
|-------------------|----------------------|
| Full YAML front matter | Just exports/receives in Interfaces section |
| Complete Gherkin (3+ scenarios) | One-line TL;DR |
| Detailed TDD with test code | `test name → impl → refactor` |
| Component design rationale | Just file paths |
| Full gotcha with context | `issue: workaround` |

### TL;DR Generation

If no TL;DR exists, generate from Gherkin:

```gherkin
Feature: Column Resize
  Scenario: Drag to resize
    Given a column with width 100px
    When I drag the resize handle 50px right
    Then the column width should be 150px
````

Becomes:

```
TL;DR: Dragging column resize handle changes column width with 50px minimum.
```

### TDD Compression

````markdown
# Verbose (plan.md)

- [ ] **RED**: Write failing test for `useColumnResize returns initial width`
  ```typescript
  test('returns initial width from context', () => {
    const { result } = renderHook(() => useColumnResize('col1'));
    expect(result.current.width).toBe(100);
  });
  ```
````

- [ ] **GREEN**: Implement hook reading from TableContext
- [ ] **REFACTOR**: Extract width lookup to helper function

````

Becomes:
```markdown
# Distilled (agent.md)
1. `returns initial width` → read from context → extract helper
````

## Edge Cases

### No parallelization.md

If plan has no parallelization.md:

1. Analyze feature dependencies from YAML
2. Group features logically (by area, by dependency chain)
3. Create reasonable agent assignments
4. Ask user to confirm before creating agent files

### No YAML Front Matter

If plan.md doesn't use YAML front matter:

1. Parse features from markdown headers
2. Infer interfaces from code blocks
3. Infer dependencies from prose
4. Create interfaces.md with best-effort extraction
5. Flag for user review

### Partial Migration

If some features are already complete (PASS status):

1. Still create agent files (for reference)
2. Mark features as PASS in agent file
3. Note in migration report

## Flags

```
/migrate-feature-plan [path] --dry-run       # Show what would be created
/migrate-feature-plan [path] --no-archive    # Delete old files instead of archiving
/migrate-feature-plan [path] --interactive   # Confirm each agent assignment
```

## Integration

After migration, use normal v2.0.0 commands:

- `update-feature-plan` - Modify plan, regenerate agents
- `close-feature-agent` - Verify completion, sync status
- `work` - Assess plan status, find next task
- `heal` - Auto-cleanup completed agents

## After Migration

After migration completes:

1. **Assess plan status**: Run `/work --plan <plan-name>` to see overall plan status, identify cleanup needs, and find the next best task
2. **Start work**: Use `/work` recommendations or `/run-agent --plan <plan-name>` to start work on the migrated plan
3. **Auto-cleanup if needed**: If cleanup is needed, run `/heal --plan <plan-name>` to auto-fix completed agents

The migrated plan is now ready for v2.0.0 workflow with agent-per-file execution.

## Commit Message

```
migrate(plans): [plan-name] to v2.0.0 agent-per-file architecture

- Created interfaces.md from YAML front matter exports
- Created gotchas.md from feature gotchas
- Created agents/*.agent.md (distilled execution context)
- Updated README.md with new structure
- Archived parallelization.md, speed_prompts.md
```
