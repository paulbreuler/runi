# Prime Context

Load comprehensive project context for faster Claude Code session startup.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Load Core Files:**
   - Read `CLAUDE.md` (project standards and decision log)
   - Read `justfile` (available commands)
   - Read `package.json` (dependencies)
   - Read `src-tauri/Cargo.toml` (Rust dependencies)

2. **Load Documentation:**
   - Read `specs/requirements.md`
   - Read `@fix_plan.md` (current phase and tasks)
   - Read `PROMPT.md` (Ralph instructions)
   - Read recent `prompts/*.md` files (last 3-5)

3. **Load Code Structure:**
   - List component directories (`src/lib/components/`)
   - List command structure (`src-tauri/src/commands/`)
   - List test organization

4. **Load Recent Changes:**
   - Show recent git commits (`git log --oneline -10`)
   - Show staged changes (`git diff --cached --stat`)
   - Show recent test files

5. **Set Development Context:**
   - Identify current phase from `@fix_plan.md`
   - List active tasks
   - Identify blockers or dependencies

## What This Does

This command primes Claude Code with comprehensive project context, enabling:

- Faster session startup (no need to read files individually)
- Better context understanding
- More accurate code suggestions
- Consistent adherence to project standards

## Usage

### In Cursor Chat

Type `/prime` to load full context:

```text
/prime
```

Load context for specific component:

```text
/prime --component Request
```

Load context for specific phase:

```text
/prime --phase 2
```

**When invoked, this command will:**

1. Read all core project files
2. Load documentation and recent prompts
3. Show code structure and recent changes
4. Display current development context

### Via Command Palette

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Prime: Load Context"
3. Optionally specify component or phase

## Context Loaded

### Core Files

- `CLAUDE.md` - Project standards, decision log, coding conventions
- `justfile` - Available commands and workflows
- `package.json` - Frontend dependencies
- `src-tauri/Cargo.toml` - Rust dependencies

### Documentation

- `specs/requirements.md` - Technical specifications
- `@fix_plan.md` - Current phase, active tasks, blockers
- `PROMPT.md` - Ralph development instructions
- `prompts/*.md` - Recent development prompts

### Code Structure

- Component organization (Layout/, Request/, Response/, ui/)
- Command structure (Tauri commands)
- Test organization (unit, integration, E2E)

### Recent Changes

- Last 10 git commits
- Staged changes
- Recent test files

### Development Context

- Current phase (from @fix_plan.md)
- Active tasks
- Blockers or dependencies

## Examples

### Full Context Prime

```text
/prime
```

Loads all context for comprehensive session startup.

### Component-Specific Prime

```text
/prime --component Request
```

Loads context focused on Request components:

- Request component files
- Request-related tests
- Request-related documentation

### Phase-Specific Prime

```text
/prime --phase 2
```

Loads context for Phase 2:

- Phase 2 requirements
- Phase 2 tasks from @fix_plan.md
- Phase 2-related code

## Related Commands

- `/code-review` - Review code with full context
- `/test` - Generate tests (uses context for better tests)
- `/scaffold` - Scaffold components (uses context for structure)

## Notes

- **Fast:** Loads essential files first, then details
- **Comprehensive:** Covers all aspects of project context
- **Adaptive:** Can focus on specific areas with flags
- **Repeatable:** Same context every time for consistency
