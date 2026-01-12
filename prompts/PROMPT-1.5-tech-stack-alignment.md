# Ralph Run 1.5: shadcn-svelte Component Setup

## Objective

Initialize shadcn-svelte and render existing UI with Tailwind utility classes instead of traditional CSS.

## Authoritative References

- [SvelteKit Project Structure](https://svelte.dev/docs/kit/project-structure)
- [Tauri + SvelteKit Setup](https://v2.tauri.app/start/frontend/sveltekit/)
- [shadcn-svelte Installation](https://www.shadcn-svelte.com/docs/installation/sveltekit)

## Current State

- Tailwind v4 imported in `app.css` but unused
- `+page.svelte` has 160 lines of `<style>` CSS
- `shadcn-svelte` installed but not initialized (no `components.json`)

## Step 1: Initialize shadcn-svelte

```bash
npx shadcn-svelte@latest init
```

When prompted:

- **Base color:** Slate
- **CSS file:** `src/app.css`
- **Components:** `$lib/components/ui`
- **Utils:** `$lib/utils`

This creates `components.json` and `src/lib/utils/cn.ts`.

## Step 2: Add Core Components

```bash
npx shadcn-svelte@latest add button input
```

Creates:

```text
src/lib/components/ui/
├── button/
│   └── index.ts, button.svelte
└── input/
    └── index.ts, input.svelte
```

## Step 3: Refactor +page.svelte

Replace traditional CSS with Tailwind classes and shadcn components.

**Import components:**

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
</script>
```

**Replace elements:**

- `<button>` → `<Button>`
- `<input type="text">` → `<Input>`
- Remove entire `<style>` block
- Use Tailwind classes for layout (`flex`, `gap-2`, `p-4`, etc.)

## Step 4: Verify

```bash
npm run dev      # UI renders with styled components
npm run check    # TypeScript passes
npm run build    # Production build succeeds
```

## Success Criteria

- [ ] `components.json` exists at project root
- [ ] `src/lib/utils/cn.ts` exists
- [ ] `src/lib/components/ui/button/` exists
- [ ] `src/lib/components/ui/input/` exists
- [ ] `+page.svelte` has no `<style>` block
- [ ] `npm run dev` renders styled UI
- [ ] `npm run check` passes
- [ ] `npm run build` succeeds

## Completion Signal

When all criteria pass:

```text
<promise>SHADCN_SETUP_COMPLETE</promise>
```
