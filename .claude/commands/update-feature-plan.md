# Update Feature Plan v2.0.0

Apply feedback to an existing plan, regenerate affected agent files, and commit after approval.

## LLM Execution Rules

- Use MCP planning tools for all reads/writes; do not edit files directly.
- Preserve existing GitHub issue numbers in agent files.
- Do not include secrets or tokens in plan documents.
- Only run `process_doc` / `process_docs` with code you authored or reviewed.
- Resolve the MCP server name from `.mcp.json` (repo root) before calling tools.

## Key Change from v1.x

**Old**: Update plan.md + speed_prompts.md (summaries)
**New**: Update {plan-name}-plan.md + regenerate affected `agents/*.agent.md` (distilled execution files)

Agent files are **distilled**, not copied. When plan changes, affected agent files must be regenerated.

## Invocation

```
/update-feature-plan [plan-name-or-path]
```

## Workflow

```
1. Identify plan
2. Gather feedback
3. Read current state
4. Analyze & propose changes
5. User approves
6. Apply to {plan-name}-plan.md, interfaces.md
7. Identify affected agents
8. Regenerate affected agent files (distill, don't copy)
9. Verify consistency
10. Commit
11. Assess status: MCP `get_next_task` or `npx limps next-task <plan-name>` (optional, see next task)
```

## After Update

After updating a plan and regenerating agent files:

1. **Assess plan status**: Use MCP `get_plan_status` or `npx limps status <plan-name>` to see overall plan status and identify cleanup needs
2. **Auto-cleanup if needed**: If cleanup is needed, run `/heal --plan <plan-name>` to auto-fix completed agents
3. **Start next work**: Use MCP `get_next_task` or `npx limps next-task <plan-name>` to get the next task, then open the agent file with `cursor`

This helps ensure the plan is in a good state after updates and ready for continued work.

## Instructions

### 1. Identify the Plan

- Ask: "Which plan to update?"
- If unsure: use MCP `list_plans` or `npx limps list-plans`
- Confirm plan directory exists

### 2. Gather Feedback

Accept feedback via:

- Paste directly
- File path: `@feedback.md`
- Description: "Add accessibility to #3"

Parse feedback for:

- Feature changes (add/remove/modify)
- Interface changes (affects downstream agents)
- Status updates
- Gotcha discoveries
- Dependency changes
- Test coverage gaps

### 3. Read Current State

```
[plan-name]/
├── README.md
├── {plan-name}-plan.md  # Full verbose specs
├── interfaces.md        # Contract source of truth
├── gotchas.md
└── agents/
    └── *.agent.md       # Minimal execution files
```

Read all files to understand current state. Use `process_doc` (server: `runi-Planning`) for reading plan files with extraction capabilities.

### 4. Analyze & Propose Changes

For each feedback item, classify:

| Type                    | Action                            |
| ----------------------- | --------------------------------- |
| **Actionable**          | Propose specific change with diff |
| **Needs Clarification** | Ask user                          |
| **Out of Scope**        | Note and skip                     |

**Critical**: Identify interface changes—these cascade to dependent agents.

### 5. Present Proposed Changes

````markdown
## Proposed Changes: [plan-name]

### {plan-name}-plan.md

**Change**: Add Feature #7 Accessibility
**Diff**:

```diff
+ ### #7: Accessibility
+ [full verbose spec...]
```
````

### interfaces.md

**Change**: Add #7 exports
**Diff**:

```diff
+ ## #7: Accessibility
+ export function useAriaLabels(): AriaState;
```

### Affected Agents

| Agent            | Why                            | Action     |
| ---------------- | ------------------------------ | ---------- |
| columns.agent.md | #7 added to scope              | Regenerate |
| rows.agent.md    | Depends on #3 interface change | Regenerate |

**Ready to apply?** (yes/no)

````

### 6. Apply Changes (After Approval)

**Planning docs** (verbose):
- Update `{plan-name}-plan.md` with full feature specs using `update_doc` (server: `runi-Planning`)
- Update `interfaces.md` if contracts change using `update_doc`
- Update `README.md` status matrix using `update_doc`
- Append to `gotchas.md` if new issues using `update_doc`

