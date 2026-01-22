# Create Feature Plan v2.1.0

Generate a TDD plan with verbose planning docs and minimal agent execution files using MCP planning tools.

## Invocation

```text
/create-feature-plan
```

## MCP Integration

This command uses MCP planning tools for document management:

- `mcp_runi_Planning_create_plan` - Create the plan structure
- `mcp_runi_Planning_create_doc` - Create planning documents (plan.md, interfaces.md, README.md, gotchas.md)
- `mcp_runi_Planning_list_docs` - List existing plans to determine next plan number
- `mcp_runi_Planning_read_doc` - Read existing documents for reference

## Skills Integration

When creating plans that involve Storybook stories or testing:

- **Automatically use `storybook-testing` skill** - For features that require Storybook stories, play functions, accessibility tests, or visual regression
- Reference story templates from `.storybook/templates/` when planning story creation
- Use testing utilities from `@/utils/storybook-test-helpers` in test specifications

## Workflow

### Phase 1: Gather Context

Ask user for:

- Project name and scope
- Work type: `refactor` | `overhaul` | `features`
- Tech stack and existing patterns
- Prototype/reference documents
- Known gotchas upfront
- **Storybook requirements** - If the plan involves Storybook stories, note this for skill activation

### Phase 2: Create Planning Docs (Verbose)

**Use MCP tools for document creation:**

1. **Determine next plan number** using `mcp_runi_Planning_list_docs`:
   - List all plans in `../runi-planning-docs/plans/`
   - Extract numeric prefixes from directory names
   - Find maximum plan number (handle both padded and unpadded formats)
   - Next plan number = max + 1

2. **Create plan structure** using `mcp_runi_Planning_create_plan`:
   - Plan name: `NNNN-descriptive-name` (zero-padded to 4 digits)
   - Description: Brief overview of the plan

3. **Create planning documents** using `mcp_runi_Planning_create_doc`:
   - Use template `none` for plan.md, interfaces.md, README.md
   - Use template `addendum` for gotchas.md (if template available)
   - Path format: `plans/NNNN-descriptive-name/filename.md`

**Plan Number Format**: Zero-padded to 4 digits (0001, 0002, ..., 0007, 0008, ...) for proper lexicographical ordering. Scripts support both padded and unpadded formats for backward compatibility.

**1. plan.md** - Full feature specifications

- Complete Gherkin scenarios (all paths)
- Detailed TDD cycles with test code
- Component design rationale
- Full gotcha descriptions
- **Storybook story specifications** - If features require Storybook stories, include story requirements, play function specifications, and accessibility test requirements
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
- Created using `mcp_runi_Planning_create_doc` with appropriate template

### Phase 3: Assign Features to Agents

Group features by:

- File ownership (minimize conflicts)
- Dependency chains (dependent features same agent when possible)
- Parallelism (maximize independent work)
- **Storybook story creation** - Features that create Storybook stories should be grouped together when possible

Each agent should have:

- 2-4 features (adjust based on complexity)
- Clear file ownership
- Minimal cross-agent dependencies
- **Skill activation** - If agent creates Storybook stories, note that `storybook-testing` skill should be used

### Phase 4: Distill Agent Files (Minimal)

**Critical step**: Distill, don't copy.

**Use MCP tools for agent file creation:**

- Create agent files using `mcp_runi_Planning_create_doc`
- Path format: `plans/NNNN-descriptive-name/agents/NNN_agent_descriptive-name.agent.md`
- Use template `none` (agent files are code, not documentation)

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
- **Storybook story requirements** - If agent creates stories, specify story types and templates to use
- **Skill references** - Note which skills to use (e.g., `storybook-testing` for Storybook stories)
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

