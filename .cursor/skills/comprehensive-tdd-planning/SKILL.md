---
name: comprehensive-tdd-planning
description: Create comprehensive TDD plans for refactoring, overhaul, or feature implementation projects with Gherkin scenarios, feature tracking, parallelization analysis, and agent assignment prompts. Use when planning refactors (changing code without behavior change), overhauls (major restructuring), feature implementations (new functionality), or combinations that require strict TDD methodology and parallel agent coordination.
---

# Comprehensive TDD Planning

This skill guides creation of comprehensive TDD plans for large refactoring or overhaul projects, enabling parallel agent work with strict quality gates.

## When to Use

- **Refactoring**: Changing existing code structure without changing behavior
- **Overhauling**: Major restructuring or rewrite of existing systems
- **Feature Implementation**: Adding new functionality (single or multiple features)
- **Combinations**: Overhauls with new features, refactors that enable features, etc.
- Breaking down work into testable, trackable components
- Coordinating multiple agents working in parallel
- Ensuring complete test coverage and documentation
- Managing complex implementations with dependencies

## Work Type Distinctions

### Refactor

- **Goal**: Improve code structure without changing behavior
- **Focus**: Code quality, maintainability, performance
- **Tests**: Ensure behavior is preserved
- **Naming**: `[project]_refactor_[id].plan.md`
- **May include**: New features enabled by refactor

### Overhaul

- **Goal**: Major restructuring or rewrite
- **Focus**: New architecture, breaking changes, migration
- **Tests**: New behavior, migration paths
- **Naming**: `[project]_overhaul_[id].plan.md`
- **May include**: New features as part of overhaul

### Feature Implementation

- **Goal**: Add new functionality
- **Focus**: New features, integration points
- **Tests**: New behavior, edge cases
- **Naming**: `[project]_features_[id].plan.md`
- **May include**: Refactoring to support features

### Combination

- **Primary Type**: Determine main goal (refactor/overhaul/feature)
- **Secondary Types**: Note additional work types included
- **Naming**: Use primary type (e.g., `overhaul` if overhaul with features)
- **Plan Structure**: Adjust based on primary type

## Core Methodology

### 1. Feature Breakdown

Break down the project into discrete, testable features. Each feature should have:

