# HTTPie UI/UX Learnings for runi

**Date:** 2026-01-12  
**Source:** HTTPie Desktop Application Analysis

## Key Design Principles from HTTPie

### 1. Clean and Focused Interface
- **Reduced Clutter:** Minimal chrome, focus on content
- **Improved Contrast:** Better readability, especially for code/data
- **Quiet Interactions:** Subtle hover effects, avoid pointer cursors on non-link elements
- **Visual Hierarchy:** Clear distinction between primary and secondary actions

**Application to runi:**
- Use subtle hover states (background color changes, not cursor changes)
- High contrast for code/data areas (monospaced fonts, clear backgrounds)
- Minimal borders and dividers (use spacing and subtle backgrounds instead)

### 2. Color-Coded Elements
- **HTTP Methods:** Distinct colors for GET, POST, PUT, DELETE, PATCH
- **Status Codes:** Color-coded by status range (2xx, 4xx, 5xx)
- **Thematic Consistency:** "Pie theme" provides unified look across app

**Application to runi:**
- Method dropdown: GET (green), POST (blue), PUT (yellow), DELETE (red), PATCH (purple)
- Status badges: 2xx (green), 3xx (blue), 4xx (yellow), 5xx (red)
- Consistent color palette across all components

### 3. Intuitive Syntax and Readability
- **Mirrors HTTP Structure:** Interface reflects actual HTTP request format
- **Readable Format:** Easy to scan and understand at a glance
- **Reduced Learning Curve:** Familiar patterns for developers

**Application to runi:**
- Request builder should visually mirror HTTP request structure
- Headers, body, params organized like actual HTTP requests
- Clear visual separation between request components

### 4. Contextual Feedback and Guidance
- **Tooltips:** Strategic placement for additional information
- **Confirmation Modals:** Contextually informative for sensitive actions
- **Visual Feedback:** Immediate response to user actions

**Application to runi:**
- Tooltips on method selector explaining each HTTP method
- Tooltips on status codes explaining what they mean
- Hover states show additional details (timing breakdown, header values)
- Clear error messages with actionable guidance

### 5. IDE-like Features
- **Variable Autocomplete:** Smart suggestions as you type
- **Interactive References:** Click to navigate, explore
- **Refactoring Tools:** Easy to modify and reuse requests

**Application to runi:**
- URL autocomplete from history/collections
- Variable autocomplete in environment contexts
- Clickable references (e.g., click status code to see details)
- Easy request duplication and modification

### 6. Performance and Responsiveness
- **Fast Startup:** 30-50% faster startup times
- **Quick Response Decoding:** 30% faster response processing
- **Responsive UI:** No lag or freezing during operations

**Application to runi:**
- Optimize component rendering (lazy load, virtual scrolling)
- Fast response display (streaming for large responses)
- Smooth animations (60fps, use CSS transforms)

### 7. Simplified Interactions
- **Subtle Hover Effects:** Background color changes, not cursor changes
- **Regular Cursors:** Only use pointer cursor for actual links/buttons
- **Reduced Visual Noise:** Less emphasis on non-interactive elements

**Application to runi:**
- Hover states: `hover:bg-muted/50` instead of `cursor-pointer` on non-clickable areas
- Only interactive elements get pointer cursor
- Subtle transitions (200ms, ease-in-out)

### 8. Consistent Design System
- **Unified Code Style:** Consistent patterns across all components
- **Extended Product Palette:** Cohesive color scheme
- **Design Tokens:** Reusable spacing, typography, colors

**Application to runi:**
- Use shadcn-svelte design tokens consistently
- Define custom tokens for HTTP method colors
- Consistent spacing scale (4px base: 4, 8, 12, 16, 24, 32)
- Consistent typography scale (monospace for code, sans for UI)

## Specific UI Patterns

### Method Selector
- **Color-coded:** Each method has distinct color
- **Bold/Confident:** Method name is prominent
- **Quick Access:** Dropdown is fast and responsive

### Status Display
- **Color-coded Badges:** Immediate visual feedback
- **Status Text:** Human-readable alongside code
- **Hover Details:** Show timing breakdown on hover

### Request/Response Areas
- **High Contrast:** Clear background for code
- **Monospaced Fonts:** Code/data in monospace
- **Syntax Highlighting:** JSON, XML, etc. properly highlighted
- **Line Numbers:** Optional, for large responses

### Headers Display
- **Collapsible:** Can expand/collapse sections
- **Sortable:** Click to sort by name or value
- **Truncated Values:** Long values truncated with ellipsis
- **Hover to See Full:** Tooltip shows complete value

## Implementation Guidelines

### Colors (HTTPie-inspired)
```css
/* HTTP Methods */
GET:    green-600  (bg-green-600 text-white)
POST:   blue-600   (bg-blue-600 text-white)
PUT:    yellow-600 (bg-yellow-600 text-white)
DELETE: red-600    (bg-red-600 text-white)
PATCH:  purple-600 (bg-purple-600 text-white)

/* Status Codes */
2xx: green-600
3xx: blue-600
4xx: yellow-600
5xx: red-600
```

### Interactions
- **Hover:** `hover:bg-muted/50 transition-colors duration-200`
- **Active:** `active:bg-muted/70`
- **Focus:** `focus-visible:ring-2 focus-visible:ring-primary`
- **Disabled:** `opacity-50 cursor-not-allowed`

### Typography
- **UI Text:** System font stack (system-ui, -apple-system, sans-serif)
- **Code/Data:** Monospace (ui-monospace, 'Courier New', monospace)
- **Sizes:** text-xs (12px), text-sm (14px), text-base (16px)

### Spacing
- **Tight:** p-2 (8px) - compact areas
- **Normal:** p-4 (16px) - standard padding
- **Loose:** p-6 (24px) - spacious areas

## References

- [HTTPie Desktop Documentation](https://httpie.io/docs/desktop)
- [HTTPie Blog - Design Updates](https://httpie.io/blog)
- [HTTPie GitHub](https://github.com/jdx/httpie)
