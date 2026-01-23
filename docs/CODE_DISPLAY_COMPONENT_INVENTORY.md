# Code Display Component Inventory

This document provides a comprehensive inventory of all code display components and their usage across the codebase.

## Component Hierarchy

```
CodeSnippet (Public API - Use this for all code display)
  └── CodeBox (Container - Internal use only)
      └── SyntaxHighlighter (Syntax highlighting - Internal use only)

BodyEditor (Special case - Editor pattern)
  └── SyntaxHighlighter (Direct usage - Correct for editor pattern)
```

## Primary Components

### CodeSnippet

**Location**: `src/components/History/CodeSnippet.tsx`

**Purpose**: Unified component for displaying code with syntax highlighting, copy functionality, and consistent styling.

**Features**:

- Syntax highlighting via react-syntax-highlighter
- Copy button with language-specific labels
- Line numbers
- Two variants: `contained` (default) and `borderless`
- Automatic language detection support

**Usage Locations**:

| Component                 | File                                         | Variant      | Language             | Line |
| ------------------------- | -------------------------------------------- | ------------ | -------------------- | ---- |
| ResponseViewer (Body tab) | `src/components/Response/ResponseViewer.tsx` | `borderless` | Auto-detected        | 236  |
| ResponseViewer (Raw tab)  | `src/components/Response/ResponseViewer.tsx` | `borderless` | `http`               | 269  |
| ResponsePanel             | `src/components/History/ResponsePanel.tsx`   | `contained`  | Auto-detected        | 139  |
| CodeGenPanel              | `src/components/History/CodeGenPanel.tsx`    | `contained`  | From LANGUAGE_SYNTAX | 77   |
| HeadersPanel              | `src/components/History/HeadersPanel.tsx`    | `contained`  | `http`               | 111  |
| ConsolePanel (grouped)    | `src/components/Console/ConsolePanel.tsx`    | `borderless` | Auto-detected        | 786  |
| ConsolePanel (individual) | `src/components/Console/ConsolePanel.tsx`    | `borderless` | Auto-detected        | 861  |

**Status**: ✅ **Primary component - Use this everywhere code is displayed**

### CodeBox

**Location**: `src/components/History/CodeBox.tsx`

**Purpose**: Container component providing consistent styling and copy button positioning.

**Features**:

- Copy button positioning (top-right corner)
- Two variants: `contained` and `borderless`
- Scroll handling
- Styling for code containers

**Usage Locations**:

| Component           | File                                         | Purpose            | Status     |
| ------------------- | -------------------------------------------- | ------------------ | ---------- |
| CodeSnippet         | `src/components/History/CodeSnippet.tsx`     | Internal container | ✅ Correct |
| CodeBox.test.tsx    | `src/components/History/CodeBox.test.tsx`    | Test file          | ✅ Correct |
| CodeBox.stories.tsx | `src/components/History/CodeBox.stories.tsx` | Story file         | ✅ Correct |

**Status**: ✅ **Internal component - Only used by CodeSnippet**

### BodyEditor

**Location**: `src/components/Request/BodyEditor.tsx`

**Purpose**: Editable textarea with syntax highlighting overlay (editor pattern).

**Features**:

- Direct SyntaxHighlighter usage (intentional)
- Textarea overlay pattern
- Real-time syntax highlighting
- JSON validation and formatting

**Usage**: Direct SyntaxHighlighter import (line 8)

**Status**: ✅ **Correct - Editor pattern requires direct SyntaxHighlighter usage**

## Compliance Status

### ✅ Compliant Components

1. **ResponseViewer** - Uses CodeSnippet in both body and raw tabs
2. **ResponsePanel** - Uses CodeSnippet with contained variant
3. **CodeGenPanel** - Uses CodeSnippet with contained variant
4. **HeadersPanel** - Uses CodeSnippet with http language (fixed in compliance audit)
5. **BodyEditor** - Correctly uses SyntaxHighlighter directly (editor pattern)

### Indirect Usage (Wrappers)

6. **ResponseTab** - Wraps ResponsePanel (compliant)
7. **CodeGenTab** - Wraps CodeGenPanel (compliant)
8. **HeadersTab** - Wraps HeadersPanel (compliant)

## Variant Usage Guide

### Contained Variant

**Use when**: Code display is standalone (not inside another container with padding)

**Examples**:

- Expanded panels
- History views
- Code generation panels
- Headers panels

**Styling**: Full visual container with background, border, padding, and rounded corners

### Borderless Variant

**Use when**: Code display is inside an existing container with padding

**Examples**:

- ResponseViewer tabs (inside `p-4` container)
- MainLayout panes

**Styling**: Minimal styling without background, border, or rounded corners

## Language Detection

### Auto-Detection

Components that auto-detect language:

- **ResponseViewer** (body tab) - Uses `detectSyntaxLanguage()` based on content-type and body content
- **ResponsePanel** - Uses `detectSyntaxLanguage()` based on body content

### Explicit Language

Components that use explicit language:

- **ResponseViewer** (raw tab) - Uses `language="http"`
- **CodeGenPanel** - Uses language from `LANGUAGE_SYNTAX` mapping
- **HeadersPanel** - Uses `language="http"`

## Direct SyntaxHighlighter Usage Audit

**Allowed Locations**:

- ✅ `src/components/History/CodeSnippet.tsx` - Internal usage (correct)
- ✅ `src/components/Request/BodyEditor.tsx` - Editor pattern (correct)

**No other direct usage found** ✅

## Direct CodeBox Usage Audit

**Allowed Locations**:

- ✅ `src/components/History/CodeSnippet.tsx` - Internal usage (correct)
- ✅ `src/components/History/CodeBox.test.tsx` - Test file (correct)
- ✅ `src/components/History/CodeBox.stories.tsx` - Story file (correct)

**No other direct usage found** ✅

## Test Coverage

All code display components have comprehensive test coverage:

- ✅ `CodeSnippet.test.tsx` - 8 tests
- ✅ `CodeBox.test.tsx` - 6 tests
- ✅ `ResponseViewer.test.tsx` - 15 tests
- ✅ `ResponsePanel.test.tsx` - 7 tests
- ✅ `HeadersPanel.test.tsx` - 8 tests
- ✅ `HeadersTab.test.tsx` - 5 tests

## Migration Notes

### Removed Components

- **BodyViewer** - Removed (dead code, replaced by CodeSnippet)

### Updated Components

- **HeadersPanel** - Updated from CodeBox + `<pre><code>` to CodeSnippet with HTTP syntax highlighting

## Best Practices

1. **Always use CodeSnippet** for code display (except BodyEditor which is an editor)
2. **Use contained variant** for standalone displays
3. **Use borderless variant** when inside containers with padding
4. **Auto-detect language** when possible using `detectSyntaxLanguage()`
5. **Use explicit language** for known formats (e.g., `http` for headers)
6. **Never use CodeBox directly** outside of CodeSnippet
7. **Never use SyntaxHighlighter directly** outside of CodeSnippet or BodyEditor

## Last Updated

2026-01-23 - Code Display Compliance Audit completed
