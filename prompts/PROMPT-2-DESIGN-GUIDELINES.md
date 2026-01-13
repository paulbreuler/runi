# PROMPT-2 Design Guidelines (HTTPie-Inspired)

**Date:** 2026-01-12  
**Source:** HTTPie Desktop Application + VS Code/Cursor Layout

## Core Design Principles

### 1. Clean & Focused Interface
- **Minimal Chrome:** Reduce visual noise, focus on content
- **High Contrast:** Code/data areas use clear backgrounds and readable text
- **Visual Hierarchy:** Primary actions are prominent, secondary info is subtle

### 2. Subtle Interactions (HTTPie)
- **Hover Effects:** Use `hover:bg-muted/50 transition-colors duration-200`
- **No Pointer Cursor:** Only use `cursor-pointer` on actual links/buttons
- **Smooth Transitions:** 200ms duration, ease-in-out timing
- **Quiet Interface:** Less visual noise, more focus on content

### 3. Color-Coded Elements (HTTPie)
- **HTTP Methods:** GET (green-600), POST (blue-600), PUT (yellow-600), DELETE (red-600), PATCH (purple-600)
- **Status Codes:** 2xx (green), 3xx (blue), 4xx (yellow), 5xx (red)
- **Bold & Confident:** Method names and status codes are prominent

### 4. Performance (HTTPie)
- **Fast Rendering:** Optimize component rendering, use virtual scrolling for large content
- **Smooth Animations:** 60fps, use CSS transforms
- **Quick Feedback:** Immediate visual response to user actions

### 5. Contextual Guidance (HTTPie)
- **Tooltips:** Strategic placement, not intrusive
- **Clear Error Messages:** Actionable guidance, not just "error"
- **Helpful Placeholders:** Guide users on what to do

## Implementation Patterns

### Hover States
```svelte
<!-- Good: Subtle background change -->
<div class="hover:bg-muted/50 transition-colors duration-200">
  Content
</div>

<!-- Bad: Pointer cursor on non-clickable -->
<div class="cursor-pointer"> <!-- Only use on actual links/buttons -->
```

### Color Coding
```svelte
<!-- HTTP Methods -->
const methodColors = {
  GET: 'bg-green-600 hover:bg-green-700 text-white',
  POST: 'bg-blue-600 hover:bg-blue-700 text-white',
  PUT: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  DELETE: 'bg-red-600 hover:bg-red-700 text-white',
  PATCH: 'bg-purple-600 hover:bg-purple-700 text-white',
};

<!-- Status Codes -->
const statusColors = {
  '2xx': 'bg-green-600 text-white',
  '3xx': 'bg-blue-600 text-white',
  '4xx': 'bg-yellow-600 text-white',
  '5xx': 'bg-red-600 text-white',
};
```

### Typography
```svelte
<!-- UI Text -->
<div class="text-sm text-foreground">UI Text</div>

<!-- Code/Data (HTTPie style) -->
<pre class="font-mono text-sm text-foreground bg-muted/30">Code</pre>

<!-- Secondary Text -->
<span class="text-xs text-muted-foreground">Secondary info</span>
```

### Transitions
```svelte
<!-- Smooth state changes -->
<div class="transition-all duration-200 ease-in-out">
  Content
</div>

<!-- Color transitions -->
<button class="transition-colors duration-200">
  Button
</button>
```

## Component-Specific Guidelines

### Request Header
- Method selector: Bold, color-coded, prominent
- URL input: High contrast, clear placeholder
- Send button: Smooth loading animation, clear disabled state

### Status Badge
- Color-coded by status range
- Bold, readable text
- Tooltip on hover (optional)

### Response Viewer
- Monospaced font for all code/data
- High contrast syntax highlighting
- Smooth tab switching
- Collapsible sections with subtle animations

### Headers Table
- Scannable layout (clear separation)
- Truncated values with hover tooltips
- Masked sensitive headers
- Subtle hover effects

## Accessibility

- **High Contrast:** All text is readable (WCAG AA minimum)
- **Focus Indicators:** Clear focus rings on interactive elements
- **Keyboard Navigation:** Logical tab order
- **ARIA Labels:** Proper labels for screen readers
- **Tooltips:** Accessible tooltip implementation

## Performance Targets

- **Component Render:** < 16ms (60fps)
- **Syntax Highlighting:** < 100ms for typical responses
- **Tab Switching:** < 50ms transition
- **Large Responses:** Virtual scrolling for > 10KB responses

## References

- [HTTPie Learnings](./HTTPIE-LEARNINGS.md)
- [VS Code Design Principles](https://code.visualstudio.com/docs/getstarted/userinterface)
- [shadcn-svelte Components](https://www.shadcn-svelte.com/)