**Agent files** (distilled):
- **Regenerate** affected agent files using `create_doc` or `update_doc` (server: `runi-Planning`), don't patch
- Distill from updated {plan-name}-plan.md
- Use scoped cross-file references (exact file + section/heading) for details that must live elsewhere

### 7. Identify Affected Agents

An agent file needs regeneration if:

| Change | Affected Agents |
|--------|-----------------|
| Feature added to agent's scope | That agent |
| Feature removed from agent's scope | That agent |
| Feature modified in agent's scope | That agent |
| Interface changed | All agents that depend on it |
| Dependency changed | Agents with that dependency |
| Gotcha discovered | Agents working on affected features |

### 8. Regenerate Agent Files

**Distill, don't copy**. Agent files contain:

| Include | Exclude |
|---------|---------|
| Feature IDs + TL;DRs | Full Gherkin |
| Interface contracts | Detailed test code |
| Files to create/modify | Methodology explanations |
| Test IDs | Other agents' details |
| TDD one-liners | Historical context |
| Relevant gotchas | |
| Done checklist | |
| **GitHub Issue number** (agent issue) | (preserve from existing file) |
| **GitHub Subissue numbers** (feature subissues) | (preserve from existing file per feature) |

**Critical**: When regenerating agent files, **preserve the GitHub issue numbers** from the existing agent file:
- Extract agent issue number from existing file: `**GitHub Issue**: #123` (parent)
- Extract feature subissue numbers from existing file: `**GitHub Subissue**: #124` in each feature section (children)
- Include in regenerated file metadata
- **Do not create new issues** when regenerating (keep existing agent issue and feature subissues)
- If no issues exist in old file, leave issue number fields empty (will be created by `/run-agent` or `/pr-create`)


### 9. Verify Consistency

- [ ] All features in {plan-name}-plan.md have an assigned agent
- [ ] All agent files reflect current {plan-name}-plan.md
- [ ] interfaces.md matches agent exports/receives
- [ ] README.md status matrix is current
- [ ] Dependency graph is accurate
- [ ] No orphaned features
- [ ] GitHub issue numbers preserved in regenerated agent files (if they existed)

### 10. Commit (After Final Approval)

```bash
cd ../runi-planning-docs
git add plans/[plan-name]/
git commit -m "update(plans): [plan-name] - [description]"
````

## Common Scenarios

### Adding a Feature

1. Add to `{plan-name}-plan.md` (verbose spec)
2. Add to `interfaces.md` if it exports anything
3. Assign to an agent
4. Regenerate that agent's file
5. Update README.md status matrix

### Modifying a Feature

1. Update in `{plan-name}-plan.md`
2. Update `interfaces.md` if exports changed
3. Regenerate owning agent's file
4. If interface changed: regenerate dependent agents

### Interface Change (Cascading)

Most impactful change—affects downstream agents.

1. Update `interfaces.md` (source of truth)
2. Update `{plan-name}-plan.md` feature spec
3. Identify all agents that receive this interface
4. Regenerate ALL affected agent files
5. Mark downstream features as potentially BLOCKED if breaking

Example:

```markdown
## Interface Change: #2 Headers

**Change**: `useColumnHeader` now returns `isResizing: boolean`

**Affected Agents**:
| Agent | Features | Reason |
|-------|----------|--------|
| columns | #2 | Owns the interface |
| rows | #5 | Receives from #2 |
| integration | #8 | Receives from #2 |

**Action**: Regenerate all 3 agent files
```

### Status Update

1. Update feature status in `{plan-name}-plan.md`
2. Update README.md status matrix
3. **Don't regenerate agent files** (status is in agent's own file)

### Dependency Change

1. Update `{plan-name}-plan.md` feature dependencies
2. Update `parallelization.md` if exists
3. Regenerate affected agent files
4. Update README.md graph

### Gotcha Discovered

1. Append to `gotchas.md`
2. Add to affected features in `{plan-name}-plan.md`
3. Regenerate agent files that need to know

## Plan Analysis with MCP Tools

Use `process_doc` (server: `runi-Planning`) to analyze plans before and after updates:

```typescript
// Find all features affected by an interface change (preferred: process_doc)
const affectedFeatures = await call_mcp_tool({
  server: 'runi-Planning',
  toolName: 'process_doc',
  arguments: {
    path: 'plans/[plan-name]/[plan-name]-plan.md',
    code: `
      const features = extractFeatures(doc.content);
      const interface = extractInterfaces(doc.content).find(i => i.name === 'useColumnHeader');
      return features.filter(f => f.dependsOn?.includes(interface.id));
    `,
  },
});

