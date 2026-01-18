# Design Ideology: Craftsmanship & Custom Component Library

## Introduction

This document formalizes runi's component design philosophy, emphasizing craftsmanship, custom component library development, and the Unreal Engine metaphor—thinking like game engine developers who craft well-designed, performant solutions with absolute clarity.

**Core Principle:** If a component doesn't exist in a library that perfectly fits our design system, we design it ourselves as craftsmen and artists. We build our own custom component library that integrates seamlessly with runi's design system.

---

## The Unreal Engine Metaphor

**Not about gamification—about craftsmanship.**

Think like game engine developers at Unreal Engine:

- **Craftsmanship**: Every component is intentionally designed, not assembled from generic parts
- **Performance**: React frontend on Rust backend—components must be performant, not just functional
- **Clarity**: Components work with absolute clarity—no ambiguity, no confusion
- **Well-Designed Solutions**: Every interaction feels intentional, crafted, and polished

Game engines don't use generic UI libraries—they craft their own systems that fit perfectly within their architecture. We do the same.

**The Philosophy:**

- We're not building a game, but we're building with the same attention to detail
- Every component should feel like a well-designed solution, not a compromise
- Performance and clarity are non-negotiable
- Beauty emerges from intentional design, not decoration

---

## Component Library Philosophy

### Custom Components, Not External Libraries

**Rule:** If a component doesn't exist in a library that perfectly fits our design system, we build it ourselves.

**Why:**

- External UI libraries often come with design decisions that don't align with our zen, calm, book-like aesthetic
- Generic components require workarounds and overrides to fit our design system
- Custom components integrate seamlessly with our design system from the ground up
- We maintain full control over performance, accessibility, and behavior

**What We Build:**

- Components that fit perfectly within runi's design system
- Components that respect our color philosophy (grayscale foundation, strategic color)
- Components that follow our motion patterns (semantic, unified, no tricks)
- Components that perform well on React + Rust stack

**What We Don't Do:**

- Import entire UI libraries (Material-UI, Ant Design, Chakra UI, etc.)
- Use generic components that require extensive customization
- Compromise on design system alignment for convenience
- Accept "good enough" when we can craft "perfect"

### Design System Integration

Every component must fit within runi's design system:

**Visual Tone:**

- Zen, calm, and book-like
- Muted surfaces, soft contrast, selective emphasis
- Color as signal, not decoration

**Brand Identity:**

- German Shepherd: vigilant, protective, nose to the ground
- Ambient intelligence through subtle signals
- Deep inspection, tracking changes over time
- Acting decisively with clear paths forward

**Color Philosophy:**

- Grayscale foundation for most UI
- Strategic color for HTTP methods, status codes, signals, AI interactions
- Semantic color tokens (dark mode compatible)
- Never hardcode colors

See `.cursor/skills/runi-design/SKILL.md` for complete design system reference.

---

## Development Standards

### Storybook Required

**Every component must have a Storybook story.**

Storybook serves multiple purposes:

- **Visual Documentation**: Show component states and variations
- **Testing & Analysis**: Manual interaction testing (drag, resize, click)
- **Design Review**: Visual verification of design system alignment
- **Isolation**: Test components in isolation without full app context

**Story Requirements:**

- At least one story showing the default state
- Stories for key variations (loading, error, empty states)
- Stories demonstrating interactions (hover, click, drag)
- Brief JSDoc comments explaining each story's purpose

**Story Naming:**

- `Default` - basic component with default props
- `WithContent` - component with realistic content
- `[StateName]` - specific state (e.g., `Loading`, `Error`, `Collapsed`)
- `FullIntegration` - component with real child components

**Story Best Practices:**

- Keep stories minimal and focused (1 concept per story)
- Use `play` functions only for basic verification assertions
- Don't duplicate unit test coverage in stories
- Limit to 6-8 stories per component (see `CLAUDE.md` Storybook section)

### Performance First

**React frontend on Rust backend—components must be performant.**

**Performance Requirements:**

