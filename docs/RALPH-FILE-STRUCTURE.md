# Ralph File Structure & Normalization

**Date:** 2026-01-12  
**Purpose:** Document Ralph/Claude file structure and normalization process

## File Structure

Ralph uses multiple files to track progress and provide context:

```
runi/
├── @fix_plan.md              # Master task tracking (Ralph monitors this)
├── PROMPT.md                 # Master Ralph instructions
├── CLAUDE.md                 # Project conventions & coding standards
├── specs/
│   └── requirements.md       # Technical specifications
├── prompts/
│   ├── README.md             # Prompt execution guide
│   ├── PROMPT-1-http-core.md
│   ├── PROMPT-2A-layout-foundation.md
│   ├── PROMPT-2B-request-response-basics.md
│   ├── PROMPT-2C-response-viewer-polish.md
│   ├── PROMPT-3-request-builder.md
│   ├── PROMPT-4-intelligence.md
│   ├── HTTPIE-LEARNINGS.md   # HTTPie design principles
│   └── PROMPT-2-DESIGN-GUIDELINES.md
└── scripts/
    └── normalize-ralph.sh    # Normalization script
```

## File Responsibilities

### @fix_plan.md
- **Purpose:** Master task tracking file
- **Ralph Behavior:** Monitors this file for completion signals
- **Format:** Markdown checkboxes `- [ ]` and `- [x]`
- **Updates Required When:**
  - Layout structure changes
  - Design principles change
  - New components added
  - Task breakdown changes

### specs/requirements.md
- **Purpose:** Technical specifications and requirements
- **Contains:** Wireframes, component specs, design principles
- **Updates Required When:**
  - Layout structure changes (VS Code style, horizontal split)
  - Design principles change (HTTPie-inspired)
  - Component specifications change

### PROMPT.md
- **Purpose:** Master Ralph instructions
- **Contains:** Overall objectives, exit conditions, status reporting
- **Updates Required When:**
  - Prompt file structure changes (split prompts)
  - Overall objectives change

### prompts/*.md
- **Purpose:** Focused prompts for specific runs
- **Contains:** Success criteria, code examples, completion signals
- **Updates Required When:**
  - Design principles change
  - Layout structure changes
  - Component requirements change

### CLAUDE.md
- **Purpose:** Project conventions and coding standards
- **Contains:** Component organization, patterns, decision log
- **Updates Required When:**
  - New patterns established
  - Component structure changes
  - Design decisions made

## Normalization Process

### When to Normalize

Normalize after:
1. **Layout structure changes** (e.g., vertical → horizontal split)
2. **Design principle changes** (e.g., adding HTTPie principles)
3. **Component structure changes** (e.g., new directory organization)
4. **Task breakdown changes** (e.g., splitting prompts)

### How to Normalize

```bash
# Run normalization script
just normalize-ralph

# Or validate consistency
just validate-ralph
```

### What Gets Normalized

1. **Layout Structure:**
   - VS Code-style references
   - Horizontal split (Request left | Response right)
   - 50/50 default split
   - Min 30% pane sizes

2. **Design Principles:**
   - HTTPie-inspired patterns
   - Subtle interactions (`hover:bg-muted/50`)
   - High contrast requirements
   - Monospaced fonts for code

3. **Component Naming:**
   - Directory structure (Layout/, Request/, Response/)
   - Component naming conventions
   - Story naming patterns

4. **Task Tracking:**
   - @fix_plan.md alignment with prompts
   - Success criteria consistency
   - Completion signals

## Common Issues

### Issue: Outdated Layout References

**Symptom:** Files mention "vertical split", "top/bottom", "40/60"

**Fix:**
```bash
# Search for outdated patterns
grep -r "vertical split\|top.*bottom\|40/60" @fix_plan.md specs/ prompts/

# Update to horizontal split, left/right, 50/50
```

### Issue: Missing HTTPie Principles

**Symptom:** Files don't mention HTTPie, subtle interactions, high contrast

**Fix:**
```bash
# Check for HTTPie references
grep -r "HTTPie\|hover:bg-muted\|subtle.*interaction" @fix_plan.md specs/ prompts/

# Add HTTPie-inspired design principles where missing
```

### Issue: Inconsistent Prompt References

**Symptom:** PROMPT.md or prompts/README.md reference old prompt names

**Fix:**
- Update PROMPT.md to reference 2A, 2B, 2C
- Update prompts/README.md run order
- Mark old PROMPT-2-layout-ui.md as deprecated

## Validation Checklist

Before committing changes, verify:

- [ ] @fix_plan.md has correct layout structure (VS Code style)
- [ ] specs/requirements.md has correct wireframes (horizontal split)
- [ ] PROMPT.md references correct prompt files (2A, 2B, 2C)
- [ ] prompts/README.md has correct run order
- [ ] All prompts mention HTTPie principles where applicable
- [ ] No outdated "vertical split" or "top/bottom" references
- [ ] Component naming is consistent across files
- [ ] Task tracking aligns with prompt success criteria

## Automation

### Normalization Script

`scripts/normalize-ralph.sh` checks for:
- Layout structure consistency
- HTTPie design principles
- Outdated references
- Prompt file structure

### Validation Command

`just validate-ralph` performs quick consistency checks:
- Layout pattern presence
- HTTPie principle presence
- Basic file structure

## Best Practices

1. **Update All Files:** When making design changes, update all relevant files
2. **Run Validation:** Use `just validate-ralph` before committing
3. **Document Changes:** Update this file when adding new normalization rules
4. **Consistent Terminology:** Use same terms across all files (e.g., "VS Code-style", "horizontal split")
5. **Reference Prompts:** Link between @fix_plan.md tasks and prompt files

## References

- [Ralph Documentation](https://github.com/frankbria/ralph-claude-code)
- [HTTPie Learnings](../prompts/HTTPIE-LEARNINGS.md)
- [Design Guidelines](../prompts/PROMPT-2-DESIGN-GUIDELINES.md)
