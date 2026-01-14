# Normalization Summary - VS Code Layout + HTTPie Principles

**Date:** 2026-01-12  
**Scope:** All Ralph/Claude documentation files

## Changes Applied

### 1. Layout Structure (VS Code/Cursor Style)

**Changed From:**
- Vertical split (Request top, Response bottom)
- 40/60 default split
- Top/bottom panes

**Changed To:**
- Horizontal split (Request left, Response right)
- 50/50 default split
- Side-by-side panes (VS Code editor split view)

**Files Updated:**
- ✅ `@fix_plan.md` - Layout & Structure section
- ✅ `specs/requirements.md` - Wireframes, component specs
- ✅ `prompts/PROMPT-2A-layout-foundation.md` - Layout foundation
- ✅ `prompts/PROMPT-2B-request-response-basics.md` - Request/response flow
- ✅ `prompts/PROMPT-2C-response-viewer-polish.md` - Response viewer
- ✅ `PROMPT.md` - Prompt file references
- ✅ `prompts/README.md` - Run order

### 2. HTTPie Design Principles

**Added Principles:**
- Clean & focused interface (minimal chrome, high contrast)
- Subtle interactions (`hover:bg-muted/50`, not pointer cursor everywhere)
- Color-coded elements (HTTP methods, status codes)
- Performance (smooth animations, 200ms transitions)
- Contextual guidance (tooltips, actionable errors)
- Typography (monospaced fonts for code/data)

**Files Updated:**
- ✅ `@fix_plan.md` - Request Builder UI, Response Viewer sections
- ✅ `specs/requirements.md` - Design Principles section
- ✅ `prompts/PROMPT-2A-layout-foundation.md` - Design rationale
- ✅ `prompts/PROMPT-2B-request-response-basics.md` - Design rationale
- ✅ `prompts/PROMPT-2C-response-viewer-polish.md` - Design rationale
- ✅ `prompts/HTTPIE-LEARNINGS.md` - Reference document (new)
- ✅ `prompts/PROMPT-2-DESIGN-GUIDELINES.md` - Implementation guide (new)

### 3. Prompt Structure

**Changed From:**
- Single `PROMPT-2-layout-ui.md` (30+ deliverables)

**Changed To:**
- Split into 3 focused prompts:
  - `PROMPT-2A-layout-foundation.md` (~12-15 deliverables)
  - `PROMPT-2B-request-response-basics.md` (~12-15 deliverables)
  - `PROMPT-2C-response-viewer-polish.md` (~15-18 deliverables)

**Files Updated:**
- ✅ `PROMPT.md` - Updated prompt references
- ✅ `prompts/README.md` - Updated run order
- ✅ `prompts/PROMPT-2-layout-ui.md` - Marked as deprecated

### 4. Component Organization

**Established Structure:**
- `Layout/` - MainLayout, Sidebar, StatusBar
- `Request/` - RequestHeader, TabPanel, etc.
- `Response/` - ResponsePanel, StatusBadge, BodyViewer, etc.

**Files Updated:**
- ✅ `CLAUDE.md` - Component organization section
- ✅ `prompts/PROMPT-2A-layout-foundation.md` - Directory structure
- ✅ `prompts/PROMPT-2B-request-response-basics.md` - Component locations
- ✅ `prompts/PROMPT-2C-response-viewer-polish.md` - Component locations

### 5. Normalization Tools

**Created:**
- ✅ `scripts/normalize-ralph.sh` - Normalization script
- ✅ `justfile` - Added `normalize-ralph` and `validate-ralph` commands
- ✅ `docs/RALPH-FILE-STRUCTURE.md` - Documentation (new)

## Validation Results

```bash
$ just validate-ralph
✅ Basic validation passed
```

All files now have:
- ✅ VS Code-style layout references
- ✅ Horizontal split (Request left | Response right)
- ✅ HTTPie design principles
- ✅ Consistent terminology

## Files Modified

### Core Files
1. `@fix_plan.md` - Task tracking updated
2. `specs/requirements.md` - Specifications updated
3. `PROMPT.md` - Prompt references updated
4. `CLAUDE.md` - Component organization added

### Prompt Files
5. `prompts/PROMPT-2A-layout-foundation.md` - Created/updated
6. `prompts/PROMPT-2B-request-response-basics.md` - Created/updated
7. `prompts/PROMPT-2C-response-viewer-polish.md` - Created/updated
8. `prompts/PROMPT-2-layout-ui.md` - Marked deprecated
9. `prompts/README.md` - Run order updated
10. `prompts/HTTPIE-LEARNINGS.md` - Created
11. `prompts/PROMPT-2-DESIGN-GUIDELINES.md` - Created
12. `prompts/PROMPT-2-QUICK-REFERENCE.md` - Created
13. `prompts/PROMPT-2-REVIEW.md` - Created
14. `prompts/PROMPT-2-SUMMARY.md` - Created

### Tooling
15. `justfile` - Normalization commands added
16. `scripts/normalize-ralph.sh` - Created

### Documentation
17. `docs/RALPH-FILE-STRUCTURE.md` - Created
18. `docs/NORMALIZATION-SUMMARY.md` - This file

## Next Steps

1. **Review Changes:** Verify all updates align with project goals
2. **Test Normalization:** Run `just normalize-ralph` to verify script works
3. **Execute Prompts:** Start with PROMPT-2A when ready
4. **Monitor Consistency:** Use `just validate-ralph` before commits

## Maintenance

**When to Re-normalize:**
- After major design changes
- After layout structure changes
- After adding new design principles
- Before major releases

**How to Re-normalize:**
```bash
just normalize-ralph
just validate-ralph
```

## References

- [Ralph File Structure](./RALPH-FILE-STRUCTURE.md)
- [HTTPie Learnings](../prompts/HTTPIE-LEARNINGS.md)
- [Design Guidelines](../prompts/PROMPT-2-DESIGN-GUIDELINES.md)