- Use hardware-accelerated properties (`transform`, `opacity`) for animations
- Avoid layout thrashing (don't animate `width`, `height`, `flex` directly)
- Cache measurements using ResizeObserver or refs
- Use MotionValues for continuous updates (drag operations)
- Commit to React state only when necessary (not on every drag frame)

**Motion Performance:**

- Import from `motion/react` (Motion 12)
- Use `layout="position"` instead of full `layout` when possible
- Avoid too many ancestors observing layout changes
- Test across browsers (Chrome, Safari, Firefox)

See `docs/MOTION_BEST_PRACTICES.md` for detailed performance guidelines.

### Beauty and Clarity

**Components should be beautiful, clear, and work with absolute clarity.**

**Clarity Requirements:**

- No ambiguity in component behavior
- Clear visual hierarchy
- Obvious affordances (what's clickable, what's not)
- Semantic HTML and proper ARIA attributes

**Beauty Requirements:**

- Intentional design, not decoration
- Unified material feel (see below)
- Smooth, semantic animations
- Respect design system (zen, calm, muted by default)

**Accessibility:**

- Proper ARIA attributes
- Semantic HTML (`<nav>`, `<main>`, `<aside>`)
- Focus management with proper tabIndex
- Keyboard navigation support
- Screen reader compatibility

### Test-Driven Development

**TDD is mandatory: RED → GREEN → REFACTOR**

**Test Requirements:**

- Write failing tests first
- Implement minimum code to pass
- Refactor while tests stay green
- Test coverage ≥85% for new code

**Test Organization:**

- Component tests adjacent to components (`Component.test.tsx`)
- Unit tests for utilities (`utility.test.ts`)
- E2E tests in `tests/e2e/`

---

## Unified Material Feel

### Single Forged Piece

**Components should feel like unified materials, not separate pieces.**

The collapsed Tray is the perfect example: it should feel like a single forged piece—a book's page edge that invites you to pull. Not two components interacting differently, but ONE unified material that responds as a whole.

**Principles:**

1. **ONE motion.div** — the entire component state is a single element
2. **Variants orchestrate everything** — position, opacity, background all animate together
3. **No separate inner hover states** — content is "etched" into the surface
4. **Subtle depth** — shadow or subtle glow on hover creates dimensionality
5. **Book-edge metaphor** — like gripping a page to turn it

### Motion Variants Pattern

**Use Motion variants to orchestrate animations together.**

```tsx
// Define variants OUTSIDE the component for clean orchestration
const componentVariants = {
  rest: {
    y: 0,
    backgroundColor: 'var(--color-bg-surface)',
    boxShadow: '0 0 0 0 rgba(0,0,0,0)',
  },
  hover: {
    y: -2,
    backgroundColor: 'var(--color-bg-elevated)',
    boxShadow: '0 -4px 12px -4px rgba(0,0,0,0.3)',
  },
};

const contentVariants = {
  rest: { opacity: 0.4 },
  hover: { opacity: 0.8 },
};

const springConfig = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

// Component implementation
<motion.div
  variants={componentVariants}
  initial="rest"
  whileHover="hover"
  transition={springConfig}
>
  <motion.div variants={contentVariants}>
    {/* Content inherits hover state from parent */}
  </motion.div>
</motion.div>;
```

**Key Benefits:**

- All animations orchestrate together (perfect sync)
- No disconnected hover states
- Clean, maintainable code
- Semantic motion (every motion has meaning)

### Semantic Motion

**Every motion has semantic meaning.**

Motion should communicate intent, not just look pretty:

- **"Pulling page edge"** — slight lift on hover suggests pulling toward you
- **"Opening drawer"** — slide animation suggests depth and reveal
- **"Focusing attention"** — subtle scale suggests importance
- **"Dismissing"** — fade and slide out suggests removal

**Animation Timing (per design guidelines):**

- Hover transitions: 100ms (fast tier)
- Spring: stiffness 400, damping 30 (snappy but not bouncy)
- No bounces or wiggles (forbidden per design system)
- Motion has semantic meaning

### No Tricks

**Clean implementations, no hacks.**

**Anti-Patterns to Avoid:**

- ❌ `clip-path` hacks to create shapes
- ❌ Separate inner hover states that don't sync
- ❌ CSS `transition-colors` when Motion should handle it
- ❌ Disconnected animations (background animates separately from content)
- ❌ Hardcoded colors that break dark mode

**Good Patterns:**

- ✅ Clean rectangle, no tricks
- ✅ Content uses variants, inherits parent hover
- ✅ Motion handles ALL transitions together
- ✅ Variant controls opacity uniformly
- ✅ Subtle shadow on hover adds dimensionality

---

## Implementation Checklist

**Every new component must satisfy these requirements:**

### Design & Philosophy

- [ ] Component fits within runi's design system (zen, calm, muted by default)
- [ ] Follows color philosophy (grayscale foundation, strategic color)
- [ ] Respects brand identity (German Shepherd: vigilant, protective)
- [ ] Custom component (not from external library) or perfectly integrated if external

### Storybook

- [ ] Storybook story created with at least one default story
- [ ] Stories for key variations (loading, error, empty states)
- [ ] Stories demonstrate interactions (hover, click, drag)
- [ ] Brief JSDoc comments explaining each story's purpose
- [ ] Stories follow naming conventions (`Default`, `WithContent`, `[StateName]`)

### Performance

- [ ] Uses hardware-accelerated properties for animations (`transform`, `opacity`)
- [ ] Avoids layout thrashing (doesn't animate `width`, `height`, `flex` directly)
- [ ] Caches measurements using ResizeObserver or refs (if needed)
- [ ] Uses MotionValues for continuous updates (if drag operations)
- [ ] Commits to React state only when necessary

### Beauty & Clarity

- [ ] No ambiguity in component behavior
- [ ] Clear visual hierarchy
- [ ] Obvious affordances (what's clickable, what's not)
- [ ] Semantic HTML and proper ARIA attributes
- [ ] Keyboard navigation support
- [ ] Screen reader compatible

### Unified Material Feel

- [ ] Uses Motion variants to orchestrate animations together
- [ ] No separate inner hover states (content inherits from parent)
- [ ] Semantic motion (every motion has meaning)
- [ ] No tricks (no clip-path hacks, no disconnected animations)
- [ ] Subtle depth on hover (shadow or glow)

### Technical Requirements

- [ ] React 19 functional component with TypeScript
- [ ] Explicit return types on functions
- [ ] Component props typed with interfaces
- [ ] Uses Zustand for global state (if needed), `useState` for local state
- [ ] Imports Motion from `motion/react` (Motion 12)
- [ ] Uses semantic color tokens (dark mode compatible)
- [ ] Follows TDD (tests written first, ≥85% coverage)

### Testing

- [ ] Component test file created (`Component.test.tsx`)
- [ ] Tests written first (TDD: RED → GREEN → REFACTOR)
- [ ] Test coverage ≥85%
- [ ] Tests verify behavior, not implementation
- [ ] Tests are meaningful and cover edge cases

---

## Examples

### Example 1: Unified Tray Pull Tab

The collapsed Tray demonstrates the unified material feel:

```tsx
// Variants orchestrate everything together
const trayVariants = {
  rest: {
    y: 0,
    backgroundColor: 'var(--color-bg-surface)',
    boxShadow: '0 0 0 0 rgba(0,0,0,0)',
  },
  hover: {
    y: -2, // Slight lift suggests "pulling toward you"
    backgroundColor: 'var(--color-bg-elevated)',
    boxShadow: '0 -4px 12px -4px rgba(0,0,0,0.3)', // Subtle depth
  },
};

const trayContentVariants = {
  rest: { opacity: 0.4 },
  hover: { opacity: 0.8 }, // Content brightens WITH background
};

// Single motion.div - unified material
<motion.div
  variants={trayVariants}
  initial="rest"
  whileHover="hover"
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
>
  <motion.div variants={trayContentVariants}>
    {/* Content inherits hover state - no separate hover */}
  </motion.div>
</motion.div>;
```

**Key Points:**

- ONE motion.div (unified material)
- Variants orchestrate everything together
- Semantic motion ("pulling page edge")
- No tricks (clean rectangle, no clip-path)
- Subtle depth on hover

### Example 2: SignalDot Component

The SignalDot component demonstrates custom component craftsmanship:

```tsx
// Custom component that fits perfectly in design system
export const SignalDot = ({ type, size = 'sm', tooltip }: SignalDotProps): React.JSX.Element => {
  const shouldReduceMotion = useReducedMotion();
  const config = signalConfig[type]; // Strategic color for signals

  return (
    <motion.span
      className={cn(
        'inline-block rounded-full cursor-pointer',
        sizeClasses[size],
        config.bg, // Strategic color (not decoration)
        config.glow, // Subtle depth
        config.pulse && 'animate-pulse' // Semantic animation
      )}
      whileHover={shouldReduceMotion === true ? undefined : { scale: 1.3 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      title={tooltip}
      aria-label={tooltip}
    />
  );
};
```

**Key Points:**

- Custom component (not from external library)
- Strategic color (signal meaning, not decoration)
- Semantic animation (pulse for drift, scale on hover)
- Accessibility (aria-label, title)
- Respects reduced motion preference

---

## Related Documentation

- **Design System**: `.cursor/skills/runi-design/SKILL.md` - Complete design system reference
- **Motion Best Practices**: `docs/MOTION_BEST_PRACTICES.md` - Performance and animation guidelines
- **Storybook Setup**: `.storybook/main.ts` - Storybook configuration
- **Component Structure**: `src/components/` - Component organization
- **Project Standards**: `CLAUDE.md` - Development standards and conventions

---

## Summary

**The Philosophy:**

- Craftsmanship over convenience
- Custom components over external libraries
- Performance and clarity are non-negotiable
- Beauty emerges from intentional design
- Unified material feel, not separate pieces
- Semantic motion, not decoration

**The Process:**

1. Check if component exists in our custom library
2. If not, check if external library component perfectly fits our design system
3. If not, craft it ourselves as artists and craftsmen
4. Create Storybook story for testing and analysis
5. Follow TDD (tests first, then implementation)
6. Ensure performance, beauty, and clarity
7. Achieve unified material feel with Motion variants

**The Result:**
A custom component library that fits perfectly within runi's design system, performs well on React + Rust stack, and feels like a well-designed solution crafted with intention and care.
