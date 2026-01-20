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
   - Include plan names and directory names
   - Show overviews if available

3. **Provide navigation help:**
   - Explain how to view a specific plan
   - Show how to access plan README files
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

The script displays:

- Total number of plans
- Each plan with:
  - Work type icon and label (🔧 Refactor, 🔄 Overhaul, ✨ Feature)
  - Plan name (human-readable)
  - Directory name (for navigation)
  - Overview snippet (if available from plan.md)
  - README availability indicator

## Example Output

```
📋 TDD Plans in runi-planning-docs/plans/

Total plans: 13

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Refactor  Timingtab Refactor
   Directory: timingtab_refactor_1768875182
   Overview: Refactor TimingTab to extract reusable SignalBadge component...
   📄 README available

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Overhaul  Datagrid Overhaul
   Directory: datagrid_overhaul_4a5b9879
   Overview: Major overhaul of DataGrid component...
   📄 README available
```

## Viewing Plans

After listing, you can:

- **View a plan**: `cat ../runi-planning-docs/plans/[plan-name]/plan.md`
- **View README**: `cat ../runi-planning-docs/plans/[plan-name]/README.md`
- **View parallelization**: `cat ../runi-planning-docs/plans/[plan-name]/parallelization.md`
- **View speed prompts**: `cat ../runi-planning-docs/plans/[plan-name]/speed_prompts.md`

## Integration

This command is useful for:

- Discovering available plans before starting work
- Finding plans by work type
- Getting quick overviews of plan scope
- Navigating to specific plans for reference
