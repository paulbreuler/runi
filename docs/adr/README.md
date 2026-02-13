# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the runi project.

## What is an ADR?

An ADR captures a single architectural decision along with its context and consequences. ADRs provide a historical
record of why significant technical decisions were made, helping current and future contributors understand the
reasoning behind the codebase's architecture.

## Format

We use a hybrid format based on [Michael Nygard's ADR template][nygard] with elements from [MADR][madr]:

[nygard]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
[madr]: https://adr.github.io/madr/

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

Sorted chronologically (newest first).

_Previously defined ADRs (for example ADR-0001) have been archived or removed from this repository.
There are currently no active ADRs listed._

_Add new entries here as ADRs are created._

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

- [Documenting Architecture Decisions][nygard-ref] - Michael Nygard

[nygard-ref]: https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions

- [MADR](https://adr.github.io/madr/) - Markdown Any Decision Records
- [ADR GitHub Organization](https://adr.github.io/)
- [AWS ADR Best Practices][aws-adr]

[aws-adr]: https://aws.amazon.com/blogs/architecture/master-architecture-decision-records-adrs-best-practices-for-effective-decision-making/
