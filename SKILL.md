---
name: runi-design
description: Build UI components and pages following the runi design system. Use this skill when creating Svelte components, pages, or UI elements for runi. Enforces the "clean sketchy" aesthetic—mostly monochrome with strategic color splashes—creating an experience, not just a tool. AI-native design where conversation and intent matter more than clicks.
---

# runi design

This skill guides creation of UI components and pages that follow runi's design system. All components should feel like an **experience**—clean, sketchy, and purposeful—not just another tool.

**IMPORTANT: runi uses semantic CSS variables via Tailwind utility classes.** Always use semantic color tokens (e.g., `bg-background`, `text-foreground`, `bg-card`) to ensure dark mode compatibility and consistent theming.

## Design Philosophy: Clean Sketchy with Strategic Color

runi's design is inspired by **graphite drawings with strategic color splashes**—like a sketch where most of the composition is monochrome, but key elements draw the eye with purposeful color. In the age of AI, we're re-envisioning what user interface means: **less about where you click, more about what you say.**

### The Artistic Vision

Think of a graphite drawing of a dog—mostly black and white shading, except the dog's startling blue eyes that are the only splash of color, drawing your attention. Or lilies where small color accents guide the eye. runi should feel like that: **clean, sketchy, mostly grayscale, with strategic color that matters.**

### Core Principles

- **Clean Sketchy**: Like graphite shading—subtle, textural, purposeful. Mostly grayscale with semantic tones.
- **Strategic Color**: Color is rare and meaningful. Use it for: HTTP methods, status codes, critical feedback, AI interactions, and key actions—not for decoration.
- **Experience Over Tool**: This is an experience, not just a tool. Every element should feel intentional and human.
- **AI-Native**: In the age of AI, UI is conversational. Design for intent and conversation, not just clicking.
- **Quiet & Focused**: Minimal visual noise. High contrast for readability, subtle interactions.

**NOT**: Overuse of color, flashy animations, heavy UI chrome, color for decoration, tool-first thinking

## Color System: Mostly Monochrome, Strategic Splashes

**The Foundation:** Most of runi's interface should be grayscale—using semantic grays for backgrounds, text, borders, and structure. Color is reserved for **meaningful, functional elements** that need to stand out.

### Semantic Colors (Dark Mode Compatible)

Use these Tailwind classes for the **grayscale foundation**—this is your graphite palette:

| Tailwind Class                                   | Usage                           |
| ------------------------------------------------ | ------------------------------- |
| `bg-background` / `text-foreground`              | Page backgrounds, primary text  |
| `bg-card` / `text-card-foreground`               | Cards, elevated surfaces        |
| `bg-muted` / `text-muted-foreground`             | Secondary text, disabled states |
| `bg-primary` / `text-primary-foreground`         | Primary buttons, CTAs           |
| `bg-secondary` / `text-secondary-foreground`     | Secondary buttons               |
| `bg-accent` / `text-accent-foreground`           | Hover states, highlights        |
| `bg-destructive` / `text-destructive-foreground` | Errors, delete actions          |
| `border-border`                                  | Borders, dividers               |
| `bg-input` / `border-input`                      | Form inputs, selectors          |
| `ring-ring`                                      | Focus rings                     |

### Strategic Color: When and Where

Color should be used **sparingly and purposefully**. These are your "blue eyes" moments—elements that need to draw attention and convey meaning:

1. **HTTP Methods** - Semantic, functional (they define what the request does)
2. **Status Codes** - Semantic, functional (they communicate response state)
3. **Critical Feedback** - Errors, warnings (they need immediate attention)
4. **AI Interactions** - Prompts, suggestions, intelligence (this is the "conversation")
5. **Key Actions** - Very sparingly, for primary CTAs only

**Everything else should be grayscale** using semantic tokens.

### HTTP Method Colors (Strategic Splash #1)

HTTP methods get color because they're **functional and semantic**—they communicate meaning:

| Method  | Light Mode                          | Dark Mode                                     |
| ------- | ----------------------------------- | --------------------------------------------- |
| GET     | `bg-green-600 hover:bg-green-700`   | `dark:bg-green-700 dark:hover:bg-green-800`   |
| POST    | `bg-blue-600 hover:bg-blue-700`     | `dark:bg-blue-700 dark:hover:bg-blue-800`     |
| PUT     | `bg-yellow-600 hover:bg-yellow-700` | `dark:bg-yellow-700 dark:hover:bg-yellow-800` |
| PATCH   | `bg-purple-600 hover:bg-purple-700` | `dark:bg-purple-700 dark:hover:bg-purple-800` |
| DELETE  | `bg-red-600 hover:bg-red-700`       | `dark:bg-red-700 dark:hover:bg-red-800`       |
| HEAD    | `bg-gray-600 hover:bg-gray-700`     | `dark:bg-gray-700 dark:hover:bg-gray-800`     |
| OPTIONS | `bg-teal-600 hover:bg-teal-700`     | `dark:bg-teal-700 dark:hover:bg-teal-800`     |

