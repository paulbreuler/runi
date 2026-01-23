# Agent: Code Display Unification

## Scope

Features: #1
Own: `src/components/Response/ResponseViewer.tsx`
Depend on: None

## Interfaces

### Export (others need these)

```typescript
// No new exports - using existing CodeSnippet component
```

### Receive (you need these)

```typescript
// #1 - CodeSnippet component ✅ READY
import { CodeSnippet } from '@/components/History/CodeSnippet';
// Props: { code: string; language: string; className?: string }
```

## Features

### #1: Unify ResponseViewer Code Display

**TL;DR**: Replace direct SyntaxHighlighter usage in ResponseViewer body and raw tabs with CodeSnippet component for consistent styling and copy functionality.

Status: `GAP` | Test IDs: `response-body`, `response-raw`, `code-snippet`

Files:

- `src/components/Response/ResponseViewer.tsx` (modify)

TDD:

1. `body tab uses CodeSnippet` → replace SyntaxHighlighter with CodeSnippet → verify copy button appears
2. `raw tab uses CodeSnippet` → replace SyntaxHighlighter with CodeSnippet → verify copy button appears
3. `existing tests pass` → run tests → fix any broken assertions

Gotchas:

- ResponseViewer has custom padding (`p-4`) - CodeSnippet handles its own container, may need adjustment
- CodeSnippet wraps in CodeBox which has its own styling - ensure visual consistency
- Copy button should copy formatted body/raw text, not original

## Done Checklist

- [ ] All TDD cycles pass
- [ ] CodeSnippet used in both body and raw tabs
- [ ] Copy functionality works correctly
- [ ] Visual consistency maintained
- [ ] Existing tests pass
- [ ] Test IDs implemented correctly
