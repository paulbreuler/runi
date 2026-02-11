# Architecture

This document provides an overview of runi's architecture and key design patterns.

## Canvas Architecture

runi uses a context-aware canvas system for multi-view support.

### Core Concepts

**Context**: A pluggable view (e.g., Request, Blueprint, Docs) defined by a `CanvasContextDescriptor`:

- `id`: Unique identifier
- `label`: Display name for context tab
- `icon`: Lucide icon component
- `panels`: Named panel components (Record<string, ComponentType>)
- `toolbar`: Context-specific toolbar component
- `layouts`: Available layout presets for this context

**Layout**: An arrangement of panels (single, columns, rows, grid) with optional ratios.

### Adding a New Context

1. Create descriptor:

```typescript
export const myContextDescriptor: CanvasContextDescriptor = {
  id: 'my-context',
  label: 'My View',
  icon: MyIcon,
  panels: { main: MyMainPanel },
  toolbar: MyToolbar,
  layouts: [...],
};
```

1. Register on mount:

```typescript
useEffect(() => {
  useCanvasStore.getState().registerContext(myContextDescriptor);
  useCanvasStore.getState().setActiveContext('my-context');
}, []);
```

1. Your context appears in the ContextBar automatically.

### Custom Layouts

Contexts can define preset layouts:

```typescript
layouts: [
  {
    id: 'my-layout',
    label: 'Custom Layout',
    description: 'Two columns',
    icon: Columns2,
    category: 'preset',
    arrangement: {
      type: 'columns',
      panels: ['left', 'right'],
      ratios: [40, 60],
    },
  },
];
```

Generic layouts (Single, Side by Side, etc.) are always available.

### Keyboard Shortcuts

Canvas supports keyboard navigation:

- **Cmd+[** (Ctrl+[ on Windows/Linux) - Previous layout
- **Cmd+]** (Ctrl+] on Windows/Linux) - Next layout
- **Cmd+1** (Ctrl+1 on Windows/Linux) - Switch to Request context

Shortcuts are defined in `src/commands/defaultKeybindings.ts` and registered in `src/hooks/useLayoutCommands.ts`.
