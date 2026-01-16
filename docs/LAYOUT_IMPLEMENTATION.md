# MainLayout Implementation Documentation

This document provides comprehensive documentation for the `MainLayout` component, including implementation details, official Motion.dev references, testing approach, and validation.

## Table of Contents

- [Overview](#overview)
- [Official Motion.dev Pattern](#official-motiondev-pattern)
- [Implementation Details](#implementation-details)
- [Testing Strategy](#testing-strategy)
- [Performance Considerations](#performance-considerations)
- [Accessibility](#accessibility)
- [References](#references)

## Overview

The `MainLayout` component implements a resizable, performant layout system following Motion.dev's official best practices and Apple's Zen design principles. It provides:

- **Resizable Sidebar**: Drag to resize between 256px (minimum) and 500px (maximum)
- **Resizable Panes**: Drag divider to adjust request/response split (20-80% range)
- **Keyboard Shortcuts**: ⌘B (Mac) or Ctrl+B (Windows/Linux) to toggle sidebar
- **Smooth Animations**: Motion-powered animations with immediate feedback during drag
- **Scrollbar Stability**: Prevents scrollbar flashing during resize operations
- **Visual Feedback**: Subtle handles appear on hover, following Apple's minimal aesthetic

## Official Motion.dev Pattern

This implementation follows the **official Motion.dev pattern** for resizable panes as documented in:

### Key Official References

1. **Layout Animations**: [Motion.dev Layout Animations](https://motion.dev/docs/react-layout-animations)
   - Uses `layout` prop for smooth size changes
   - Motion automatically handles transforms under the hood
   - Avoids animating `width`/`height` directly (performance best practice)

2. **Drag API**: [Motion.dev Drag](https://motion.dev/docs/react-drag)
   - Uses `drag="x"` for horizontal dragging
   - `dragConstraints` with container ref for proper boundaries
   - `dragElastic={0}` and `dragMomentum={false}` for precise control

3. **MotionValues**: [Motion.dev MotionValues](https://motion.dev/docs/react-motion-values)
   - Uses `useMotionValue` for immediate updates during drag
   - `useTransform` to convert ratio to width strings
   - No React state updates during drag (prevents re-render lag)

4. **Performance**: [Motion.dev Performance Guide](https://motion.dev/docs/performance)
   - Uses `transform` and `opacity` (hardware-accelerated)
   - Avoids animating layout-triggering properties
   - Uses `willChange` hints appropriately

5. **Accessibility**: [Motion.dev Reduced Motion](https://motion.dev/motion/use-reduced-motion/)
   - Uses `useReducedMotion()` hook
   - Respects `prefers-reduced-motion` system preference
   - Disables animations when requested

### Pattern Implementation

```tsx
// Official Motion.dev pattern: Flex-based layout with resizer in flex flow
<motion.div className="flex">
  <motion.div style={{ width: requestWidth }} layout={!isDragging}>
    {/* Request Pane */}
  </motion.div>
  
  <motion.div
    drag="x"
    dragConstraints={containerRef}
    dragElastic={0}
    dragMomentum={false}
    onDrag={handleDrag}
  >
    {/* Resizer */}
  </motion.div>
  
  <motion.div style={{ width: responseWidth }} layout={!isDragging}>
    {/* Response Pane */}
  </motion.div>
</motion.div>
```

**Why this pattern:**
- Resizer is in flex flow (not absolutely positioned) - avoids conflicts with drag transforms
- `layout` prop handles smooth animations automatically
- `dragConstraints` with ref ensures boundaries update on container resize
- MotionValues provide immediate feedback without React re-renders

## Implementation Details

### Split Ratio Tracking

We track the split as a **ratio (0-1)** instead of percentage for better performance:

```tsx
const splitRatio = useMotionValue(DEFAULT_SPLIT / 100);

// Transform to width strings
const requestWidth = useTransform(splitRatio, (ratio) => {
  const clamped = Math.max(MIN_PANE_SIZE / 100, Math.min(MAX_PANE_SIZE / 100, ratio));
  return `${String(clamped * 100)}%`;
});
```

**Benefits:**
- More performant than percentage calculations
- Easier to clamp and validate
- Works better with flex layouts

### Drag Handling

```tsx
const handleDrag = useCallback(
  (_event: PointerEvent, info: { offset: { x: number } }) => {
    const containerWidth = containerWidthRef.current;
    if (containerWidth > 0) {
      // Convert pixel offset to ratio change
      const deltaRatio = info.offset.x / containerWidth;
      const newRatio = dragStartRatio.current + deltaRatio;
      const clamped = Math.max(minRatio, Math.min(maxRatio, newRatio));
      splitRatio.set(clamped); // Immediate update via MotionValue
    }
  },
  [splitRatio]
);
```

**Key points:**
- Uses cached `containerWidthRef` (no expensive DOM reads during drag)
- Updates MotionValue directly (no React state during drag)
- Clamps to min/max bounds
- Commits to state only on `dragEnd`

### Container Width Caching

```tsx
const containerWidthRef = useRef<number>(0);

useEffect(() => {
  const updateWidth = (): void => {
    if (containerRef.current) {
      containerWidthRef.current = containerRef.current.getBoundingClientRect().width;
    }
  };
  
  updateWidth();
  const resizeObserver = new ResizeObserver(updateWidth);
  resizeObserver.observe(containerRef.current);
  
  return () => resizeObserver.disconnect();
}, []);
```

**Why this matters:**
- Avoids expensive `getBoundingClientRect()` calls during drag
- ResizeObserver updates cache when container resizes
- Prevents layout thrashing during drag operations

## Testing Strategy

### Unit Tests (`MainLayout.test.tsx`)

- **Basic Rendering**: Verifies all components render correctly
- **Pane Resizing**: Tests initial split, accessibility attributes, visual feedback
- **Sidebar Functionality**: Tests resizer presence, width constraints, toggle behavior
- **Scrollbar Stability**: Verifies `scrollbar-gutter: stable` is applied
- **Performance**: Tests MotionValue usage, layout animation control

### Storybook Stories (`MainLayout.stories.tsx`)

1. **Default**: Basic rendering validation
2. **WithContent**: Content rendering with interactive elements
3. **DividerHandle**: Visual handle demonstration
4. **SidebarResizing**: Sidebar resizer functionality
5. **SidebarHidden**: Initial state handling
6. **ScrollbarStability**: Scrollbar behavior with overflow content
7. **KeyboardShortcuts**: Keyboard interaction validation
8. **PerformanceRapidDrag**: Rapid repeated drag operations (10 cycles)
9. **PerformanceExtendedDrag**: Extended drag sessions (50 movements)
10. **PerformanceSidebarRapidDrag**: Sidebar resizing performance
11. **PerformanceStressTest**: Heavy DOM content stress test

### E2E Tests (`tests/e2e/layout-resizing.spec.ts`)

- Sidebar resizer visibility, cursor, and drag functionality
- Pane resizer visibility, cursor, and drag functionality
- Hover states for both resizers
- Scrollbar stability during drag
- Performance validation (implicitly via smooth animations)

### Test Coverage

Run tests with coverage:
```bash
npm test -- src/components/Layout/MainLayout.test.tsx --coverage
```

Target coverage: **85%+** (as per project standards)

## Performance Considerations

### Optimizations Applied

1. **MotionValues for Continuous Updates**
   - No React state updates during drag
   - Immediate visual feedback via MotionValues
   - Commits to state only on `dragEnd`

2. **Cached Container Width**
   - ResizeObserver caches width
   - No `getBoundingClientRect()` during drag
   - Updates only when container resizes

3. **Layout Animation Control**
   - `layout={!isDragging}` disables animations during drag
   - Immediate transitions during drag (`immediateTransition`)
   - Smooth animations after drag ends

4. **Hardware Acceleration**
   - `willChange: 'transform'` during drag
   - Motion uses transforms under the hood
   - GPU-accelerated animations

5. **Scrollbar Stability**
   - `scrollbar-gutter: stable` prevents layout shifts
   - Reserved space for scrollbars
   - No flashing during resize

### Performance Metrics

- **Target Frame Rate**: 60fps+
- **Drag Latency**: < 16ms (immediate via MotionValues)
- **Layout Thrashing**: Minimized via cached measurements
- **Memory**: No leaks during extended drag sessions

## Accessibility

### Keyboard Support

- **⌘B (Mac) / Ctrl+B (Windows/Linux)**: Toggle sidebar
- Resizers have proper ARIA attributes:
  - `role="separator"`
  - `aria-label`
  - `aria-orientation`
  - `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

### Reduced Motion Support

```tsx
const prefersReducedMotion = useReducedMotion();

transition={prefersReducedMotion ? { duration: 0 } : layoutTransition}
```

- Respects `prefers-reduced-motion` system preference
- Disables animations when requested
- Maintains functionality without motion

### Touch Support

- `touch-none` class on resizer prevents scroll interference
- Proper touch event handling via Motion's drag API

## Known Issues & Solutions

### Text/Color Changes During Resize

If you notice text or color changes during resize, this may be due to:

1. **Subpixel Rendering**: Browser may render text differently at different widths
2. **Font Rendering**: Antialiasing may change with container size
3. **CSS Transitions**: Check for unintended transitions on text elements

**Solution**: Ensure text elements don't have transitions that trigger on layout changes:
```css
/* Avoid */
.text-element {
  transition: color 0.2s; /* May trigger during resize */
}

/* Prefer */
.text-element {
  /* No transition, or only on hover/focus */
}
```

### Investigation Steps

1. Check for CSS transitions on text elements
2. Verify `willChange` is not set on text containers
3. Check for font rendering issues (subpixel positioning)
4. Test in different browsers (Chrome, Safari, Firefox)

## References

### Official Motion.dev Documentation

1. **Layout Animations**: https://motion.dev/docs/react-layout-animations
2. **Drag API**: https://motion.dev/docs/react-drag
3. **MotionValues**: https://motion.dev/docs/react-motion-values
4. **Performance Guide**: https://motion.dev/docs/performance
5. **Reduced Motion**: https://motion.dev/motion/use-reduced-motion/
6. **Resize API**: https://motion.dev/docs/resize

### Research Sources

- Motion.dev official examples and patterns
- Community best practices (2025-2026)
- Performance optimization guides
- Accessibility compliance standards

### Internal Documentation

- `docs/MOTION_BEST_PRACTICES.md`: Comprehensive Motion.dev best practices
- `src/components/Layout/MainLayout.test.tsx`: Unit tests
- `src/components/Layout/MainLayout.stories.tsx`: Storybook stories
- `tests/e2e/layout-resizing.spec.ts`: E2E tests

## Validation

### Screenshots

Screenshots have been taken to validate:
- Initial layout state
- Resize operations
- Visual feedback (hover states)
- Scrollbar stability

### Manual Testing Checklist

- [x] Sidebar resizes smoothly between min/max
- [x] Pane divider resizes smoothly between 20-80%
- [x] No layout breakage during rapid drags
- [x] Scrollbars remain stable during resize
- [x] Keyboard shortcuts work (⌘B / Ctrl+B)
- [x] Reduced motion preference respected
- [x] Visual handles appear on hover
- [x] Performance remains smooth at 60fps+

### Browser Testing

Tested in:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)

All browsers show consistent behavior with the official Motion.dev pattern.
