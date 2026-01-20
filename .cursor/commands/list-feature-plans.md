# List TDD Plans

List all available TDD plans in the runi-planning-docs repository with their work types, names, and overviews.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Run the list-plans script:**
   - Execute: `just list-plans` or `bash scripts/list-plans.sh`
   - The script will display all plans in `../runi-planning-docs/plans/`

2. **Display the output:**
   - Show the formatted list of plans
   - Include work type (Refactor/Overhaul/Feature)
   - Include plan names
   - Show overviews if available
   - **Display clickable absolute file paths** for all files (plan.md, README.md, interfaces.md, gotchas.md, and all agent files)
   - Paths are formatted without ANSI codes so they're clickable in Cursor terminal

3. **Provide navigation help:**
   - Explain that paths are clickable in most modern terminals (Command+Click on macOS, Ctrl+Click on Linux/Windows)
   - Explain how to view a specific plan using the provided paths
   - Show how to access plan README files, interfaces, gotchas, and agent files
   - Reference the plan directory structure

## Usage

```bash
just list-plans
```

Or directly:

```bash
bash scripts/list-plans.sh
```

## Output Format

The script displays each plan with:

- Work type icon and label (🔧 Refactor, 🔄 Overhaul, ✨ Feature)
- Plan name (human-readable)
- Overview snippet (if available from plan.md)
- **Clickable absolute file paths** (one per line):
  - `plan.md` - Full feature specifications
  - `README.md` - Index and status (if exists)
  - `interfaces.md` - Interface contracts (if exists)
  - `gotchas.md` - Discovered issues (if exists)
  - All `*.agent.md` files in `agents/` directory (excludes completed agents in `agents/completed/` subdirectory)

**Navigation:**

- All file links use Cursor's `cursor://file/` URL scheme to open directly in Cursor
- Links display compact text (e.g., `plan.md`, `agents/agent_1.agent.md`) but open the full file path
- Click any link in the terminal to open the file in Cursor
- Works with OSC 8 hyperlink support (iTerm2, Windows Terminal, Alacritty, WezTerm, and Cursor's terminal)

## Example Output

```
📋 TDD Plans in runi-planning-docs/plans/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Overhaul  Datagrid Overhaul
   Overview: Major overhaul of DataGrid component...
   /Users/paul/Documents/GitHub/runi-planning-docs/plans/datagrid_overhaul_4a5b9879/plan.md
   /Users/paul/Documents/GitHub/runi-planning-docs/plans/datagrid_overhaul_4a5b9879/README.md
   /Users/paul/Documents/GitHub/runi-planning-docs/plans/datagrid_overhaul_4a5b9879/interfaces.md
   /Users/paul/Documents/GitHub/runi-planning-docs/plans/datagrid_overhaul_4a5b9879/gotchas.md
   /Users/paul/Documents/GitHub/runi-planning-docs/plans/datagrid_overhaul_4a5b9879/agents/agent_0_accessibility_foundation_early.agent.md
   /Users/paul/Documents/GitHub/runi-planning-docs/plans/datagrid_overhaul_4a5b9879/agents/agent_1_column_display_features.agent.md
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Refactor  Timingtab Refactor
   Overview: Refactor TimingTab to extract reusable SignalBadge component...
   /Users/paul/Documents/GitHub/runi-planning-docs/plans/timingtab_refactor_1768875182/plan.md
   /Users/paul/Documents/GitHub/runi-planning-docs/plans/timingtab_refactor_1768875182/README.md
   /Users/paul/Documents/GitHub/runi-planning-docs/plans/timingtab_refactor_1768875182/agents/accessibility.agent.md
   ...
```

**Note:** All file links use Cursor's `cursor://file/` URL scheme. Clicking on compact labels like `plan.md` or `agents/agent_1.agent.md` will open the full file path directly in Cursor.

## Viewing Plans

After listing, you can:

- **Click any file link** in the Cursor terminal to open it directly in Cursor
- Links show compact text (e.g., `plan.md`) but open the full file path
- All links use Cursor's `cursor://file/` URL scheme for direct integration

**Quick Navigation:**

- Click on compact labels like `plan.md`, `README.md`, or `agents/agent_1.agent.md`
- Files open directly in Cursor when clicked

**Opening in Current Window:**
To ensure files open in your current Cursor window (not a new window), set this in your Cursor settings:

```json
{
  "window.openFilesInNewWindow": "off"
}
```

Or use the CLI with the `-r` flag: `cursor -r [path]`

**Fallback:**
If hyperlinks don't work in your terminal, you can use the `cursor` CLI command: `cursor [path]`

## Integration

This command is useful for:

- Discovering available plans before starting work
- Finding plans by work type
- Getting quick overviews of plan scope
- Navigating to specific plans for reference

**Note**: Completed agents (moved to `agents/completed/` directory) are automatically excluded from listings to show only active work.
