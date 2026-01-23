# Code Display Legacy Components Audit

This document identifies all legacy code display components that need to be migrated to CodeSnippet.

## Primary UI Components (Outside Expanded Panel)

### ConsolePanel - Log Arguments Display

**File**: `src/components/Console/ConsolePanel.tsx`

**Issue**: Uses plain `<pre>` tags to display log arguments without syntax highlighting or copy functionality.

**Locations**:

1. **Grouped Logs - Args Display** (lines 786-795)

   ```tsx
   <div className="mb-1 text-xs font-mono text-text-secondary">
     <pre className="whitespace-pre-wrap break-words overflow-x-auto">
       {typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)}
     </pre>
   </div>
   ```

2. **Individual Logs - Args Display** (lines 861-870)
   ```tsx
   <div className="mb-1 text-xs font-mono text-text-secondary">
     <pre className="whitespace-pre-wrap break-words overflow-x-auto">
       {typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2)}
     </pre>
   </div>
   ```

**Current Behavior**:

- Displays log arguments as plain text
- JSON is stringified with 2-space indentation
- No syntax highlighting
- No copy button
- Uses `font-mono` class for monospace font

**Recommended Fix**:

- Replace with `CodeSnippet` component
- Detect language: if `arg` is a string, try to detect language; if object, use `json`
- Use `borderless` variant (inside existing container with padding)
- Enable copy functionality for log arguments

**Implementation Notes**:

- Log arguments can be strings, objects, or other types
- Objects are stringified with `JSON.stringify(arg, null, 2)`
- Strings might be JSON, code, or plain text
- Should detect language automatically using `detectSyntaxLanguage()`

## Summary

### Components Requiring Migration

**Status**: ✅ **All components migrated**

### Components Already Compliant

- ✅ ResponseViewer - Uses CodeSnippet
- ✅ ResponsePanel - Uses CodeSnippet
- ✅ CodeGenPanel - Uses CodeSnippet
- ✅ HeadersPanel - Uses CodeSnippet (recently fixed)
- ✅ ConsolePanel - Uses CodeSnippet (migrated)
- ✅ BodyEditor - Correctly uses SyntaxHighlighter (editor pattern)

## Migration Plan

### Step 1: Update ConsolePanel Log Arguments

1. Import `CodeSnippet` and `detectSyntaxLanguage` in ConsolePanel
2. Create helper function to format and detect language for log arguments:
   ```tsx
   const formatLogArg = (arg: unknown): { code: string; language: string } => {
     const code = typeof arg === 'string' ? arg : JSON.stringify(arg, null, 2);
     const language = typeof arg === 'string' ? detectSyntaxLanguage({ body: code }) : 'json';
     return { code, language };
   };
   ```
3. Replace both `<pre>` usages with `CodeSnippet`
4. Use `borderless` variant (inside existing container)
5. Update tests to verify CodeSnippet is used

### Step 2: Test Updates

- Update `ConsolePanel.test.tsx` to verify CodeSnippet usage
- Verify copy functionality works for log arguments
- Verify syntax highlighting is applied correctly

### Step 3: Verify No Other Legacy Usage

- Search for other `<pre>` tags displaying code/data
- Search for other `font-mono` usage with code-like content
- Verify all code display uses CodeSnippet

## Migration Status

✅ **COMPLETED** - ConsolePanel migration completed on 2026-01-23

### Completed Steps

1. ✅ Imported `CodeSnippet` and `detectSyntaxLanguage` in ConsolePanel
2. ✅ Created `formatLogArg` helper function for language detection
3. ✅ Replaced both `<pre>` usages with `CodeSnippet` (borderless variant)
4. ✅ Updated tests to work with CodeSnippet syntax highlighting
5. ✅ All tests passing (35 tests)

## Expected Outcomes

1. ✅ All log arguments displayed with syntax highlighting
2. ✅ Copy functionality available for log arguments
3. ✅ Consistent code display across entire application
4. ✅ No plain `<pre>` tags for code display (except in BodyEditor which is an editor, and CodeBox which is the container component)