- **Feature Number**: Unique identifier (#1, #2, etc.)
- **Feature Name**: Clear, descriptive name
- **Gherkin Scenario**: Behavior-driven description
- **TDD Todos**: Red-Green-Refactor cycles
- **Component Design**: Required components
- **Storybook**: Required stories
- **Status Tracking**: Current status (PASS/GAP/MISMATCH/IN_PROGRESS)

### 2. Gherkin Scenarios

Each feature needs a Gherkin-style scenario describing expected behavior:

```gherkin
Feature: [Feature Name]
  Scenario: [Specific behavior]
    Given [initial state]
    When [action]
    Then [expected outcome]
    And [additional expectations]
```

### 3. TDD Structure

For each feature, define TDD cycles:

- **RED**: Write failing test first
- **GREEN**: Minimum code to pass
- **REFACTOR**: Improve while tests stay green

Never skip the RED phase.

### 4. Feature Tracking Table

Create a tracking table following this format:

```
────────────────────────────────────────
#: [NUMBER]
Feature: [FEATURE NAME]
Expected Behavior: [BEHAVIOR DESCRIPTION]
Current Test Coverage: [✅ Covered | ⚠️ Partial | ❌ Not tested]
Status: [PASS | GAP | MISMATCH | IN_PROGRESS | PENDING]
────────────────────────────────────────
```

### 5. Parallelization Analysis

Identify:

- **Prerequisites**: Features that must complete first
- **Independent Features**: Can work in parallel
- **Dependencies**: Features that depend on others
- **Coordination Points**: Shared files or integration points
- **Agent Assignments**: Which agent works on which features

### 6. Agent Assignment Prompts

Create customized prompts for each agent with:

- Specific feature numbers
- Prototype/reference documents
- Files to create
- Dependencies
- Git workflow requirements
- Deliverables checklist

## Plan Document Structure

### Main Plan Document

1. **Overview**: Project context and goals
2. **Feature Breakdown**: All features with Gherkin scenarios
3. **Implementation Order**: Suggested sequence
4. **Feature Tracking Table**: Status and coverage
5. **Storybook Requirements**: Stories needed
6. **Documentation Requirements**: Docs needed

### Parallelization Document

1. **Prerequisites**: Must-complete-first features
2. **Parallel Work Streams**: Independent feature groups
3. **Coordination Points**: Shared files and integration
4. **Agent Assignments**: Who works on what
5. **Risk Mitigation**: Merge conflicts, dependencies

### Agent Prompts

1. **Assignment**: Feature numbers
2. **Context**: Project and tech stack
3. **Planning Documents**: References
4. **Requirements**: TDD, components, tests, stories
5. **Files to Create**: Specific file paths
6. **Coordination**: Dependencies and shared files
7. **Git Workflow**: Pre-commit/pre-push hooks
8. **Deliverables**: Checklist

## Best Practices

### Feature Granularity

- **Too Large**: Hard to test, track, and parallelize
- **Too Small**: Overhead outweighs benefit
- **Just Right**: Single, testable behavior with clear boundaries

### Gherkin Scenarios

- Focus on **behavior**, not implementation
- Use **specific examples** (not abstract)
- Include **edge cases** and **error states**
- Make **testable** (can write a test for it)

### TDD Todos

- Break into **small, incremental steps**
- Each step should be **independently testable**
- Include **refactoring** steps explicitly
- Consider **integration** and **accessibility** tests

### Parallelization

- **Maximize independence**: Prefer features with no dependencies
- **Minimize coordination**: Reduce shared file conflicts
- **Clear boundaries**: Each agent owns specific files
- **Integration points**: Plan how independent work integrates

### Status Tracking

- **Update frequently**: As work progresses
- **Be specific**: Note what's tested, what's not
- **Track deviations**: Document when behavior differs from plan
- **Implementation notes**: Add notes about decisions made

## Example Structure

File naming based on work type:

```
.cursor/plans/
├── [project]_[type]_[id].plan.md              # Main plan
│   # Types: refactor, overhaul, features
├── [project]_[type]_parallelization.md         # Parallelization
├── agent_assignment_prompt_template.md         # Template
└── agent_[feature_group]_[number].md           # Agent prompts
```

**Examples:**

- Refactor: `datagrid_refactor_abc123.plan.md`
- Overhaul: `datagrid_overhaul_abc123.plan.md`
- Features: `auth_features_abc123.plan.md`
- Combination: Use primary type (e.g., `overhaul` if overhaul with features)

## Integration with Git Workflow

### Pre-Commit Hooks

- Format and lint staged files
- Agents commit only their changes
- Prevents committing other agents' work

### Pre-Push Hooks

- Full validation (format, lint, type check, tests)
- Agents run `just ci` before pushing
- Ensures quality gates pass

### Commit Messages

Format: `feat(scope): #[number] [brief description]`

Example: `feat(datagrid): #19 implement timing tab with waterfall visualization`

## Deliverables Checklist

For each feature:

- ✅ Tests: All TDD tests passing
- ✅ Components: Fully implemented
- ✅ Stories: Storybook stories with demos
- ✅ Documentation: JSDoc comments
- ✅ Status Update: Feature tracking table updated

## References

- Main plan document: Contains all features with full details
- Parallelization document: Shows dependencies and coordination
- Prototype documents: Visual and structural references
- Agent prompts: Specific assignments for each agent

## Key Principles

1. **Test-First**: Every feature starts with a failing test
2. **Component-Driven**: Build in Storybook first
3. **Track Everything**: Feature table shows progress
4. **Enable Parallelism**: Maximize independent work
5. **Quality Gates**: Pre-commit and pre-push hooks enforce quality
6. **Clear Boundaries**: Each agent owns specific files
7. **Documentation**: JSDoc, stories, and tracking keep knowledge accessible
