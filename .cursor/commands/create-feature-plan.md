# Create Feature Plan v2.0.0

Generate a TDD plan with verbose planning docs and minimal agent execution files.

## Invocation

```
/create-feature-plan
```

## Workflow

### Phase 1: Gather Context

Ask user for:

- Project name and scope
- Work type: `refactor` | `overhaul` | `features`
- Tech stack and existing patterns
- Prototype/reference documents
- Known gotchas upfront

### Phase 2: Create Planning Docs (Verbose)

Create directory: `../runi-planning-docs/plans/NNNN-descriptive-name/` where NNNN is the next available plan number (zero-padded to 4 digits) and descriptive-name is a kebab-case version of the plan name.

**To determine next plan number:**

1. List all directories in `../runi-planning-docs/plans/` matching pattern `[0-9]+-*`
2. Extract the numeric prefix from each directory name (handle both padded and unpadded formats)
3. Find the maximum plan number (treat "0007" and "7" as the same number)
4. Next plan number = max + 1
5. Create directory as `NNNN-descriptive-name` with zero-padding to 4 digits (e.g., if max is 7 and plan is "DataGrid Overhaul", create `0008-datagrid-overhaul`)
6. The directory name itself is the source of truth - no registry needed

**Plan Number Format**: Zero-padded to 4 digits (0001, 0002, ..., 0007, 0008, ...) for proper lexicographical ordering. Scripts support both padded and unpadded formats for backward compatibility.

**1. plan.md** - Full feature specifications

- Complete Gherkin scenarios (all paths)
- Detailed TDD cycles with test code
- Component design rationale
- Full gotcha descriptions
- This is the source material

**2. interfaces.md** - Contract source of truth

- Full TypeScript signatures
- Usage examples
- Constraints and invariants
- Cross-reference which features use what

**3. README.md** - Index

- Mermaid dependency graph
- Status matrix (all features)
- Agent assignments
- File links

**4. gotchas.md** - Empty, ready for discoveries

- Template with format

### Phase 3: Assign Features to Agents

Group features by:

- File ownership (minimize conflicts)
- Dependency chains (dependent features same agent when possible)
- Parallelism (maximize independent work)

Each agent should have:

- 2-4 features (adjust based on complexity)
- Clear file ownership
- Minimal cross-agent dependencies

### Phase 4: Distill Agent Files (Minimal)

**Critical step**: Distill, don't copy.

For each agent, create `agents/<NNN>_agent_<descriptive-name>.agent.md` where NNN is sequential starting from 000 (zero-padded to 3 digits):

**Agent File Naming Pattern**:

- Format: `<NNN>_agent_<descriptive-name>.agent.md` (zero-padded to 3 digits)
- NNN starts at 000 and increments sequentially based on dependency order
- Examples:
  - `000_agent_infrastructure.agent.md` (no dependencies, runs first)
  - `001_agent_testing_utilities.agent.md` (depends on infrastructure)
  - `002_agent_ui_components.agent.md` (depends on testing utilities)
  - `010_agent_selection_sorting.agent.md` (10th agent)

**Rationale**:

- Zero-padding ensures proper lexicographical ordering (000, 001, 002, ... 010, 011, ... 017)
- Numeric prefixes make execution order clear to humans, even though `next-task.sh` uses scoring algorithm
- This helps when manually selecting agents or understanding plan structure

**Note**: Scripts support both padded (000, 001) and unpadded (0, 1) formats for backward compatibility, but new agents should use zero-padding.

**Extract only**:

- Feature IDs + one-line TL;DRs
- Interface contracts (exports + receives)
- Files to create/modify
- Test IDs
- TDD cycles as one-liners: `test name → impl → refactor note`
- Relevant gotchas (brief)
- Done checklist

**Leave out**:

- Full Gherkin (TL;DR sufficient)
- Detailed test code (agent writes fresh)
- Verbose explanations
- Methodology (agent knows TDD)
- Other agents' details

**Target**: ~200-400 lines per agent file

### Phase 5: Validate

- [ ] Agent files are self-contained (no required searching)
- [ ] Interface contracts match between agents
- [ ] Dependency graph is accurate
- [ ] File ownership has no conflicts
- [ ] Each agent file < 500 lines

## Output Structure

```
NNNN-descriptive-name/
├── README.md              # Index, graph, status
├── plan.md                # Full specs (verbose, ~1000+ lines OK)
├── interfaces.md          # Contracts (~200-500 lines)
├── gotchas.md             # Empty template
└── agents/
    ├── 000_agent_infrastructure.agent.md      # ~200-400 lines
    ├── 001_agent_testing_utilities.agent.md  # ~200-400 lines
    └── 002_agent_ui_components.agent.md      # ~200-400 lines
```

## Agent File Format

**File naming**: `<NNN>_agent_<descriptive-name>.agent.md` (e.g., `000_agent_infrastructure.agent.md`) - Zero-padded to 3 digits for proper lexicographical ordering

**File header**: The agent header in the file should still be descriptive:

````markdown
# Agent <N>: [Descriptive Name]

## Scope

Features: #X, #Y, #Z
Own: `src/[path]/*`
Depend on: Agent [N] for #A, #B
Block: Agent [M] waiting on #Y

## Interfaces

### Export

```typescript
// #X
export fn(): Type;
// #Y
export Component: FC<Props>;
```
````

### Receive

```typescript
// #A (Agent N) ✅ READY
// shape: { ... }
```

## Features

### #X: [Name]

TL;DR: [One sentence]
Status: `GAP`
Test IDs: `x-element-id`
Files: `path/file.ts` (create)

TDD:

1. `test name` → impl → refactor
2. `test name` → impl → refactor

Gotchas:

- [brief issue]: [brief workaround]

---

### #Y: [Name]

[Same minimal structure]

---

## Done

- [ ] TDD cycles pass
- [ ] Exports match interface
- [ ] Test IDs implemented
- [ ] Stories work
- [ ] Status → PASS

```

## Distillation Rules

| plan.md (verbose) | agent.md (distilled) |
|-------------------|----------------------|
| Full Gherkin scenario | One-line TL;DR |
| Detailed TDD with code | `test → impl → refactor` |
| Component design table | Just file paths |
| Gotcha with full context | `issue: workaround` |
| Interface with examples | Just signatures |

## Work Type Adjustments

### Refactor
- Emphasize: behavior preservation tests
- Agent files include: migration paths
- Extra in plan.md: before/after comparisons

### Overhaul
- Emphasize: rollback checkpoints
- Agent files include: rollback commit hashes
- Extra in plan.md: breaking changes, migration guide

### Features
- Emphasize: integration points
- Agent files include: dependency status clearly marked
- Extra in plan.md: user stories, acceptance criteria

## Validation Checklist

Before presenting plan:

- [ ] Each agent file < 500 lines
- [ ] No duplicate info across agent files
- [ ] Interfaces match (export = receive)
- [ ] Dependency graph complete
- [ ] All features assigned
- [ ] File ownership clear (no conflicts)
- [ ] Agent files use numeric prefixes (0_agent_, 1_agent_, etc.) - Number first for lexicographical ordering
- [ ] gotchas.md template ready

## Usage After Creation

**Assign work**:
```

Copy: agents/columns.agent.md
Paste to Claude agent
Agent implements

```

**Optional: Assess initial status**:
After creating a plan, you can use `/work --plan <plan-number>` (e.g., `/work --plan 1`) to assess the initial plan status and see the first recommended task. This is optional but can help verify the plan structure is correct.

```

**Update plan**:

```

/update-feature-plan [path]

```

**Check status**:
Review README.md status matrix

```

```
