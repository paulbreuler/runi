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

4. **Create Main Plan Document:**
   - Generate plan with appropriate naming based on work type:
     - **Refactor**: `.cursor/plans/[project]_refactor_[timestamp].plan.md`
     - **Overhaul**: `.cursor/plans/[project]_overhaul_[timestamp].plan.md`
     - **Feature**: `.cursor/plans/[project]_features_[timestamp].plan.md` (single or multiple)
     - **Combination**: `.cursor/plans/[project]_[primary-type]_[timestamp].plan.md` (e.g., `overhaul` if overhaul with features)
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

5. **Create Parallelization Analysis:**
   - Generate with matching naming:
     - **Refactor**: `.cursor/plans/[project]_refactor_parallelization.md`
     - **Overhaul**: `.cursor/plans/[project]_overhaul_parallelization.md`
     - **Feature**: `.cursor/plans/[project]_features_parallelization.md`
     - **Combination**: Match primary type from plan name
   - Identify prerequisites (Phase 0 features)
   - Group features into parallel work streams
   - Identify dependencies between features
   - Mark coordination points (shared files)
   - Assign features to agents/streams
   - Estimate timing and risk mitigation

6. **Create Agent Assignment Template:**
   - Generate at `.cursor/plans/agent_assignment_prompt_template.md`
   - Include full prompt structure
   - Add placeholders for feature numbers
   - Include all requirements (TDD, hooks, deliverables)
   - Reference planning documents
   - Include Git workflow instructions

7. **Generate Agent-Specific Prompts (if requested):**
   - For each agent/stream, create customized prompt
   - Replace feature number placeholders
   - Add agent-specific file lists
   - Include prototype component references
   - Save as `.cursor/plans/agent_[stream]_[number].md`

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

## Output Files

File naming based on work type:

- **Refactor**: `[project]_refactor_[id].plan.md` / `[project]_refactor_parallelization.md`
- **Overhaul**: `[project]_overhaul_[id].plan.md` / `[project]_overhaul_parallelization.md`
- **Feature**: `[project]_features_[id].plan.md` / `[project]_features_parallelization.md`
- **Combination**: Match primary type (e.g., if overhaul with features → `overhaul`)

1. **Main Plan**: `.cursor/plans/[project]_[type]_[id].plan.md`
2. **Parallelization**: `.cursor/plans/[project]_[type]_parallelization.md`
3. **Template**: `.cursor/plans/agent_assignment_prompt_template.md`
4. **Agent Prompts** (if requested): `.cursor/plans/agent_[stream]_[number].md`

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
2. Ask clarifying questions about scope
3. Analyze codebase/prototype to discover features
4. Generate main plan with all features
5. Analyze dependencies for parallelization
6. Generate parallelization document
7. Generate agent assignment template
8. Optionally generate agent-specific prompts
9. Present summary and file locations

## Integration Notes

- Plans integrate with Git hooks (pre-commit, pre-push)
- Feature tracking table updates as work progresses
- Agent prompts reference planning documents
- All documents use consistent naming and structure
