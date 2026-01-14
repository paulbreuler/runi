# Ralph File Healing Template

Template for creating healing prompts. Use with `/heal-ralph` in Cursor or `just heal-ralph --prompt-file`.

## Template Structure

```markdown
# Healing Request: [Brief Description]

## Objective
[What needs to be fixed or improved?]

## Context
[Why is this change needed? What problem does it solve?]

## Scope
[Which files should be affected?]
- [ ] @fix_plan.md
- [ ] specs/requirements.md
- [ ] PROMPT.md
- [ ] CLAUDE.md
- [ ] prompts/README.md
- [ ] prompts/PROMPT-*.md

## Specific Changes Needed

### Change 1: [Description]
- **File:** path/to/file.md
- **Current:** [what exists now]
- **Desired:** [what it should be]
- **Rationale:** [why this change is needed]

### Change 2: [Description]
- **File:** path/to/file.md
- **Current:** [what exists now]
- **Desired:** [what it should be]
- **Rationale:** [why this change is needed]

## Consistency Requirements
[What consistency rules should be maintained?]

## Validation
[How to verify the changes are correct?]
```

## Example: Fix Layout References

```markdown
# Healing Request: Update Layout to VS Code Style

## Objective
Update all layout references from vertical split (top/bottom) to horizontal split (left/right) matching VS Code/Cursor style.

## Context
The layout was changed to match VS Code's editor split view for better developer familiarity, but some files still reference the old vertical split.

## Scope
- [x] @fix_plan.md
- [x] specs/requirements.md
- [x] prompts/PROMPT-*.md

## Specific Changes Needed

### Change 1: Update Layout Description
- **File:** @fix_plan.md
- **Current:** "vertical split pane (40/60 default)"
- **Desired:** "horizontal split pane (50/50 default) - Request (left) | Response (right)"
- **Rationale:** Matches VS Code editor split view pattern

### Change 2: Update Wireframe
- **File:** specs/requirements.md
- **Current:** Request top, Response bottom
- **Desired:** Request left, Response right (side-by-side)
- **Rationale:** Visual consistency with VS Code layout

## Consistency Requirements
- All files must use "horizontal split" terminology
- All files must use "left/right" not "top/bottom"
- Default split should be 50/50, not 40/60

## Validation
Run `just validate-ralph` to verify consistency.
```

## Usage

1. Copy this template: `cp prompts/heal-template.md prompts/heal-my-request.md`
2. Edit with your specific requirements
3. Use in Cursor: `/heal-ralph` (paste content) or CLI: `just heal-ralph --prompt-file prompts/heal-my-request.md`
4. Apply suggested changes and validate: `just validate-ralph`
