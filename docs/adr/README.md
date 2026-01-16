# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the runi project.

## What is an ADR?

An ADR captures a single architectural decision along with its context and consequences. ADRs provide a historical record of why significant technical decisions were made, helping current and future contributors understand the reasoning behind the codebase's architecture.

## Format

We use a hybrid format based on [Michael Nygard's ADR template](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) with elements from [MADR](https://adr.github.io/madr/):

```markdown
# ADR-NNNN: Title

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXXX

## Context

The forces at play and the problem being addressed.

## Decision

"We will..." - the change being made.

## Considered Options

Alternative approaches evaluated with pros/cons.

## Consequences

What becomes easier or harder as a result.

## References

Links to relevant resources.
```

## ADR Index

| ADR                                          | Title                             | Status   | Date       |
| -------------------------------------------- | --------------------------------- | -------- | ---------- |
| [0001](0001-migrate-from-svelte-to-react.md) | Migrate from Svelte 5 to React 19 | Accepted | 2026-01-14 |

## Creating a New ADR

1. Copy the template structure from an existing ADR
2. Use the next sequential number: `NNNN-short-title.md`
3. Set status to `Proposed` until team agreement
4. Update the index table above
5. Reference any superseded ADRs or decisions

## When to Write an ADR

Write an ADR for decisions that:

- Are architecturally significant (framework choices, data storage, API design)
- Have long-term consequences
- Were contentious or required significant research
- Supersede previous decisions

For smaller tactical decisions, use `docs/DECISIONS.md` instead.

## References

- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) - Michael Nygard
- [MADR](https://adr.github.io/madr/) - Markdown Any Decision Records
- [ADR GitHub Organization](https://adr.github.io/)
- [AWS ADR Best Practices](https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/)
