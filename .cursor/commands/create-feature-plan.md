# Create Feature Plan v2.1.0

Generate a TDD plan with verbose planning docs and minimal agent execution files using MCP planning tools.

## LLM Execution Rules

- Use MCP planning tools for all reads/writes; do not write files directly.
- Do not include secrets, tokens, or credentials in plan content.
- Keep agent files distilled and ≤ 500 lines.
- Only run `rlm_query`/`rlm_multi_query` with code you authored or reviewed.

## Invocation

```text
/create-feature-plan
```

## MCP Integration

This command uses MCP planning tools for document management:

- **Server**: Use the limps planning MCP server registered in `.cursor/mcp.json`
  - Example in this repo: `project-0-runi-limps-planning-runi-planning-docs`
  - Always resolve the server name from the MCP registry before calling tools
- **Tools**:
  - `create_plan` - Create the plan structure
  - `create_doc` - Create planning documents (plan.md, interfaces.md, README.md, gotchas.md)
  - `list_docs` - List existing plans to determine next plan number
  - `read_doc` - Read existing documents for reference
  - `rlm_query` - Query single documents with JavaScript (extract features, analyze structure)
  - `rlm_multi_query` - Query multiple documents with JavaScript (analyze patterns across plans)

**Usage**: Call tools via `call_mcp_tool` with the resolved server name (see above) and the tool name (e.g., `create_plan`, `create_doc`, etc.)

## Skills Integration

When creating plans that involve Storybook stories or testing:

- **Automatically use `storybook-testing` skill** - For features that require Storybook stories, play functions, accessibility tests, or visual regression
- **Controls-first approach is mandatory** - Use Storybook 10 controls for state variations instead of creating separate stories for every prop combination
- **Limit to 1-3 stories per component** - One Playground story with controls covers most cases (we consolidated from 500+ stories to 50-75 by using controls)
- **Separate stories only for** - Complex interactions that need dedicated play functions, real-world examples, or documentation purposes
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

1. **Determine next plan number** using `list_docs` (server: `mcp-planning-server`):
   - List all plans in `../runi-planning-docs/plans/`
   - Extract numeric prefixes from directory names
   - Find maximum plan number (handle both padded and unpadded formats)
   - Next plan number = max + 1

2. **Create plan structure** using `create_plan` (server: `mcp-planning-server`):
   - Plan name: `NNNN-descriptive-name` (zero-padded to 4 digits)
   - Description: Brief overview of the plan

3. **Create planning documents** using `create_doc` (server: `mcp-planning-server`):
   - Use template `none` for plan.md, interfaces.md, README.md
   - Use template `addendum` for gotchas.md (if template available)
   - Path format: `plans/NNNN-descriptive-name/filename.md`

**Plan Number Format**: Zero-padded to 4 digits (0001, 0002, ..., 0007, 0008, ...) for proper lexicographical ordering. Scripts support both padded and unpadded formats for backward compatibility.

**1. plan.md** - Full feature specifications

- Complete Gherkin scenarios (all paths)
- Detailed TDD cycles with test code
- Component design rationale
- Full gotcha descriptions
- **Storybook story specifications** - If features require Storybook stories, follow controls-first approach:
  - Plan for 1-3 stories per component maximum (use controls for state variations, not separate stories)
  - One Playground story with controls covers most cases
  - Separate stories only for: complex interactions, real-world examples, documentation
  - Include play function specifications and accessibility test requirements
  - Reference consolidation metrics: 500+ stories → 50-75 stories (85% reduction) while maintaining full test coverage
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
  - Created using `create_doc` (server: `mcp-planning-server`) with appropriate template

### Phase 3: Assign Features to Agents

Group features by:

- File ownership (minimize conflicts)
- Dependency chains (dependent features same agent when possible)
- Parallelism (maximize independent work)
- **Storybook story creation** - Features that create Storybook stories should be grouped together when possible. Note that controls-first approach means most components need only 1 Playground story with controls, not multiple stories for different prop combinations

Each agent should have:

- 2-4 features (adjust based on complexity)
- Clear file ownership
- Minimal cross-agent dependencies
- **Skill activation** - If agent creates Storybook stories, note that `storybook-testing` skill should be used

### Phase 4: Distill Agent Files (Minimal)

**Critical step**: Distill, don't copy.

**Use MCP tools for agent file creation:**

- Create agent files using `create_doc` (server: `mcp-planning-server`)
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
- Numeric prefixes make execution order clear to humans, even though `npx limps next-task` uses scoring algorithm
- This helps when manually selecting agents or understanding plan structure

**Note**: Scripts support both padded (000, 001) and unpadded (0, 1) formats for backward compatibility, but new agents should use zero-padding.

**GitHub Issue Integration**:

- Issues are created automatically when agents start (via `/run-agent` command)
- **Agent Issue (parent)**: Represents the agent work, includes reference to local agent file
- **Feature Subissues (children)**: One subissue per feature, created using `gh sub-issue` extension, linked to agent issue as parent
- **Agent files store issue numbers**:
  - `**GitHub Issue**: #123` at top (agent issue - parent)
  - `**GitHub Subissue**: #124` in each feature section (feature subissue - child)
- **Relationship**:
  - Local agent files are the source of truth
  - Agent issue is parent, feature subissues are children
  - Features reference their subissues (not random PRs)
- **PRs link to feature subissues**: Use `Closes #124, #125, #126` for feature subissues in PR description
- **Critical**: `Closes #XXX` only works when PR targets the repository's default branch (main/master)
- GitHub automatically closes feature subissues when PR with `Closes #124, #125, #126` merges to default branch
- Agent issue (parent) is not closed by PR - only feature subissues are closed
- If agent doesn't have issues when PR is created, issues are created retroactively by `/pr` command
- See plan documentation for full workflow details