```text
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
- [ ] Stories work (if applicable, use `storybook-testing` skill)
- [ ] Storybook stories follow templates and best practices (if applicable)
- [ ] Status → PASS

## Distillation Rules

| plan.md (verbose)        | agent.md (distilled)     |
| ------------------------ | ------------------------ |
| Full Gherkin scenario    | One-line TL;DR           |
| Detailed TDD with code   | `test → impl → refactor` |
| Component design table   | Just file paths          |
| Gotcha with full context | `issue: workaround`      |
| Interface with examples  | Just signatures          |

## Work Type Adjustments

### Refactor

- Emphasize: behavior preservation tests
- Agent files include: migration paths
- Extra in plan.md: before/after comparisons

### Overhaul

- Emphasize: rollback checkpoints
- Agent files include: rollback commit hashes
- Extra in plan.md: breaking changes, migration guide

### Feature Development

- Emphasize: integration points
- Agent files include: dependency status clearly marked
- Extra in plan.md: user stories, acceptance criteria
- **Storybook stories**: If features include Storybook stories, specify:
  - Story types needed (interaction, accessibility, visual)
  - Play function requirements
  - Testing utilities to use
  - Reference `storybook-testing` skill in agent files

## Validation Checklist

Before presenting plan:

- [ ] Each agent file < 500 lines
- [ ] No duplicate info across agent files
- [ ] Interfaces match (export = receive)
- [ ] Dependency graph complete
- [ ] All features assigned
- [ ] File ownership clear (no conflicts)
- [ ] Agent files use numeric prefixes (0*agent*, 1*agent*, etc.) - Number first for lexicographical ordering
- [ ] gotchas.md template ready

## Usage After Creation

**Assign work**:

```text
Copy: agents/columns.agent.md
Paste to Claude agent
Agent implements
```

**Optional: Assess initial status**:
After creating a plan, you can use `/work --plan <plan-number>` (e.g., `/work --plan 1`) to assess the initial plan status and see the first recommended task. This is optional but can help verify the plan structure is correct.

**Update plan**:

```text
/update-feature-plan [path]
```

**Check status**:
Review README.md status matrix

## MCP Tool Usage Examples

### Creating a Plan

```typescript
// 1. List existing plans to find next number
const plans = await mcp_runi_Planning_list_docs({ path: 'plans' });

// 2. Create plan structure
await mcp_runi_Planning_create_plan({
  name: '0008-storybook-testing-overhaul',
  description: 'Overhaul Storybook testing infrastructure with templates and utilities',
});

// 3. Create plan.md
await mcp_runi_Planning_create_doc({
  path: 'plans/0008-storybook-testing-overhaul/plan.md',
  content: '...', // Full verbose specs
  template: 'none',
});

// 4. Create interfaces.md
await mcp_runi_Planning_create_doc({
  path: 'plans/0008-storybook-testing-overhaul/interfaces.md',
  content: '...', // Contract definitions
  template: 'none',
});

// 5. Create README.md
await mcp_runi_Planning_create_doc({
  path: 'plans/0008-storybook-testing-overhaul/README.md',
  content: '...', // Index with dependency graph
  template: 'none',
});

// 6. Create gotchas.md
await mcp_runi_Planning_create_doc({
  path: 'plans/0008-storybook-testing-overhaul/gotchas.md',
  content: '...', // Empty template
  template: 'addendum', // or 'none' if addendum template not available
});

// 7. Create agent files
await mcp_runi_Planning_create_doc({
  path: 'plans/0008-storybook-testing-overhaul/agents/000_agent_infrastructure.agent.md',
  content: '...', // Distilled agent context
  template: 'none',
});
```

### Reading Existing Documents

```typescript
// Read existing plan for reference
const existingPlan = await mcp_runi_Planning_read_doc({
  path: 'plans/0005-storybook-testing-overhaul/plan.md',
});

// Read specific lines
const interfaces = await mcp_runi_Planning_read_doc({
  path: 'plans/0005-storybook-testing-overhaul/interfaces.md',
  lines: [1, 50], // Read lines 1-50
});
```

## Notes

- **MCP tools handle file operations** - No need to manually create directories or files
- **Templates available** - Use `addendum`, `research`, `example`, or `none` templates when creating docs
- **Path format** - Always use relative paths from planning docs root: `plans/NNNN-name/filename.md`
- **Storybook skill** - Automatically activated when features involve Storybook stories; reference templates and utilities in agent files
