# Agent: Stories Verification for Code Display Unification

## Scope

Features: Code Display Unification Stories
Own: Story files for CodeBox and CodeSnippet components
Depend on: CodeBox, CodeSnippet, CopyButton components

## Interfaces

### Export (others need these)

```typescript
// No new exports - verifying existing stories
```

### Receive (you need these)

```typescript
// CodeBox component ✅ READY
import { CodeBox } from '@/components/History/CodeBox';
// CodeSnippet component ✅ READY
import { CodeSnippet } from '@/components/History/CodeSnippet';
// CopyButton component ✅ READY
import { CopyButton } from '@/components/History/CopyButton';
```

## Features

### Stories Verification

**TL;DR**: Verify and enhance Storybook stories for CodeBox and CodeSnippet components with play functions for copy button interactions, keyboard navigation, and accessibility testing.

Status: `GAP` | Files: `CodeBox.stories.tsx`, `CodeSnippet.stories.tsx`

Files:

- `src/components/History/CodeBox.stories.tsx` (verify and enhance)
- `src/components/History/CodeSnippet.stories.tsx` (verify and enhance)

Verification Checklist:

1. ✅ Stories exist for both components
2. ❌ Play functions for copy button interactions
3. ❌ Keyboard navigation tests
4. ❌ Accessibility verification
5. ❌ Variant comparison stories have proper testing

Requirements:

- All stories must have play functions (per Storybook best practices)
- Test copy button functionality (click, feedback, reset)
- Test keyboard navigation (Tab to copy button, Enter to activate)
- Verify accessibility (ARIA labels, focus management)
- Follow patterns from `CopyButton.stories.tsx`
- Use `data-test-id` attributes for test selectors
- Use testing utilities from `@/utils/storybook-test-helpers`

Gotchas:

- CodeSnippet currently has `test: { skip: true }` - should be removed and play functions added
- Copy button is nested inside CodeBox, need to test through parent component
- Clipboard API may fail in test environment - handle gracefully
- Both components support `contained` and `borderless` variants - test both

## Done Checklist

- [ ] CodeBox stories have play functions
- [ ] CodeSnippet stories have play functions
- [ ] Copy button interactions tested
- [ ] Keyboard navigation tested
- [ ] Accessibility verified
- [ ] Variant comparison stories tested
- [ ] All stories follow Storybook best practices
- [ ] Test IDs used correctly
