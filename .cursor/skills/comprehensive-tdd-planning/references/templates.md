# TDD Planning Templates

Reference templates for creating comprehensive TDD plans.

## Feature Template

````markdown
#### Feature #[NUMBER]: [Feature Name]

**Gherkin Scenario:**

```gherkin
Feature: [Feature Name]
  Scenario: [Specific behavior]
    Given [initial state or context]
    When [action or trigger]
    Then [expected outcome]
    And [additional expectations]
```
````

**TDD Todos:**

- [ ] **RED**: Write failing test `[test description]`
- [ ] **GREEN**: [minimum implementation to pass]
- [ ] **REFACTOR**: [improvement while tests stay green]
- [ ] **RED**: Write failing test `[next test case]`
- [ ] **GREEN**: [implementation]
- [ ] **REFACTOR**: [improvement]

**Component Design:**

- [ ] Create `[ComponentName]` component
- [ ] Create `[SubComponent]` component
- [ ] Create `[Utility]` utility

**Storybook:**

- [ ] Story: `[StoryName]` - [description]
- [ ] Story: `[StateName]` - [specific state]

**Status:** ❌ Not tested | Status: GAP

````

## Feature Tracking Table Entry Template

```markdown
────────────────────────────────────────
#: [NUMBER]
Feature: [FEATURE NAME]
Expected Behavior: [BEHAVIOR DESCRIPTION]
Current Test Coverage: [✅ Covered | ⚠️ Partial | ❌ Not tested]
Status: [PASS | GAP | MISMATCH | IN_PROGRESS | PENDING]
────────────────────────────────────────
````

## Agent Assignment Prompt Template

```markdown
# Agent Assignment - [Feature Group]

You are working on the **[Project] Overhaul** project. Your assignment is to implement specific features following strict **Test-Driven Development (TDD)** methodology.

### Your Assignment

**Feature Numbers:** `#[NUMBER]` (or `#[N1], #[N2]`)

**Feature Name:** [Feature Name]

### Context

- **Project**: [Project description]
- **Tech Stack**: [Tech stack]
- **Location**: [Project path]
- **Planning Docs**: [Planning docs path]

### Planning Documents

1. **Main Plan**: `[path to plan]`
   - Contains all features with Gherkin scenarios
   - TDD todos for each feature
   - Component design requirements
   - Storybook requirements
   - Feature tracking table
   - **Find Feature #[NUMBER]** for detailed breakdown

2. **Parallelization Strategy**: `[path to parallelization]`
   - Shows dependencies and coordination points

3. **PROTOTYPE (CRITICAL REFERENCE)**: `[path to prototype]`
   - Study this for visual design and patterns
   - **Key components to reference**: [list]

### Your Features

Review the main plan document and locate **Feature #[NUMBER]**. The feature includes:

- **Gherkin Scenario**: Expected behavior description
- **TDD Todos**: Red-Green-Refactor cycles
- **Component Design**: Required components
- **Storybook**: Required stories
- **Status**: Current status in tracking table

### Requirements

[Standard requirements: TDD, Component-Driven, Test Coverage, Storybook, Code Quality]

### Files You'll Create
```

[File structure]

```

### Coordination

[Coordination notes]

### Git Workflow & Hooks (REQUIRED)

[Pre-commit, pre-push, commit guidelines]

### Deliverables

For Feature #[NUMBER], deliver:
1. ✅ **Tests**: All TDD tests passing
2. ✅ **Components**: Fully implemented
3. ✅ **Stories**: Storybook stories
4. ✅ **Documentation**: JSDoc comments
5. ✅ **Status Update**: Feature tracking table updated
```

## Parallelization Stream Template

```markdown
### Stream [N]: [Stream Name] ([X] Agents - [Independence Level])

#### Agent [N]: [Feature Name]

- **Feature #[N]**: [Description]
- **Dependencies**: [List dependencies]
- **Files**:
  - `[file1]` (new)
  - `[file2]` (update)
- **Coordination**: [Coordination notes or "None - completely independent"]

**Integration Point**: [How this integrates with other work]
```

## Gherkin Scenario Patterns

### Display Feature

```gherkin
Feature: [Component] display
  Scenario: Display [element] with [properties]
    Given [initial state]
    When the [component] renders
    Then I should see [element]
    And [element] should have [property]
    And [element] should be [state]
```

### Interaction Feature

```gherkin
Feature: [Component] interaction
  Scenario: [Action] on [element]
    Given [initial state]
    When I [action] on [element]
    Then [element] should [change]
    And [callback] should be triggered
```

### Filter/Search Feature

```gherkin
Feature: [Filter type] filter
  Scenario: Filter by [criteria]
    Given I have [data]
    When I [apply filter]
    Then the [results] should show only [matching items]
    And [empty state] should display when no matches
```

### Expansion Feature

```gherkin
Feature: [Component] expansion
  Scenario: Expand [element] to show [content]
    Given [element] is collapsed
    When I [trigger expansion]
    Then [content] should be visible
    And [animation] should be smooth
    And [content] should align with [reference]
```

## TDD Todo Patterns

### Basic Component

```markdown
- [ ] **RED**: Write failing test `renders [component]`
- [ ] **GREEN**: Add basic component structure
- [ ] **REFACTOR**: Extract to component file
- [ ] **RED**: Write failing test `displays [property]`
- [ ] **GREEN**: Add property display
- [ ] **REFACTOR**: Extract display logic
```

### Component with Interaction

```markdown
- [ ] **RED**: Write failing test `renders [component]`
- [ ] **GREEN**: Add component structure
- [ ] **REFACTOR**: Extract component
- [ ] **RED**: Write failing test `[action] triggers [callback]`
- [ ] **GREEN**: Add event handler
- [ ] **REFACTOR**: Extract handler logic
- [ ] **RED**: Write failing test `[action] updates [state]`
- [ ] **GREEN**: Add state management
- [ ] **REFACTOR**: Extract state logic
```

### Component with Styling

```markdown
- [ ] **RED**: Write failing test `applies [style] when [condition]`
- [ ] **GREEN**: Add conditional styling
- [ ] **REFACTOR**: Extract style logic
- [ ] **RED**: Write failing test `transitions smoothly`
- [ ] **GREEN**: Add transition
- [ ] **REFACTOR**: Extract transition config
```

## Status Values

- **PASS**: Feature complete, tests passing, status updated
- **GAP**: Feature not started, no tests
- **MISMATCH**: Implementation differs from expected behavior
- **IN_PROGRESS**: Work in progress, partial tests
- **PENDING**: Waiting on dependencies

## Test Coverage Values

- **✅ Covered**: All tests passing, comprehensive coverage
- **⚠️ Partial**: Some tests, incomplete coverage
- **❌ Not tested**: No tests written

## Common Feature Areas

- **CORE DISPLAY**: Basic rendering, columns, cells
- **COLUMN SYSTEM**: Selection, expander, actions columns
- **ROW INTERACTIONS**: Click, double-click, hover
- **EXPANSION SYSTEM**: Expanded content, tabs, panels
- **FILTERING**: Search, filters, combined filters
- **SELECTION**: Single, multi, persistence
- **SORTING**: Column sorting, indicators
- **VIRTUALIZATION**: Virtual scrolling, measurement
- **ANCHORED COLUMNS**: Fixed, flexible, resize
- **STICKY COLUMNS**: Left, right, header
- **ACCESSIBILITY**: Keyboard, ARIA, focus
- **PERFORMANCE**: Large datasets, optimization