**Extract only**:

- Feature IDs + one-line TL;DRs
- Interface contracts (exports + receives)
- Files to create/modify
- Test IDs
- TDD cycles as one-liners: `test name → impl → refactor note`
- Relevant gotchas (brief)
- **Storybook story requirements** - If agent creates stories, follow controls-first approach:
  - Specify 1-3 stories per component maximum (use controls for variations)
  - One Playground story with controls covers most cases
  - Separate stories only for complex interactions, real-world examples, or documentation
  - Specify story types and templates to use
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

**Plan Location**: `../runi-planning-docs/plans/[plan-name]/plan.md`
**GitHub Issue**: #123 (agent issue - parent, created when agent started)

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

**GitHub Subissue**: #124 (feature subissue - child of agent issue, created when agent started)
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
- **Storybook stories**: If features include Storybook stories, follow controls-first approach:
  - **Limit to 1-3 stories per component** - Use controls for state variations, not separate stories
  - **One Playground story with controls** covers most cases
  - **Separate stories only for**: Complex interactions, real-world examples, documentation
  - Story types needed (interaction, accessibility, visual)
  - Play function requirements
  - Testing utilities to use
  - Reference `storybook-testing` skill in agent files (contains full controls-first guidance)
  - **Anti-pattern**: Don't plan 6-8 stories per component for different prop combinations - use controls instead

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
After creating a plan, you can use `npx limps next-task <plan-number>` (e.g., `npx limps next-task 1`) to see the first recommended task. This is optional but can help verify the plan structure is correct.

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
const plans = await call_mcp_tool({
  server: '<planning-mcp-server>',
  toolName: 'list_docs',
  arguments: { path: 'plans' },
});

// 2. Create plan structure
await call_mcp_tool({
  server: '<planning-mcp-server>',
  toolName: 'create_plan',
  arguments: {
    name: '0008-storybook-testing-overhaul',
    description: 'Overhaul Storybook testing infrastructure with templates and utilities',
  },
});

// 3. Create plan.md
await call_mcp_tool({
  server: '<planning-mcp-server>',
  toolName: 'create_doc',
  arguments: {
    path: 'plans/0008-storybook-testing-overhaul/plan.md',
    content: '...', // Full verbose specs
    template: 'none',
  },
});

// 4. Create interfaces.md
await call_mcp_tool({
  server: '<planning-mcp-server>',
  toolName: 'create_doc',
  arguments: {
    path: 'plans/0008-storybook-testing-overhaul/interfaces.md',
    content: '...', // Contract definitions
    template: 'none',
  },
});

// 5. Create README.md
await call_mcp_tool({
  server: '<planning-mcp-server>',
  toolName: 'create_doc',
  arguments: {
    path: 'plans/0008-storybook-testing-overhaul/README.md',
    content: '...', // Index with dependency graph
    template: 'none',
  },
});

// 6. Create gotchas.md
await call_mcp_tool({
  server: '<planning-mcp-server>',
  toolName: 'create_doc',
  arguments: {
    path: 'plans/0008-storybook-testing-overhaul/gotchas.md',
    content: '...', // Empty template
    template: 'addendum', // or 'none' if addendum template not available
  },
});

// 7. Create agent files
await call_mcp_tool({
  server: '<planning-mcp-server>',
  toolName: 'create_doc',
  arguments: {
    path: 'plans/0008-storybook-testing-overhaul/agents/000_agent_infrastructure.agent.md',
    content: '...', // Distilled agent context
    template: 'none',
  },
});
```

### Reading Existing Documents

```typescript
// Read existing plan for reference
const existingPlan = await call_mcp_tool({
  server: '<planning-mcp-server>',
  toolName: 'read_doc',
  arguments: {
    path: 'plans/0005-storybook-testing-overhaul/plan.md',
  },
});

// Read specific lines
const interfaces = await call_mcp_tool({
  server: '<planning-mcp-server>',
  toolName: 'read_doc',
  arguments: {
    path: 'plans/0005-storybook-testing-overhaul/interfaces.md',
    lines: [1, 50], // Read lines 1-50
  },
});
```

### Querying Documents with RLM Tools

```typescript
// Extract all GAP features from a plan
const gapFeatures = await rlm_query({
  path: 'plans/0008-storybook-testing-overhaul/plan.md',
  code: `
    const features = extractFeatures(doc.content);
    return features.filter(f => f.status === 'GAP');
  `,
});

// Analyze feature distribution across all plans
const planSummary = await rlm_multi_query({
  pattern: 'plans/*/plan.md',
  code: `
    return docs.map(doc => {
      const features = extractFeatures(doc.content);
      return {
        plan: extractFrontmatter(doc.content).meta.name,
        total: features.length,
        gap: features.filter(f => f.status === 'GAP').length,
        wip: features.filter(f => f.status === 'WIP').length,
        pass: features.filter(f => f.status === 'PASS').length
      };
    });
  `,
});
```

## Notes

- **MCP tools handle file operations** - No need to manually create directories or files
- **Templates available** - Use `addendum`, `research`, `example`, or `none` templates when creating docs
- **Path format** - Always use relative paths from planning docs root: `plans/NNNN-name/filename.md`
- **Storybook skill** - Automatically activated when features involve Storybook stories; reference templates and utilities in agent files. **Critical**: Follow controls-first approach (1-3 stories per component, use controls for variations) - see `storybook-testing` skill for full guidance
