# Update TDD Plan

Apply feedback from LLMs or other sources to an existing TDD plan, suggest changes, and commit after user approval.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Identify the Plan:**
   - Ask user: "Which plan do you want to update?"
   - If user provides plan name, search for it
   - If unsure, run `just list-plans` to show available plans
   - Confirm the plan directory name

2. **Gather Feedback:**
   - Accept feedback from user (paste, file, or description)
   - If feedback is in a file, read it: `cat [file-path]`
   - If feedback is pasted, use it directly
   - Parse feedback to identify:
     - Feature changes (add/remove/modify features)
     - Gherkin scenario updates
     - TDD todo modifications
     - Status updates (feature tracking table)
     - Parallelization changes
     - Speed prompts updates
     - Documentation improvements
     - Architectural concerns
     - Missing test coverage (unit, integration, E2E, migration, performance)
     - Missing `data-test-id` attributes or incorrect test selector usage
     - PR-related feedback (breaking changes, migration guides, PR descriptions)
     - Performance requirements or thresholds
     - Migration testing requirements
     - Clarifications needed

3. **Read the Current Plan:**
   - Read `../runi-planning-docs/plans/[plan-name]/plan.md`
   - Read `../runi-planning-docs/plans/[plan-name]/parallelization.md` (if exists)
   - Read `../runi-planning-docs/plans/[plan-name]/speed_prompts.md` (if exists)
   - Read `../runi-planning-docs/plans/[plan-name]/README.md` (if exists)

4. **Analyze Feedback and Suggest Changes:**
   - For each piece of feedback, determine:
     - **Actionable**: Can be applied directly
     - **Needs Clarification**: Requires user input
     - **Out of Scope**: Not relevant to this plan
   - For actionable feedback, propose specific changes:
     - Show what will change (diff format)
     - Explain why the change improves the plan
     - Indicate which files will be modified

5. **Present Proposed Changes:**
   - Show summary of all proposed changes
   - Display diffs for each file that will be modified
   - Group changes by file
   - Highlight critical changes vs. improvements
   - Ask for user approval before making changes

6. **Apply Changes (After Approval):**
   - Update the relevant plan files based on approved feedback
   - Maintain plan structure and format
   - Update feature tracking table if features change
   - Update parallelization if dependencies change
   - Update speed prompts if feature details change
   - Update README if plan overview changes

7. **Verify Consistency:**
   - Ensure all files are consistent
   - Verify feature numbers match across files
   - Check that parallelization reflects current features
   - Ensure speed prompts match plan details

8. **Commit Changes (After Approval):**
   - Stage modified files in runi-planning-docs repository
   - Create commit with descriptive message
   - Format: `update(plans): [plan-name] - [brief description of changes]`
   - Example: `update(plans): timingtab_refactor - add accessibility improvements per feedback`

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
4. Add testing requirements (unit, integration, E2E if applicable, migration if overhaul, performance if data-heavy)
5. Add `data-test-id` requirements for all interactive elements and test targets
6. Update feature tracking table
7. Update `parallelization.md` if needed
8. Update `speed_prompts.md` with new agent section
9. If overhaul: Add breaking changes and migration guide requirements

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
4. Update test coverage indicators (unit, integration, E2E, migration, performance)
5. Update PR status if applicable (PR created, CI passing, etc.)

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
2. **Gather Feedback**: Accept feedback from user (paste, file, or description)
3. **Read Plan**: Load current plan files
4. **Analyze & Suggest**: Propose specific changes with diffs
5. **Get Approval**: Present changes and wait for user approval
6. **Apply Changes**: Make approved changes to plan files
7. **Verify**: Ensure consistency across files
8. **Commit**: After final approval, commit to runi-planning-docs repository

## Feedback Input Methods

### From File

```bash
# User provides feedback file
/update-plan timingtab_refactor_1768875182 @feedback.md
```

### From Paste

```bash
# User pastes feedback directly
/update-plan timingtab_refactor_1768875182
[User pastes feedback]
```

### From Description

```bash
# User describes feedback
/update-plan timingtab_refactor_1768875182
"Add accessibility improvements: aria-labels on timing segments"
```

## Change Proposal Format

When proposing changes, show:

````markdown
## Proposed Changes for [Plan Name]

### File: plan.md

**Change 1: Add Feature #5 - Accessibility Improvements**

- **Reason**: Feedback suggests adding aria-labels for screen readers
- **Location**: After Feature #4
- **Diff**:
  ```diff
  + #### Feature #5: Add aria-label to Timing Segments
  +
  + **Priority**: Nice to Have (Accessibility)
  +
  + **Gherkin Scenario:**
  + ...
  ```
````

### File: parallelization.md

**Change 1: Add Feature #5 to Stream 2**

- **Reason**: Feature can work in parallel with Features #2-4
- **Location**: Stream 2 section
- **Diff**:
  ```diff
  + #### Agent 5: Accessibility Improvements
  + - **Feature #5**: Add aria-label to Timing Segments
  + ...
  ```

## Summary

- **Files Modified**: 2 (plan.md, parallelization.md)
- **Features Added**: 1 (Feature #5)
- **Critical Changes**: 0
- **Improvements**: 1

**Ready to apply?** (yes/no)

````

## Approval Workflow

1. **Present Changes**: Show all proposed changes with diffs
2. **Wait for Approval**: User reviews and approves/rejects
3. **Apply Approved Changes**: Only make changes that are approved
4. **Show Final Summary**: Display what was actually changed
5. **Final Approval for Commit**: Ask user to approve commit
6. **Commit**: After final approval, commit to runi-planning-docs

## Commit Process

After user approves all changes:

```bash
cd ../runi-planning-docs
git add plans/[plan-name]/
git commit -m "update(plans): [plan-name] - [description of changes]"
````

## Notes

- **Trunk-Driven**: Changes are committed to runi-planning-docs only after user approval
- **Feedback Analysis**: Parse feedback carefully to identify actionable items
- **Change Proposals**: Always show diffs before making changes
- **Consistency**: Keep all plan files in sync when making changes
- **Feature Numbers**: Maintain sequential numbering when adding features
- **Status Tracking**: Update feature tracking table as work progresses
- **Rejections**: If user rejects changes, explain why and ask for clarification
