# Create Comprehensive TDD Plan

Generate a comprehensive TDD plan for refactoring, overhaul, or feature implementation projects with feature breakdown, Gherkin scenarios, parallelization analysis, and agent assignment prompts.

## Instructions for Claude

**When this command is invoked, you must:**

1. **Determine Work Type:**
   - Ask user: "What type of work is this?"
     - **Refactor**: Changing existing code without changing behavior
     - **Overhaul**: Major restructuring/rewrite of existing system
     - **Feature Implementation**: Adding new functionality (single or multiple features)
     - **Combination**: Mix of the above (e.g., "overhaul with new features")
   - Use work type to determine file naming and plan structure
   - Note: Refactors and overhauls may include new features, but the primary goal differs

2. **Gather Project Context:**
   - Ask user for project name/scope
   - Identify the component/system being worked on
   - Determine if there's a prototype or reference document
   - Understand the tech stack and existing patterns
   - Identify key files/components involved

3. **Discover Features:**
   - Analyze the codebase to identify features
   - Review prototype/reference documents if provided
   - Break down into discrete, testable features
   - Number features sequentially (#1, #2, etc.)
   - Group features by area (Core Display, Filtering, etc.)

4. **Create Plan Directory Structure:**
   - Create directory: `.cursor/plans/[project]_[type]_[timestamp]/`
   - All plan-related files go in this directory
   - Structure:
     ```
     .cursor/plans/[project]_[type]_[timestamp]/
     ├── plan.md                    # Main plan document
     ├── parallelization.md          # Parallelization analysis
     ├── speed_prompts.md            # Quick-reference agent prompts
     └── agents/                    # Optional: agent-specific prompts
         └── agent_[name]_[number].md
     ```

5. **Create Main Plan Document:**
   - Generate at `.cursor/plans/[project]_[type]_[timestamp]/plan.md`
   - Naming based on work type:
     - **Refactor**: `[project]_refactor_[timestamp]`
     - **Overhaul**: `[project]_overhaul_[timestamp]`
     - **Feature**: `[project]_features_[timestamp]`
     - **Combination**: `[project]_[primary-type]_[timestamp]`
   - Include overview with project context and work type
   - Adjust plan structure based on work type:
     - **Refactor**: Focus on behavior preservation, migration paths
     - **Overhaul**: Focus on new architecture, breaking changes
     - **Feature**: Focus on new functionality, integration points
   - For each feature, add:
     - Feature number and name
     - Gherkin scenario (Given/When/Then)
     - TDD todos (RED → GREEN → REFACTOR cycles)
     - Component design requirements
     - Storybook story requirements
     - Initial status (GAP/IN_PROGRESS)
   - Add feature tracking table at the end
   - Include implementation order
   - List Storybook and documentation requirements

6. **Create Parallelization Analysis:**
   - Generate at `.cursor/plans/[project]_[type]_[timestamp]/parallelization.md`
   - Use same directory as main plan
   - Identify prerequisites (Phase 0 features)
   - Group features into parallel work streams
   - Identify dependencies between features
   - Mark coordination points (shared files)
   - Assign features to agents/streams
   - Estimate timing and risk mitigation

7. **Create Speed Prompts File:**
   - Generate at `.cursor/plans/[project]_[type]_[timestamp]/speed_prompts.md`
   - Use same directory as main plan
   - Reference template location: `.cursor/plans/templates/agent_assignment_prompt_template.md`

8. **Check/Create Agent Assignment Template:**
   - Check if `.cursor/plans/templates/agent_assignment_prompt_template.md` exists
   - If not, create it with full prompt structure
   - Include placeholders for feature numbers
   - Include all requirements (TDD, hooks, deliverables)
   - Reference planning documents (use relative paths from plan directory)
   - Include Git workflow instructions
   - For each feature/agent, create a quick-reference section with:
     - Feature number(s) and name(s)
     - Link to plan section
     - Link to template location
     - Critical information (constraints, requirements, files, dependencies)
     - Key TDD steps
     - Success criteria
     - Template injection guide
   - Format: Easy to copy-paste sections for quick agent creation

9. **Generate Agent-Specific Prompts (if requested):**
   - Create directory: `.cursor/plans/[project]_[type]_[timestamp]/agents/`
   - For each agent/stream, create customized prompt
   - Replace feature number placeholders
   - Add agent-specific file lists
   - Include prototype component references
   - Save as `.cursor/plans/[project]_[type]_[timestamp]/agents/agent_[stream]_[number].md`

10. **Create README (Optional but Recommended):**
    - Generate at `.cursor/plans/[project]_[type]_[timestamp]/README.md`
    - Include links to all files in the directory
    - Quick start guide
    - Links to template and other resources
    - Work type and key information summary
    - Use template from `.cursor/skills/comprehensive-tdd-planning/references/plan_readme_template.md`

## Plan Document Structure

### Main Plan Format

````markdown
---
name: [Project] [Work Type] - Comprehensive TDD Plan
overview: "[Brief description]"
todos: []
isProject: false
---

# [Project] [Work Type] - Comprehensive TDD Plan

## Overview

**Work Type**: [Refactor | Overhaul | Feature Implementation | Combination]

[Project context, goals, approach]

**Note**: [If combination, specify: "This is primarily a [type] that includes [other types]"]

## Feature Breakdown with Gherkin Scenarios

### [Feature Area]

#### Feature #[NUMBER]: [Feature Name]

**Gherkin Scenario:**

```gherkin
Feature: [Name]
  Scenario: [Behavior]
    Given [state]
    When [action]
    Then [outcome]
```
````

**TDD Todos:**

- [ ] **RED**: Write failing test `[test description]`
- [ ] **GREEN**: [implementation step]
- [ ] **REFACTOR**: [improvement step]
- [Repeat for each test case]

**Component Design:**

- [ ] Create `[ComponentName]` component
- [ ] Create `[SubComponent]` component

**Storybook:**

- [ ] Story: `[StoryName]` - [description]
- [ ] **VALIDATION REQUIRED**: Build Storybook (`npm run build-storybook`), verify no errors, test interactively if possible using MCP tools

**Status:** ❌ Not tested | Status: GAP

---

## Feature Tracking Table

────────────────────────────────────────

# : [NUMBER]

Feature: [NAME]
Expected Behavior: [DESCRIPTION]
Current Test Coverage: [STATUS]
Status: [STATUS]
────────────────────────────────────────

````

### Parallelization Format

```markdown
# [Project] [Work Type] - Parallelization Strategy

## Prerequisites (Must Complete First)
### Phase 0: Foundation
- Feature #[N]: [Description]
- **Why**: [Dependency reason]
- **Estimated Time**: [duration]

## Parallel Work Streams

### Stream [N]: [Stream Name] ([X] Agents)
#### Agent [N]: [Feature Name]
- **Feature #[N]**: [Description]
- **Dependencies**: [List]
- **Files**: [List]
- **Coordination**: [Notes]

## Coordination Points
[Shared files, integration points, risk mitigation]
````

## Questions to Ask User

1. **Work Type (FIRST):**
   - What type of work is this?
     - **Refactor**: Changing existing code without changing behavior
     - **Overhaul**: Major restructuring/rewrite
     - **Feature Implementation**: Adding new functionality
     - **Combination**: Mix (specify primary type)
   - Does this work include new features? (refactors/overhauls can include features)

2. **Project Scope:**
   - What component/system is being worked on?
   - What's the main goal? (refactor, overhaul, new features, performance, etc.)
   - Is there a prototype or reference document?

3. **Features:**
   - Should I analyze the codebase to discover features?
   - Or do you have a feature list already?
   - Any specific features you want included/excluded?

4. **Parallelization:**
   - How many agents will work in parallel?
   - Any specific agent assignments?
   - Preferred work streams?

5. **Output:**
   - Generate agent-specific prompts?
   - Include short prompt template?
   - Any custom requirements?

## Output Directory Structure

Each plan gets its own directory:

```
.cursor/plans/
├── [project]_[type]_[timestamp]/          # Plan directory
│   ├── README.md                           # Quick reference (optional)
│   ├── plan.md                             # Main plan document
│   ├── parallelization.md                  # Parallelization analysis
│   ├── speed_prompts.md                    # Quick-reference agent prompts
│   └── agents/                             # Agent-specific prompts (optional)
│       └── agent_[stream]_[number].md
└── templates/                               # Shared templates
    └── agent_assignment_prompt_template.md
```

**Directory Naming** (based on work type):

- **Refactor**: `[project]_refactor_[timestamp]`
- **Overhaul**: `[project]_overhaul_[timestamp]`
- **Feature**: `[project]_features_[timestamp]`
- **Combination**: Match primary type (e.g., `overhaul` if overhaul with features)

**Files Generated**:

1. **Main Plan**: `.cursor/plans/[project]_[type]_[timestamp]/plan.md`
2. **Parallelization**: `.cursor/plans/[project]_[type]_[timestamp]/parallelization.md`
3. **Speed Prompts**: `.cursor/plans/[project]_[type]_[timestamp]/speed_prompts.md`
4. **Template** (shared): `.cursor/plans/templates/agent_assignment_prompt_template.md`
5. **Agent Prompts** (if requested): `.cursor/plans/[project]_[type]_[timestamp]/agents/agent_[stream]_[number].md`
6. **README** (optional): `.cursor/plans/[project]_[type]_[timestamp]/README.md`

### Speed Prompts File Structure

The speed prompts file contains quick-reference sections for each agent:

```markdown
# [Project] [Type] - Speed Prompts

**Template Location**: `.cursor/plans/templates/agent_assignment_prompt_template.md`
**How to Use**: [Instructions]
**Plan Location**: `.cursor/plans/[project]_[type]_[timestamp]/plan.md` (this directory)

---

## Agent [N]: Feature #[NUMBER] - [Feature Name]

**Feature Numbers**: `#[NUMBER]`
**Feature Name**: [Name]
**Plan Section**: See "Feature #[NUMBER]" in the main plan document

**Critical Information**:

- [Key constraints]
- [Type requirements]
- [Files to modify/create]
- [Dependencies]
- [Coordination notes]

**Key TDD Steps**:

1. RED: [Test description]
2. GREEN: [Implementation]
3. REFACTOR: [Improvement]

**Success Criteria**:

- ✅ [Criteria 1]
- ✅ [Criteria 2]

---

## Template Injection Guide

[Instructions on how to use the template with speed prompts]
```

## Best Practices

- **Work Type Clarity**: Always determine work type first - affects naming and structure
- **Naming Accuracy**: Use correct type in filename (refactor/overhaul/features)
- **Combination Handling**: For combinations, use primary type for naming, note secondary types in plan
- **Feature Granularity**: Each feature should be independently testable
- **Gherkin Clarity**: Scenarios should be specific and behavior-focused
- **TDD Completeness**: Include all RED-GREEN-REFACTOR cycles
- **Dependency Clarity**: Clearly mark what depends on what
- **Agent Independence**: Maximize features that can work in parallel
- **Status Tracking**: Start all features as GAP or IN_PROGRESS
- **Storybook Validation**: Stories must be created AND validated - build Storybook, verify no errors, test interactively if possible using MCP tools. Creating story files is not enough; they must work correctly.

## Work Type Guidelines

### Determining Work Type

Ask: "What is the PRIMARY goal?"

- **Refactor**: "I want to improve the code structure without changing what it does"
- **Overhaul**: "I want to completely restructure/rewrite this system"
- **Feature**: "I want to add new functionality"

### Handling Combinations

If work includes multiple types:

1. **Identify primary type**: What's the main goal?
2. **Use primary type for naming**: `[project]_[primary-type]_[id].plan.md`
3. **Note in plan overview**: "This is primarily a [type] that includes [other types]"
4. **Adjust structure**: Focus on primary type, but include all work

**Example**: "Overhaul with new features"

- Primary: Overhaul
- Naming: `datagrid_overhaul_abc123.plan.md`
- Plan notes: "This is primarily an overhaul that includes new features"
- Structure: Focus on restructuring, but include new feature breakdown

## Example Workflow

1. User invokes command: `/create-tdd-plan`
2. Ask clarifying questions about scope and work type
3. Analyze codebase/prototype to discover features
4. **Create plan directory**: `.cursor/plans/[project]_[type]_[timestamp]/`
5. Generate main plan in directory: `plan.md`
6. Analyze dependencies for parallelization
7. Generate parallelization document: `parallelization.md`
8. Generate speed prompts file: `speed_prompts.md`
9. Check/create shared template: `templates/agent_assignment_prompt_template.md`
10. Optionally generate agent-specific prompts in `agents/` subdirectory
11. Optionally create README.md with links to all files
12. Present summary and directory location

## Integration Notes

- Plans integrate with Git hooks (pre-commit, pre-push)
- Feature tracking table updates as work progresses
- Agent prompts reference planning documents
- All documents use consistent naming and structure
- **Directory Structure**: New plans use directory-per-plan structure
- **Legacy Plans**: Existing plans at root level can remain, but new plans should use directories

## Migration Note

If you have existing plans at the root level (e.g., `datagrid_overhaul_4a5b9879.plan.md`), you can optionally migrate them:

1. Create directory: `.cursor/plans/datagrid_overhaul_4a5b9879/`
2. Move related files into directory:
   - `plan.md` (rename from `.plan.md`)
   - `parallelization.md`
   - `speed_prompts.md`
   - `agents/` directory if exists
3. Update references in files (template paths, etc.)
4. Create `README.md` for quick reference

This is optional - legacy plans can stay at root, but new plans will use directories.
