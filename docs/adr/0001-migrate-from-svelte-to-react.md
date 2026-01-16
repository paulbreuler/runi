# ADR-0001: Migrate from Svelte 5 to React 19

**Date:** 2026-01-14

**Status:** Accepted

**Deciders:** Paul Breuler

---

## Context

runi was initially built with Svelte 5 (runes) as the frontend framework, chosen for its modern reactivity model, smaller bundle size, and improved developer experience over Svelte 4. This decision was made on 2026-01-11 along with complementary choices for shadcn-svelte, paneforge, lucide-svelte, and Storybook with SvelteKit support.

After three days of development (2026-01-11 to 2026-01-13), several significant friction points emerged:

### Development Velocity Issues

1. **AI coding assistant support:** Claude Code and other AI assistants have substantially more training data on React patterns than Svelte 5 runes. The runes syntax (`$state`, `$derived`, `$effect`) is new enough (released late 2024) that AI suggestions were frequently incorrect or used Svelte 4 patterns. This created constant context-switching to correct AI output.

2. **Ecosystem maturity:** While shadcn-svelte exists, it lags behind shadcn/ui (React) in component coverage and community contributions. Paneforge, while functional, had fewer examples and less documentation than React alternatives like react-resizable-panels.

3. **Library availability:** Several desired integrations (Motion animation library, certain visualization libraries) either lacked Svelte support or required additional wrapper work. Motion 12 has first-class React support via `motion/react`.

4. **Debugging tooling:** React DevTools is more mature than Svelte DevTools, with better state inspection and time-travel debugging capabilities.

### Technical Constraints

- **Tauri v2 compatibility:** Both frameworks work well with Tauri; this was not a differentiating factor.
- **TypeScript support:** Both have excellent TypeScript integration; not a differentiating factor.
- **Bundle size:** Svelte produces smaller bundles, but runi's bundle size (~50MB with Tauri) is dominated by the Rust backend, making frontend bundle size a minor concern.

### Project Context

runi is being developed by a solo maintainer using AI coding assistants extensively. Developer velocity is critical. The framework choice directly impacts how quickly features can be built and iterated.

---

## Decision

**We will migrate from Svelte 5 to React 19 for the frontend framework.**

The migration includes:

- React 19 with TypeScript 5.9
- Zustand for state management
- Motion 12 (`motion/react`) for animations
- Lucide React for icons
- React Router 7 for routing
- Tailwind CSS 4 (unchanged)
- Vite 7 (unchanged)

---

## Considered Options

### Option 1: Continue with Svelte 5

**Pros:**

- No migration cost
- Smaller bundle size
- Modern reactivity model is elegant
- Already had initial setup complete

**Cons:**

- AI assistant support is poor for runes syntax
- Ecosystem is smaller
- Motion library requires workarounds
- Slower feature development observed

### Option 2: Migrate to React 19 (Chosen)

**Pros:**

- Excellent AI assistant support (Claude, Copilot, etc.)
- Largest ecosystem of any frontend framework
- First-class Motion 12 support
- Mature debugging tools
- Zustand provides simple, effective state management
- More community resources and examples

**Cons:**

- Migration cost (3 days of Svelte work)
- Larger bundle size (negligible in Tauri context)
- More verbose than Svelte in some cases

### Option 3: Vue 3 with Composition API

**Pros:**

- Good AI support (better than Svelte, less than React)
- Strong TypeScript support
- Smaller bundle than React

**Cons:**

- Still smaller ecosystem than React
- Motion 12 support requires Vue-specific setup
- Fewer Tauri + Vue examples in the wild

### Option 4: Solid.js

**Pros:**

- React-like syntax with fine-grained reactivity
- Small bundle size
- Good performance

**Cons:**

- Smallest ecosystem of options considered
- Poor AI assistant support
- Limited Tauri integration examples

---

## Consequences

### Positive

- **Faster development:** AI assistants now generate correct, usable code on first attempt in most cases
- **Richer ecosystem:** Access to the full React ecosystem for any future needs
- **Better documentation:** More tutorials, examples, and Stack Overflow answers available
- **Motion integration:** First-class animation support with `motion/react`
- **Team scalability:** If contributors join, React expertise is more common than Svelte

### Negative

- **Lost work:** Three days of Svelte development work was discarded
- **Larger bundles:** React + Zustand produces larger JS bundles than Svelte (mitigated by Tauri context)
- **More boilerplate:** Some patterns require more code in React than Svelte

### Neutral

- **Learning curve:** Solo maintainer already knows both frameworks
- **Performance:** Both frameworks are fast enough for runi's needs

---

## Supersedes

This decision supersedes the following entries from `docs/DECISIONS.md`:

| Date       | Decision                              | Status     |
| ---------- | ------------------------------------- | ---------- |
| 2026-01-11 | Svelte 5 runes                        | Superseded |
| 2026-01-12 | shadcn-svelte for UI                  | Superseded |
| 2026-01-12 | paneforge for resizable panes         | Superseded |
| 2026-01-12 | lucide-svelte for icons               | Superseded |
| 2026-01-12 | Storybook for components (SvelteKit)  | Superseded |
| 2026-01-12 | Storybook story patterns (Svelte CSF) | Superseded |
| 2026-01-13 | Keep Tauri + Svelte (vs WASM)         | Superseded |

---

## References

- [React 19 Documentation](https://react.dev/)
- [Motion for React](https://motion.dev/docs/react-quick-start)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [Svelte 5 Runes](https://svelte.dev/blog/svelte-5-is-alive) (original choice)
- [Michael Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
