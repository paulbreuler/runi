# @runi/ui

runi design system component library - shared UI components, design tokens, and utilities.

## Installation

```bash
npm install @runi/ui
# or
pnpm add @runi/ui
# or
yarn add @runi/ui
```

## Usage

### Import Components

```tsx
import { Button, Card, Input } from '@runi/ui';
```

### Import Styles

```tsx
import '@runi/ui/styles';
```

### Import Utilities

```tsx
import { cn } from '@runi/ui/utils';
```

## Components

- `Button` - Primary button component with variants
- `Card` - Container component
- `Input` - Form input component
- `Checkbox` - Checkbox component
- `Select` - Select dropdown component
- `Separator` - Visual separator
- `Toast` - Toast notification component
- `SegmentedControl` - Segmented control component
- `SplitButton` - Split button with dropdown
- `EmptyState` - Empty state component
- `DataPanel` - Data panel component
- `DataPanelHeader` - Data panel header component

## Design System

The component library uses the runi design system with:

- Semantic color tokens (dark mode default)
- Tailwind CSS 4.x
- Motion 12.x for animations
- Radix UI primitives for accessibility

## License

MIT