**Always include text-white** for method badges/buttons.

### HTTP Status Code Colors (Strategic Splash #2)

Status codes get color because they're **functional and semantic**—they communicate response state:

| Range | Color                      | Usage         |
| ----- | -------------------------- | ------------- |
| 2xx   | `bg-green-600 text-white`  | Success       |
| 3xx   | `bg-blue-600 text-white`   | Redirects     |
| 4xx   | `bg-yellow-600 text-white` | Client errors |
| 5xx   | `bg-red-600 text-white`    | Server errors |
| Other | `bg-gray-600 text-white`   | Unknown       |

### Strategic Color Guidelines

```svelte
<!-- BAD - using color for decoration -->
<div class="bg-blue-500 text-white"> <!-- Color without purpose -->
<button class="bg-purple-600">Secondary action</button> <!-- Color for non-critical element -->

<!-- BAD - hardcoded colors break dark mode -->
<div class="bg-white text-black">

<!-- GOOD - grayscale foundation -->
<div class="bg-background text-foreground"> <!-- Monochrome -->
<div class="bg-card border border-border"> <!-- Semantic grays -->
<button class="bg-muted hover:bg-muted/80"> <!-- Grayscale interaction -->

<!-- GOOD - strategic color for meaning -->
<span class="bg-green-600 text-white">GET</span> <!-- HTTP method (functional) -->
<span class="bg-red-600 text-white">500</span> <!-- Status code (functional) -->
<div class="bg-destructive/10 border-destructive/20 text-destructive">Error</div> <!-- Critical feedback -->
```

**Key Rule:** When in doubt, use grayscale. Color should feel surprising and meaningful—like a splash of blue in a graphite drawing.

## Typography: Clean and Readable

Typography should support the "clean sketchy" aesthetic—clear, readable, and purposeful. Like graphite shading, text should have subtle variation and clear hierarchy.

```css
/* Code and data (monospaced) */
font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;

/* UI text (system fonts) */
font-family: ui-sans-serif, system-ui, sans-serif;
```

### Type Hierarchy

| Element        | Font      | Weight  | Size      | Usage                    |
| -------------- | --------- | ------- | --------- | ------------------------ |
| Headings       | System    | Medium  | `text-lg` | Section titles           |
| UI Text        | System    | Regular | `text-sm` | Body text, labels        |
| Code/Data      | Monospace | Regular | `text-sm` | Request/response content |
| Secondary Text | System    | Regular | `text-xs` | Metadata, hints          |

### Typography Patterns

```svelte
<!-- UI Text -->
<div class="text-sm text-foreground">UI Text</div>

<!-- Code/Data (always monospaced) -->
<pre class="font-mono text-sm text-foreground bg-muted/30">Code</pre>

<!-- Secondary Text -->
<span class="text-xs text-muted-foreground">Secondary info</span>

<!-- Headings -->
<h3 class="text-lg font-medium text-foreground">Section Title</h3>
```

## Component Architecture

### Import from shadcn-svelte UI Components

Always use components from `src/lib/components/ui/`:

```typescript
import { Button } from '$lib/components/ui/button';
import { Card } from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { Select } from '$lib/components/ui/select';
import { Tabs } from '$lib/components/ui/tabs';
// ... etc
```

Available UI components:

- button, card, input, select, separator, tabs
- (Additional components as needed)

### Button Variants

```typescript
// From button.svelte - use these variants
variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
size: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
```

**Default button style:**

- Rounded corners: `rounded-md`
- Shadow: `shadow-xs`
- Transition: `transition-all`
- Focus ring: `focus-visible:ring-[3px]`

### Card Patterns

- Use `rounded-xl` for larger cards
- Subtle borders: `border border-border`
- Background: `bg-card`
- Shadow: `shadow-sm` (subtle elevation)

## Design Patterns

### Rounded Corners

runi uses consistent border radius:

- Small elements: `rounded-md` (default)
- Cards/containers: `rounded-xl`
- Pill shapes: `rounded-full` (when needed)

### Hover States