// Compare feature status before/after update
const statusDiff = await call_mcp_tool({
  server: 'runi-Planning',
  toolName: 'process_doc',
  arguments: {
    path: 'plans/[plan-name]/[plan-name]-plan.md',
    code: `
      const features = extractFeatures(doc.content);
      return {
        gap: features.filter(f => f.status === 'GAP').length,
        wip: features.filter(f => f.status === 'WIP').length,
        pass: features.filter(f => f.status === 'PASS').length
      };
    `,
  },
});
```

## Change Proposal Format

````markdown
## Proposed Changes: datagrid_overhaul_abc123

### Summary

| File                    | Changes               | Lines |
| ----------------------- | --------------------- | ----- |
| {plan-name}-plan.md     | +1 feature, ~50 lines | +50   |
| interfaces.md           | +1 interface          | +15   |
| agents/columns.agent.md | Regenerate            | ~220  |
| README.md               | Status update         | +1    |

### Details

#### {plan-name}-plan.md

**Add Feature #7: Accessibility**

```diff
+ ### #7: Accessibility
+
+ **Area**: CORE
+ **Agent**: Columns
+ ...
```
````

#### interfaces.md

**Add #7 exports**

````diff
+ ## #7: Accessibility
+
+ **Agent**: Columns | **Status**: GAP | **Used by**: none
+
+ ```typescript
+ export function useAriaLabels(id: string): AriaState;
+ ```
````

#### agents/columns.agent.md

**Regenerate** (feature added to scope)

- Current: 180 lines, features #2, #3, #4
- New: ~220 lines, features #2, #3, #4, #7

### Affected Agents

| Agent            | Regenerate? | Reason     |
| ---------------- | ----------- | ---------- |
| columns.agent.md | ✅ Yes      | #7 added   |
| rows.agent.md    | ❌ No       | No changes |
| core.agent.md    | ❌ No       | No changes |

---

**Ready to apply?** (yes/no)

```

## Flags

```

/update-feature-plan [path] --dry-run # Show changes, don't apply
/update-feature-plan [path] --force # Skip approval prompts
/update-feature-plan [path] --agents-only # Only regenerate agent files

```

## Integration with Other Commands

| Command | Purpose | When |
|---------|---------|------|
| `create-feature-plan` | Create new plan | Starting work |
| **`update-feature-plan`** | Modify plan, regenerate agents | Mid-flight changes |
| `close-feature-agent` | Verify completion, sync status | Agent finishes |
| `work` | Assess status, find next task | After update, after PR merge |
| `heal` | Auto-cleanup completed agents | When cleanup needed |

Typical flow:
```

create-feature-plan
↓
[agent implements]
↓
close-feature-agent (verify, sync status)
↓
update-feature-plan (if interfaces evolved) ←── YOU ARE HERE
↓
[regenerated agent files ready]
↓
work (assess status, find next task)
↓
[next agent implements]

```

## Notes

- **Distill, don't copy**: Agent files are refined extracts, not copies
- **Interface changes cascade**: Always identify dependent agents
- **Regenerate, don't patch**: Cleaner than surgical edits
- **Verify consistency**: All files must agree
- **Use MCP tools**: Use `process_doc`, `update_doc`, `create_doc` for all document operations (server: `runi-Planning`)
- **Plan file naming**: Use `{plan-name}-plan.md` format (e.g., `0008-storybook-testing-overhaul-plan.md`)
- **Commit after approval**: Changes go to runi-planning-docs repo (git operations use file paths, but document reading should use MCP tools)
```
