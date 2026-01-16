# Motion Library Best Practices (2025-2026)

This document outlines best practices, common issues, and setup recommendations for using the Motion library (motion.dev) based on 2025-2026 research and community feedback.

## Table of Contents
- [Key Issues & Pitfalls](#key-issues--pitfalls)
- [Best Practices](#best-practices)
- [Performance Optimization](#performance-optimization)
- [Setup Recommendations](#setup-recommendations)
- [Our Implementation Status](#our-implementation-status)

## Key Issues & Pitfalls

### 1. Layout Thrashing & Performance Degradation
- **Problem**: Animating layout properties (width, height, flex) causes expensive reflows
- **Symptom**: UI breaks or becomes laggy during repeated drag operations
- **Solution**: Use `transform` and `opacity` instead of layout properties

### 2. Frequent DOM Reads During Drag
- **Problem**: Calling `getBoundingClientRect()` on every drag event is expensive
- **Symptom**: Janky animations, frame drops
- **Solution**: Cache measurements using ResizeObserver or refs

### 3. State Updates During Drag
- **Problem**: React state updates on every drag frame cause re-renders
- **Symptom**: Laggy, disconnected feeling during drag
- **Solution**: Use MotionValues for immediate updates, commit to state only on dragEnd

### 4. Layout Animation Scope
- **Problem**: Too many ancestors observing layout changes adds overhead
- **Symptom**: Performance degradation with complex layouts
- **Solution**: Use `layout="position"` instead of full `layout` when possible

### 5. Browser-Specific Rendering Differences
- **Problem**: Chrome, Safari, Firefox render transforms/positioning differently
- **Symptom**: Dividers misaligned in some browsers
- **Solution**: Use absolute positioning for resizers, test across browsers

## Best Practices

### 1. Hardware-Accelerated Properties
✅ **DO**: Animate `transform` and `opacity`
```tsx
// Good - GPU accelerated
style={{ transform: 'translateX(100px)', opacity: 0.5 }}
```

❌ **DON'T**: Animate `width`, `height`, `top`, `left` directly
```tsx
// Bad - causes layout recalculation
style={{ width: '100px', height: '50px' }}
```

### 2. MotionValues for Continuous Updates
✅ **DO**: Use MotionValues for drag operations
```tsx
const x = useMotionValue(0);
const width = useTransform(x, (val) => `${val}%`);
```

❌ **DON'T**: Update React state on every drag frame
```tsx
// Bad - causes re-renders
onDrag={(e, info) => setWidth(info.point.x)}
```

### 3. Cache Measurements
✅ **DO**: Use ResizeObserver to cache container dimensions
```tsx
const containerWidthRef = useRef<number>(0);
useEffect(() => {
  const resizeObserver = new ResizeObserver(() => {
    containerWidthRef.current = containerRef.current?.getBoundingClientRect().width ?? 0;
  });
  // ...
}, []);
```

❌ **DON'T**: Read DOM on every drag event
```tsx
// Bad - expensive DOM read
onDrag={(e, info) => {
  const width = containerRef.current.getBoundingClientRect().width;
}}
```

### 4. Batch State Updates
✅ **DO**: Use requestAnimationFrame to batch updates
```tsx
onDragEnd={() => {
  requestAnimationFrame(() => {
    const finalWidth = currentWidth.get();
    setWidth(finalWidth);
  });
}
```

### 5. Absolute Positioning for Resizers
✅ **DO**: Position resizers absolutely to avoid layout shifts
```tsx
<motion.div
  className="absolute top-0 bottom-0"
  style={{ left: resizerLeft }}
/>
```

### 6. Layout Animation Scope
✅ **DO**: Use `layout="position"` when only position changes
```tsx
<motion.div layout="position" />
```

✅ **DO**: Use full `layout` only when size changes
```tsx
<motion.div layout />
```

### 7. Reduce Bundle Size
✅ **DO**: Use LazyMotion for code splitting
```tsx
import { LazyMotion, domAnimation } from 'motion/react';

<LazyMotion features={domAnimation}>
  {/* Your components */}
</LazyMotion>
```

### 8. Performance Hints
✅ **DO**: Use `willChange` appropriately
```tsx
style={{
  willChange: isDragging ? 'transform' : 'auto'
}}
```

### 9. Layout Groups
✅ **DO**: Use LayoutGroup for coordinated animations
```tsx
<LayoutGroup>
  <motion.div layout />
  <motion.div layout />
</LayoutGroup>
```

### 10. Accessibility
✅ **DO**: Respect `prefers-reduced-motion`
```tsx
const shouldReduceMotion = useReducedMotion();
const transition = shouldReduceMotion ? { duration: 0 } : springTransition;
```

## Performance Optimization

### Critical Performance Rules

1. **Animate only composite properties**: `transform`, `opacity`
2. **Minimize layout calculations**: Cache measurements, use refs
3. **Batch updates**: Use requestAnimationFrame for state commits
4. **Use MotionValues**: For continuous animations, avoid React state
5. **Limit layout scope**: Use `layout="position"` when possible
6. **Hardware acceleration**: Use `willChange` hints appropriately

### Performance Testing Checklist

- [ ] Test rapid repeated drags (10+ cycles)
- [ ] Test extended drag sessions (50+ movements)
- [ ] Test with heavy DOM content (100+ items)
- [ ] Test across browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices
- [ ] Profile with Chrome DevTools Performance tab
- [ ] Measure frame rates (target: 60fps)
- [ ] Check for layout thrashing (forced reflows)

## Setup Recommendations

### Package Installation
```bash
npm install motion
```

### Import Strategy
```tsx
// For most use cases
import { motion, useMotionValue, useTransform } from 'motion/react';

// For code splitting
import { LazyMotion, domAnimation } from 'motion/react';
```

### TypeScript Configuration
Ensure React 18+ types are available:
```json
{
  "compilerOptions": {
    "types": ["react", "react-dom"]
  }
}
```

### Storybook Setup
- Add performance test stories
- Test rapid interactions
- Validate across viewport sizes
- Use interaction testing framework

## Our Implementation Status

### ✅ Implemented Best Practices

1. **MotionValues for drag operations**: ✅ Using `useMotionValue` and `useTransform`
2. **Cached measurements**: ✅ Using ResizeObserver to cache container width
3. **Batched state updates**: ✅ Using requestAnimationFrame in dragEnd handlers
4. **Absolute positioning**: ✅ Resizer is absolutely positioned
5. **Performance hints**: ✅ Using `willChange` during drag
6. **Layout animation control**: ✅ Disabling layout during drag, enabling after
7. **Comprehensive testing**: ✅ Performance test stories in Storybook

### 🔄 Areas for Potential Improvement

1. **LazyMotion**: Consider using LazyMotion for code splitting
2. **Layout scope**: Review if `layout="position"` can be used instead of full `layout`
3. **Accessibility**: Add `prefers-reduced-motion` support
4. **Bundle size**: Audit motion imports for tree-shaking opportunities

### 📊 Performance Metrics

Our current implementation:
- ✅ Caches container width (no getBoundingClientRect in drag events)
- ✅ Uses MotionValues for immediate updates
- ✅ Batches state commits with requestAnimationFrame
- ✅ Uses absolute positioning for resizer
- ✅ Comprehensive performance tests in Storybook

## References

### Official Motion.dev Documentation

- **[Motion.dev Documentation](https://motion.dev)** - Main documentation hub
- **[Motion.dev Performance Guide](https://motion.dev/docs/performance)** - Performance optimization best practices
- **[Motion.dev Layout Animations](https://motion.dev/docs/react-layout-animations)** - Layout animation patterns
- **[Motion.dev Drag API](https://motion.dev/docs/react-drag)** - Drag gesture implementation
- **[Motion.dev MotionValues](https://motion.dev/docs/react-motion-values)** - MotionValue usage patterns
- **[Motion.dev Reduced Motion](https://motion.dev/motion/use-reduced-motion/)** - Accessibility support
- **[Motion.dev Resize API](https://motion.dev/docs/resize)** - Container resize detection

### Implementation Documentation

- **[Layout Implementation Documentation](../docs/LAYOUT_IMPLEMENTATION.md)** - Complete implementation guide with official references
- **[MainLayout Component](../../src/components/Layout/MainLayout.tsx)** - Source code
- **[MainLayout Tests](../../src/components/Layout/MainLayout.test.tsx)** - Unit tests
- **[MainLayout Stories](../../src/components/Layout/MainLayout.stories.tsx)** - Storybook stories

## Testing

Run performance tests in Storybook:
```bash
npm run storybook
```

Navigate to: `Components/Layout/MainLayout` → Performance test stories

Test scenarios:
1. **PerformanceRapidDrag**: Rapid repeated drags
2. **PerformanceExtendedDrag**: Extended drag sessions
3. **PerformanceSidebarRapidDrag**: Sidebar resizing performance
4. **PerformanceStressTest**: Heavy DOM content stress test