```svelte
<!-- Subtle background change (not cursor change) -->
<div class="hover:bg-muted/50 transition-colors duration-200">Content</div>

<!-- Only use cursor-pointer on actual links/buttons -->
<button class="cursor-pointer">Button</button>
```

**Key Rule:** Only use `cursor-pointer` on actual clickable/interactive elements. Use `hover:bg-muted/50` for hover feedback on list items and containers.

### Transitions

Always use smooth transitions for state changes:

```svelte
<!-- Color transitions (200ms) -->
<div class="transition-colors duration-200">Content</div>

<!-- All transitions (200ms) -->
<div class="transition-all duration-200 ease-in-out">Content</div>
```

**Standard duration:** 200ms for smooth, responsive feel.

### Shadows

Use subtle shadows for elevation:

- `shadow-xs` - Buttons, inputs
- `shadow-sm` - Cards, elevated surfaces
- `shadow-md` - Modals, popovers (when needed)

## Layout Guidelines

### Spacing

- Use consistent padding: `p-4`, `p-6`, `p-8`
- Card gaps: `gap-4` or `gap-6`
- Section margins: `my-4`, `my-6`, `my-8`

### Resizable Panes (paneforge)

```svelte
<PaneGroup direction="horizontal" class="flex-1">
  <Pane defaultSize={50} minSize={30}>...</Pane>
  <PaneResizer
    class="w-2 bg-border hover:bg-primary/20 cursor-col-resize transition-colors duration-200"
  />
  <Pane minSize={30}>...</Pane>
</PaneGroup>
```

- Horizontal split: `w-2` width, `cursor-col-resize`
- Vertical split: `h-2` height, `cursor-row-resize`
- Always include `transition-colors duration-200`

### Responsive Patterns

```svelte
<!-- Mobile-first approach (runi is desktop-first, but consider window resizing) -->
<div class="p-4 md:p-6 lg:p-8">
<div class="text-sm md:text-base">
```

## Svelte 5 Patterns

### Use Runes (NOT Stores)

```svelte
<script lang="ts">
  // GOOD - use runes
  let count = $state(0);
  let doubled = $derived(count * 2);

  // BAD - don't use writable() stores
  // import { writable } from 'svelte/store';
  // const count = writable(0);
</script>
```

**Required:**

- `lang="ts"` on all script blocks
- Explicit return types on functions
- Use `$state()`, `$derived()`, `$effect()`, `$props()` (NOT `writable()`)
- Type all props with interfaces

### Component Props

```svelte
<script lang="ts">
  interface Props {
    title: string;
    description?: string;
    class?: string;
  }

  let { title, description, class: className, ...restProps }: Props = $props();
</script>

<div class={cn('base-styles', className)} {...restProps}>
  <h3>{title}</h3>
  {#if description}
    <p>{description}</p>
  {/if}
</div>
```

## Component Construction Patterns

### Building New Components

**1. Start with UI components from `$lib/components/ui/`**

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import { cn } from '$lib/utils';

  interface Props {
    title: string;
    description?: string;
    onAction?: () => void;
  }

  let { title, description, onAction, ...restProps }: Props = $props();
</script>

