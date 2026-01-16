/**
 * Responsive design utilities.
 *
 * Provides utilities for handling responsive breakpoints
 * and mobile/tablet/desktop detection.
 */

/**
 * Breakpoint definitions for desktop window resizing.
 *
 * Desktop-first: These breakpoints are optimized for desktop app window sizes,
 * not mobile viewports. Useful for responsive layouts when users resize the window.
 *
 * - sm: Small window (640px) - compact mode
 * - md: Medium window (768px) - standard mode
 * - lg: Large window (1024px) - comfortable mode
 * - xl: Extra large window (1280px) - spacious mode
 * - 2xl: Very large window (1536px) - maximum mode
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Media query result state.
 * This is a simple object that components can use with Svelte runes.
 */
export interface MediaQueryState {
  matches: boolean;
  media: string;
}

/**
 * Creates a reactive media query observer.
 *
 * Returns a state object that can be used with Svelte runes.
 * Components should use this with $state to create reactive breakpoint checks.
 *
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns A state object with `matches` property
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { createMediaQuery } from '$lib/utils/responsive';
 *
 *   const mobileQuery = createMediaQuery('(max-width: 768px)');
 *   const isMobile = $derived(mobileQuery.matches);
 *
 *   {#if isMobile}
 *     <MobileLayout />
 *   {:else}
 *     <DesktopLayout />
 *   {/if}
 * </script>
 * ```
 */
export function createMediaQuery(query: string): MediaQueryState {
  if (typeof window === 'undefined') {
    // SSR: return default (assume desktop)
    return { matches: false, media: query };
  }

  const mq = window.matchMedia(query);
  return {
    matches: mq.matches,
    media: query,
  };
}

/**
 * Creates a reactive media query hook for use in Svelte components.
 *
 * This function should be called in a component's script block
 * and used with $effect to set up the media query listener.
 *
 * @param query - Media query string
 * @returns A function that returns the current matches state and sets up listener
 *
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useMediaQuery } from '$lib/utils/responsive';
 *
 *   let isMobile = $state(false);
 *
 *   $effect(() => {
 *     const { matches, cleanup } = useMediaQuery('(max-width: 768px)');
 *     isMobile = matches;
 *     return cleanup;
 *   });
 * </script>
 * ```
 */
export function useMediaQuery(query: string): {
  matches: boolean;
  cleanup: () => void;
} {
  if (typeof window === 'undefined') {
    // No-op cleanup for SSR - no event listeners to remove
    return {
      matches: false,
      cleanup: (): void => {
        /* noop for SSR */
      },
    };
  }

  const mq = window.matchMedia(query);
  let matches = mq.matches;

  const handler = (e: MediaQueryListEvent): void => {
    matches = e.matches;
  };

  // Always use modern addEventListener API
  // For legacy browsers that don't support it, TypeScript will error but runtime will work
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', handler);
    return {
      matches,
      cleanup: (): void => {
        mq.removeEventListener('change', handler);
      },
    };
  }

  // Fallback for very old browsers (IE11, etc.) - use deprecated API only if modern API unavailable
  // This should rarely execute in modern browsers
  const legacyMq = mq as unknown as {
    addListener?: (h: (e: MediaQueryListEvent) => void) => void;
    removeListener?: (h: (e: MediaQueryListEvent) => void) => void;
  };
  if (legacyMq.addListener !== undefined) {
    // addListener is deprecated but needed for legacy browser support
    legacyMq.addListener(handler);
    return {
      matches,
      cleanup: (): void => {
        // removeListener is deprecated but needed for legacy browser support
        legacyMq.removeListener?.(handler);
      },
    };
  }

  // No listener API available (shouldn't happen in practice)
  return {
    matches,
    cleanup: (): void => {
      /* noop - no listener API available */
    },
  };
}

/**
 * Creates a compact window breakpoint media query (< 768px).
 *
 * Desktop-first: For small desktop windows where we want compact layouts.
 * Useful when users resize the window to a smaller size.
 *
 * @returns Media query state for compact window size
 */
export function createCompactQuery(): MediaQueryState {
  return createMediaQuery(`(max-width: ${String(breakpoints.md - 1)}px)`);
}

/**
 * Creates a standard window breakpoint media query (768px - 1024px).
 *
 * Desktop-first: For medium desktop windows - standard layout.
 *
 * @returns Media query state for standard window size
 */
export function createStandardQuery(): MediaQueryState {
  return createMediaQuery(
    `(min-width: ${String(breakpoints.md)}px) and (max-width: ${String(breakpoints.lg - 1)}px)`
  );
}

/**
 * Creates a spacious window breakpoint media query (> 1024px).
 *
 * Desktop-first: For large desktop windows - comfortable, spacious layout.
 *
 * @returns Media query state for spacious window size
 */
export function createSpaciousQuery(): MediaQueryState {
  return createMediaQuery(`(min-width: ${String(breakpoints.lg)}px)`);
}

/**
 * @deprecated Use createCompactQuery() instead - desktop-first naming
 * Creates a mobile breakpoint media query (< 768px).
 */
export function createMobileQuery(): MediaQueryState {
  return createCompactQuery();
}

/**
 * @deprecated Use createStandardQuery() instead - desktop-first naming
 * Creates a tablet breakpoint media query (768px - 1024px).
 */
export function createTabletQuery(): MediaQueryState {
  return createStandardQuery();
}

/**
 * @deprecated Use createSpaciousQuery() instead - desktop-first naming
 * Creates a desktop breakpoint media query (> 1024px).
 */
export function createDesktopQuery(): MediaQueryState {
  return createSpaciousQuery();
}
