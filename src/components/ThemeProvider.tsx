/**
 * Copyright (c) 2026 BaseState LLC
 * SPDX-License-Identifier: MIT
 */

/**
 * @file ThemeProvider - Radix UI Themes-inspired theme context
 * @description Sets data attributes on root element following Radix Themes 3 pattern
 * @see https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/theme.tsx
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Available accent colors for the theme
 */
export type AccentColor = 'blue' | 'green' | 'red' | 'amber' | 'purple';

/**
 * Available gray color scales
 */
export type GrayColor = 'gray' | 'slate' | 'auto';

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
 * ThemeProvider component that sets data attributes for Radix-style theming
 *
 * Sets the following data attributes on the wrapper div:
 * - `data-accent-color`: The current accent color
 * - `data-gray-color`: The current gray color scale
 * - `data-has-background`: Whether background is applied
 *
 * Also applies the appropriate theme class (`.dark` or `.light`)
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

  const getThemeClass = (): string => {
    if (appearance === 'dark') {
      return 'dark';
    }
    if (appearance === 'light') {
      return 'light';
    }
    return '';
  };
  const themeClass = getThemeClass();

  return (
    <ThemeContext.Provider value={contextValue}>
      <div
        className={themeClass}
        data-accent-color={accentColor}
        data-gray-color={grayColor}
        data-has-background={hasBackground}
        data-testid="theme-provider"
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
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