<Card class={cn('p-6', restProps.class)}>
  <h3 class="text-lg font-medium text-card-foreground mb-2">{title}</h3>
  {#if description}
    <p class="text-sm text-muted-foreground mb-4">{description}</p>
  {/if}
  {#if onAction}
    <Button variant="default" on:click={onAction}>Action</Button>
  {/if}
</Card>
```

**2. Use tailwind-variants for variants**

```svelte
<script lang="ts" module>
  import { tv, type VariantProps } from 'tailwind-variants';
  import { cn } from '$lib/utils';

  export const cardVariants = tv({
    base: 'rounded-xl p-6 transition-all',
    variants: {
      variant: {
        default: 'bg-card border border-border',
        elevated: 'bg-card shadow-md',
        muted: 'bg-muted border border-border',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  });

  export type CardVariant = VariantProps<typeof cardVariants>['variant'];
  export type CardSize = VariantProps<typeof cardVariants>['size'];
</script>
```

### Accessibility Patterns

```svelte
<!-- Always include proper aria attributes -->
<button
  aria-label="Close dialog"
  aria-expanded={isOpen}
  aria-controls="menu-content"
>

<!-- Use semantic HTML -->
<nav aria-label="Main navigation">
<main role="main">
<aside aria-label="Sidebar">

<!-- Focus management (handled by shadcn-svelte components) -->
<Button>Action</Button>
```

### Error Handling

```svelte
<!-- Always display Rust/Tauri errors in UI -->
{#if error}
  <div class="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
    {error}
  </div>
{/if}
```

## Implementation Checklist

1. **Default to grayscale** - Use semantic grays (`bg-background`, `bg-card`, `text-foreground`, `bg-muted`) for most UI
2. **Color is strategic** - Only use color for HTTP methods, status codes, critical feedback, AI interactions, and key actions
3. **Never hardcode colors** - No `bg-white`, `text-black`, `blue-500` (use semantic tokens or strategic color utilities)
4. **Test dark mode** - All components must work in both light and dark modes
5. **Use shadcn-svelte components** - Import from `$lib/components/ui/`
6. **Use Svelte 5 runes** - `$state()`, `$derived()`, `$props()` (NOT `writable()`)
7. **Type everything** - `lang="ts"` on script blocks, explicit types
8. **Smooth transitions** - 200ms duration, `transition-colors` for hover
9. **No pointer cursor on non-clickable** - Only use `cursor-pointer` on actual buttons/links
10. **Monospaced fonts for code/data** - Use `font-mono` for request/response content
11. **Display errors** - Always show Tauri command errors in UI
12. **Design for conversation** - In AI-native features, prioritize conversational flow over traditional UI patterns

## Example Components

### HTTP Method Badge

```svelte
<script lang="ts">
  import { httpMethodColors } from '$lib/utils/http-colors';

  interface Props {
    method: string;
    class?: string;
  }

  let { method, class: className }: Props = $props();

  const colorClass =
    httpMethodColors[method as keyof typeof httpMethodColors] || httpMethodColors.GET;
</script>

<span class={cn('px-2 py-1 rounded-md text-xs font-semibold text-white', colorClass, className)}>
  {method}
</span>
```

### Status Badge

```svelte
<script lang="ts">
  import { getStatusColor } from '$lib/utils/http-colors';
  import { cn } from '$lib/utils';

  interface Props {
    status: number;
    class?: string;
  }

  let { status, class: className }: Props = $props();

  const colorClass = getStatusColor(status);
</script>

<span class={cn('px-2 py-1 rounded-md text-xs font-semibold text-white', colorClass, className)}>
  {status}
</span>
```

### Request Card (Grayscale with Strategic Color)

```svelte
<script lang="ts">
  import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
  import { httpMethodColors } from '$lib/utils/http-colors';
  import { cn } from '$lib/utils';

  interface Props {
    title: string;
    method: string;
    url: string;
    onSend?: () => void;
  }

  let { title, method, url, onSend, ...restProps }: Props = $props();

  // Strategic color: HTTP method gets color (functional/semantic)
  const methodColorClass =
    httpMethodColors[method as keyof typeof httpMethodColors] || httpMethodColors.GET;
</script>

<Card class="p-4 bg-card border-border" {...restProps}>
  <CardHeader>
    <CardTitle class="text-base font-medium text-card-foreground">{title}</CardTitle>
  </CardHeader>
  <CardContent class="flex items-center gap-2">
    <!-- Strategic splash: method color -->
    <span class={cn('px-2 py-1 rounded text-xs font-semibold text-white', methodColorClass)}>
      {method}
    </span>
    <!-- Grayscale: URL (monochrome) -->
    <code class="flex-1 text-sm font-mono text-foreground bg-muted/30 px-2 py-1 rounded">
      {url}
    </code>
    <!-- Grayscale: Button (semantic, not colored) -->
    {#if onSend}
      <Button variant="outline" size="sm" on:click={onSend}>Send</Button>
    {/if}
  </CardContent>
</Card>
```

### AI Interaction (The "Blue Eyes" Moment)

AI prompts and suggestions are where color can shine—this is the conversational, intelligent moment:

```svelte
<script lang="ts">
  interface Props {
    suggestion: string;
    onAccept?: () => void;
  }

  let { suggestion, onAccept, ...restProps }: Props = $props();
</script>

<!-- AI suggestion: subtle color accent for the "conversation" -->
<div class="bg-primary/5 border-primary/20 border rounded-lg p-3">
  <p class="text-sm text-foreground mb-2">{suggestion}</p>
  <!-- Primary action: strategic color -->
  <Button variant="default" size="sm" on:click={onAccept}>Use suggestion</Button>
</div>
```

## Related Documentation

For detailed technical implementation:

- **Design Guidelines**: `prompts/PROMPT-2-DESIGN-GUIDELINES.md`
- **Component Library**: `src/lib/components/ui/`
- **Color Utilities**: `src/lib/utils/http-colors.ts`
- **CSS Variables**: `src/app.css`
- **Tauri Commands**: `src-tauri/src/commands/`
- **Project Structure**: `CLAUDE.md`
