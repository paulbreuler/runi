/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ThemeProvider - Theme context for runi design system
 * @description Applies theme class and data attributes to document.documentElement (html)
 * for proper theming that affects all global styles including body.
 */

import { createContext, useContext, useMemo, useEffect, type ReactNode } from 'react';

/**
 * Available accent colors for the theme
 * (currently only 'blue' is implemented in CSS)
 */
export type AccentColor = 'blue';

/**
 * Available gray color scales
 * (currently only 'gray' is implemented in CSS)
 */
export type GrayColor = 'gray';

/**
 * Theme appearance (light/dark mode)
 */
export type Appearance = 'light' | 'dark' | 'inherit';

/**
 * Theme context value
 */
interface ThemeContextValue {
  /** Current appearance (light/dark) */
  appearance: Appearance;
  /** Current accent color */
  accentColor: AccentColor;
  /** Current gray color scale */
  grayColor: GrayColor;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Props for ThemeProvider component
 */
export interface ThemeProviderProps {
  /** Child components */
  children: ReactNode;
  /** Theme appearance (default: 'dark') */
  appearance?: Appearance;
  /** Accent color (default: 'blue') */
  accentColor?: AccentColor;
  /** Gray color scale (default: 'gray') */
  grayColor?: GrayColor;
  /** Whether to apply background color (default: true) */
  hasBackground?: boolean;
}

/**
 * ThemeProvider component that applies theme to document.documentElement
 *
 * Sets the following on <html> element:
 * - Theme class (`.dark` or `.light`) for Tailwind dark mode
 * - `data-accent-color`: The current accent color
 * - `data-gray-color`: The current gray color scale
 * - `data-has-background`: Whether background is applied
 *
 * This ensures global styles (body background, text colors) respond to theme changes.
 *
 * @example
 * ```tsx
 * <ThemeProvider appearance="dark" accentColor="blue">
 *   <App />
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider = ({
  children,
  appearance = 'dark',
  accentColor = 'blue',
  grayColor = 'gray',
  hasBackground = true,
}: ThemeProviderProps): React.JSX.Element => {
  const contextValue = useMemo(
    () => ({ appearance, accentColor, grayColor }),
    [appearance, accentColor, grayColor]
  );

  // Apply theme class and data attributes to document.documentElement
  useEffect(() => {
    const root = document.documentElement;

    // Apply theme class
    if (appearance === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
    } else if (appearance === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // inherit - remove both
      root.classList.remove('dark', 'light');
    }

    // Apply data attributes
    root.setAttribute('data-accent-color', accentColor);
    root.setAttribute('data-gray-color', grayColor);
    root.setAttribute('data-has-background', String(hasBackground));

    // Cleanup on unmount
    return (): void => {
      root.classList.remove('dark', 'light');
      root.removeAttribute('data-accent-color');
      root.removeAttribute('data-gray-color');
      root.removeAttribute('data-has-background');
    };
  }, [appearance, accentColor, grayColor, hasBackground]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to access theme context
 *
 * @returns Theme context value with appearance, accentColor, and grayColor
 * @throws Error if used outside of ThemeProvider
 *
 * @example
 * ```tsx
 * const { appearance, accentColor } = useTheme();
 * ```
 */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
