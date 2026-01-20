# Update TDD Plan

Apply feedback or updates to an existing TDD plan in the runi-planning-docs repository.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Identify the Plan:**
   - Ask user: "Which plan do you want to update?"
   - If user provides plan name, search for it
   - If unsure, run `just list-plans` to show available plans
   - Confirm the plan directory name

2. **Understand the Feedback:**
   - Ask user: "What feedback or changes need to be applied?"
   - Clarify what needs to be updated:
     - Feature changes (add/remove/modify features)
     - Gherkin scenario updates
     - TDD todo modifications
     - Status updates (feature tracking table)
     - Parallelization changes
     - Speed prompts updates
     - Documentation improvements

3. **Read the Current Plan:**
   - Read `../runi-planning-docs/plans/[plan-name]/plan.md`
   - Read `../runi-planning-docs/plans/[plan-name]/parallelization.md` (if exists)
   - Read `../runi-planning-docs/plans/[plan-name]/speed_prompts.md` (if exists)
   - Read `../runi-planning-docs/plans/[plan-name]/README.md` (if exists)

4. **Apply the Feedback:**
   - Update the relevant plan files based on feedback
   - Maintain plan structure and format
   - Update feature tracking table if features change
   - Update parallelization if dependencies change
   - Update speed prompts if feature details change
   - Update README if plan overview changes

5. **Verify Consistency:**
   - Ensure all files are consistent
   - Verify feature numbers match across files
   - Check that parallelization reflects current features
   - Ensure speed prompts match plan details

6. **Present Summary:**
   - Show what was changed
   - Indicate which files were modified
   - Note if commit is needed (trunk-driven workflow)

## Usage

```bash
# First, list plans to find the one to update
just list-plans

# Then work with the plan files directly
# Files are in: ../runi-planning-docs/plans/[plan-name]/
```

## Common Update Scenarios

### Adding a New Feature

1. Read current `plan.md`
2. Add new feature section with Gherkin scenario
3. Add TDD todos for the feature
4. Update feature tracking table
5. Update `parallelization.md` if needed
6. Update `speed_prompts.md` with new agent section

### Modifying Existing Feature

1. Read current `plan.md`
2. Locate the feature section
3. Update Gherkin scenario, TDD todos, or requirements
4. Update feature tracking table status if needed
5. Update `speed_prompts.md` if feature details changed

### Updating Status

1. Read current `plan.md`
2. Find feature tracking table
3. Update status (GAP → IN_PROGRESS → PASS, etc.)
4. Update test coverage indicators

### Changing Dependencies

1. Read `parallelization.md`
2. Update dependency information
3. Adjust parallel work streams if needed
4. Update coordination points

## File Locations

Plan files are in: `../runi-planning-docs/plans/[plan-name]/`

- `plan.md` - Main plan document
- `parallelization.md` - Parallelization analysis
- `speed_prompts.md` - Agent prompts
- `README.md` - Quick reference

## Workflow

1. **Identify Plan**: Use `just list-plans` or user provides plan name
2. **Read Plan**: Load current plan files
3. **Apply Feedback**: Make requested changes
4. **Verify**: Ensure consistency across files
5. **Commit**: After user approval, commit to runi-planning-docs repository

## Notes

- **Trunk-Driven**: Changes are committed to runi-planning-docs after user approval
- **Consistency**: Keep all plan files in sync when making changes
- **Feature Numbers**: Maintain sequential numbering when adding features
- **Status Tracking**: Update feature tracking table as work progresses
