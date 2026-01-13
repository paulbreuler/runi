# PROMPT-2 Quick Reference

**Status:** ✅ Split into 3 sub-runs, ready for execution

## Execution Order

```bash
# Run 2A: Layout Foundation
ralph -p prompts/PROMPT-2A-layout-foundation.md --monitor

# Run 2B: Request Header & Response Basics
ralph -p prompts/PROMPT-2B-request-response-basics.md --monitor

# Run 2C: Response Viewer & Polish
ralph -p prompts/PROMPT-2C-response-viewer-polish.md --monitor
```

## What Each Run Delivers

### 2A: Layout Foundation

**Creates:** MainLayout, Sidebar, StatusBar  
**Enables:** App structure, navigation, keyboard shortcuts  
**Stories:** 3 stories (MainLayout, Sidebar, StatusBar)

### 2B: Request Header & Response Basics

**Creates:** RequestHeader, StatusBadge, TimingDisplay, ResponsePanel (basic)  
**Enables:** Send requests, see responses, status feedback  
**Stories:** 3 stories (RequestHeader, StatusBadge, TimingDisplay)

### 2C: Response Viewer & Polish

**Creates:** BodyViewer, HeadersViewer, ResponsePanel (enhanced)  
**Enables:** Syntax highlighting, headers table, tabs, beautiful viewing  
**Stories:** 3 stories (ResponsePanel, BodyViewer, HeadersViewer)

## Component Structure

```
src/lib/components/
├── Layout/
│   ├── MainLayout.svelte          (2A)
│   ├── Sidebar.svelte              (2A)
│   ├── StatusBar.svelte            (2A)
│   ├── MainLayout.stories.svelte   (2A)
│   ├── Sidebar.stories.svelte      (2A)
│   └── StatusBar.stories.svelte     (2A)
├── Request/
│   ├── RequestHeader.svelte        (2B)
│   └── RequestHeader.stories.svelte (2B)
└── Response/
    ├── ResponsePanel.svelte        (2B, enhanced in 2C)
    ├── StatusBadge.svelte           (2B)
    ├── TimingDisplay.svelte        (2B)
    ├── BodyViewer.svelte           (2C)
    ├── HeadersViewer.svelte         (2C)
    ├── ResponsePanel.stories.svelte  (2C)
    ├── StatusBadge.stories.svelte   (2B)
    ├── TimingDisplay.stories.svelte (2B)
    ├── BodyViewer.stories.svelte    (2C)
    └── HeadersViewer.stories.svelte (2C)
```

## Dependencies by Run

### 2A

- `paneforge` - Resizable panes
- `lucide-svelte` - Icons
- `shadcn-svelte card` - Card component

### 2B

- (Uses dependencies from 2A)
- (Uses existing HTTP execution from Run 1)

### 2C

- `shiki` - Syntax highlighting (or CodeMirror/Prism)
- `shadcn-svelte tabs` - Tab component
- `shadcn-svelte table` - Table component

## Success Criteria Summary

### 2A Success

- ✅ Three-panel layout renders
- ✅ Sidebar toggles with ⌘B
- ✅ Panes resize smoothly
- ✅ 3 Storybook stories complete
- ✅ All quality gates pass

### 2B Success

- ✅ RequestHeader sends requests
- ✅ Method dropdown has colors
- ✅ Response displays with status badge
- ✅ 3 Storybook stories complete
- ✅ All quality gates pass

### 2C Success

- ✅ JSON syntax highlighting works
- ✅ Response tabs work (Body/Headers/Stats)
- ✅ Headers table is collapsible
- ✅ 3 Storybook stories complete
- ✅ All quality gates pass

## Verification Between Runs

After each run, verify:

```bash
# Type checks
npm run check

# Linting
npm run lint

# Storybook
just storybook

# Full CI
just ci
```

## Common Issues & Solutions

### Issue: paneforge not working

**Solution:** Ensure `npm install paneforge` completed successfully

### Issue: Syntax highlighting not working

**Solution:** Check Shiki installation, verify theme matches your app theme

### Issue: Keyboard shortcuts not working

**Solution:** Verify `$effect` hook is set up correctly for keydown listener

### Issue: Storybook stories not rendering

**Solution:** Check that `@storybook/addon-svelte-csf` is installed and configured

## Next Steps After 2C

Once all three runs are complete:

1. ✅ Update `@fix_plan.md` with all completed items
2. ✅ Verify all 9 Storybook stories render correctly
3. ✅ Test full request/response flow end-to-end
4. ✅ Run `just ci` to ensure everything passes
5. 🎯 Ready for Run 3: Request Builder (tabs content)
